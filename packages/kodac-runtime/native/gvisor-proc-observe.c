#define _GNU_SOURCE

#include <errno.h>
#include <fcntl.h>
#include <inttypes.h>
#include <limits.h>
#include <poll.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <sys/syscall.h>
#include <sys/types.h>
#include <unistd.h>

#define KODAC_RUNSC_ARTIFACT_FD 3
#define KODAC_FAILURE_EXIT 125
#define KODAC_MAX_PROC_STAT_BYTES 8192

#ifndef SYS_pidfd_open
#ifdef __NR_pidfd_open
#define SYS_pidfd_open __NR_pidfd_open
#else
#error "pidfd_open syscall number unavailable"
#endif
#endif

static int fail(const char *message) {
  fprintf(stderr, "kodac-gvisor-proc: %s\n", message);
  return KODAC_FAILURE_EXIT;
}

static int same_artifact_stat(const struct stat *left, const struct stat *right) {
  return left->st_dev == right->st_dev &&
         left->st_ino == right->st_ino &&
         left->st_mode == right->st_mode &&
         left->st_uid == right->st_uid &&
         left->st_gid == right->st_gid &&
         left->st_nlink == right->st_nlink &&
         left->st_size == right->st_size &&
         left->st_mtim.tv_sec == right->st_mtim.tv_sec &&
         left->st_mtim.tv_nsec == right->st_mtim.tv_nsec &&
         left->st_ctim.tv_sec == right->st_ctim.tv_sec &&
         left->st_ctim.tv_nsec == right->st_ctim.tv_nsec;
}

static int parse_pid(const char *text, pid_t *pid_out) {
  if (text == NULL || text[0] == '\0' || (text[0] == '0' && text[1] != '\0')) return -1;
  for (const unsigned char *p = (const unsigned char *)text; *p != '\0'; ++p) {
    if (*p < '0' || *p > '9') return -1;
  }
  errno = 0;
  char *end = NULL;
  unsigned long long value = strtoull(text, &end, 10);
  if (errno != 0 || end == text || *end != '\0' || value == 0 || value > (unsigned long long)INT_MAX) return -1;
  *pid_out = (pid_t)value;
  return 0;
}

static int pidfd_open_exact(pid_t pid) {
  return (int)syscall(SYS_pidfd_open, pid, 0);
}

static int pidfd_is_alive(int pidfd) {
  struct pollfd descriptor = {
    .fd = pidfd,
    .events = POLLIN,
    .revents = 0,
  };
  int result;
  do {
    result = poll(&descriptor, 1, 0);
  } while (result < 0 && errno == EINTR);
  if (result < 0) return -1;
  if (result > 0 || descriptor.revents != 0) return 0;
  return 1;
}

static int read_bounded_file(int fd, char *buffer, size_t capacity, size_t *length_out) {
  size_t used = 0;
  while (used < capacity) {
    ssize_t count;
    do {
      count = read(fd, buffer + used, capacity - used);
    } while (count < 0 && errno == EINTR);
    if (count < 0) return -1;
    if (count == 0) {
      *length_out = used;
      return 0;
    }
    used += (size_t)count;
  }

  char extra;
  ssize_t count;
  do {
    count = read(fd, &extra, 1);
  } while (count < 0 && errno == EINTR);
  if (count < 0) return -1;
  if (count > 0) return 1;
  *length_out = used;
  return 0;
}

static int parse_proc_start_ticks(const char *buffer, size_t length, pid_t expected_pid, uint64_t *ticks_out) {
  if (length == 0 || length > KODAC_MAX_PROC_STAT_BYTES) return -1;

  char local[KODAC_MAX_PROC_STAT_BYTES + 1];
  memcpy(local, buffer, length);
  local[length] = '\0';

  errno = 0;
  char *pid_end = NULL;
  long observed_pid = strtol(local, &pid_end, 10);
  if (errno != 0 || pid_end == local || observed_pid != (long)expected_pid || pid_end[0] != ' ' || pid_end[1] != '(') return -1;

  char *close = strrchr(pid_end + 2, ')');
  if (close == NULL || close[1] != ' ' || close[2] == '\0' || close[3] != ' ') return -1;

  char *cursor = close + 4;
  for (int field = 4; field <= 22; ++field) {
    while (*cursor == ' ') ++cursor;
    if (*cursor == '\0' || *cursor == '\n') return -1;
    char *start = cursor;
    while (*cursor != '\0' && *cursor != ' ' && *cursor != '\n') ++cursor;
    if (field == 22) {
      char saved = *cursor;
      *cursor = '\0';
      if (start[0] == '\0' || start[0] == '-' || start[0] == '+') return -1;
      for (const unsigned char *p = (const unsigned char *)start; *p != '\0'; ++p) {
        if (*p < '0' || *p > '9') return -1;
      }
      errno = 0;
      char *end = NULL;
      unsigned long long ticks = strtoull(start, &end, 10);
      int valid = errno == 0 && end != start && *end == '\0' && ticks != 0;
      *cursor = saved;
      if (!valid) return -1;
      *ticks_out = (uint64_t)ticks;
      return 0;
    }
  }
  return -1;
}

static int open_and_stat_process_exe(const char *exe_path, struct stat *stat_out) {
  int fd = open(exe_path, O_PATH | O_CLOEXEC);
  if (fd < 0) return -1;
  int result = fstat(fd, stat_out);
  int saved_errno = errno;
  close(fd);
  errno = saved_errno;
  return result;
}

int main(int argc, char **argv) {
  if (argc != 3 || strcmp(argv[1], "--pid") != 0) return fail("usage: kodac-gvisor-proc-observe --pid <decimal-positive-pid>");

  pid_t pid;
  if (parse_pid(argv[2], &pid) != 0) return fail("pid must be canonical positive decimal within pid_t range");

  errno = 0;
  int fd_flags = fcntl(KODAC_RUNSC_ARTIFACT_FD, F_GETFD);
  if (fd_flags < 0) return fail("trusted runsc artifact fd 3 is unavailable");
  int status_flags = fcntl(KODAC_RUNSC_ARTIFACT_FD, F_GETFL);
  if (status_flags < 0 || (status_flags & O_ACCMODE) != O_RDONLY) return fail("trusted runsc artifact fd 3 must be read-only");

  struct stat artifact_before;
  if (fstat(KODAC_RUNSC_ARTIFACT_FD, &artifact_before) != 0) return fail("cannot stat trusted runsc artifact fd 3");
  if (!S_ISREG(artifact_before.st_mode) || artifact_before.st_ino == 0 || artifact_before.st_size <= 0) return fail("trusted runsc artifact fd 3 must reference a non-empty regular file");

  int pidfd = pidfd_open_exact(pid);
  if (pidfd < 0) return fail("pidfd_open failed for observed process");

  int alive = pidfd_is_alive(pidfd);
  if (alive <= 0) {
    close(pidfd);
    return fail(alive == 0 ? "observed process exited before inspection" : "cannot poll observed process pidfd");
  }

  char exe_path[64];
  int written = snprintf(exe_path, sizeof(exe_path), "/proc/%ld/exe", (long)pid);
  if (written <= 0 || (size_t)written >= sizeof(exe_path)) {
    close(pidfd);
    return fail("observed process executable path overflow");
  }

  struct stat process_exe;
  if (open_and_stat_process_exe(exe_path, &process_exe) != 0) {
    close(pidfd);
    return fail("cannot open/stat observed process executable");
  }
  if (!S_ISREG(process_exe.st_mode) || process_exe.st_dev != artifact_before.st_dev || process_exe.st_ino != artifact_before.st_ino || process_exe.st_size != artifact_before.st_size) {
    close(pidfd);
    return fail("observed process executable does not match trusted runsc artifact fd 3");
  }

  char stat_path[64];
  written = snprintf(stat_path, sizeof(stat_path), "/proc/%ld/stat", (long)pid);
  if (written <= 0 || (size_t)written >= sizeof(stat_path)) {
    close(pidfd);
    return fail("observed process stat path overflow");
  }

  int stat_fd = open(stat_path, O_RDONLY | O_CLOEXEC);
  if (stat_fd < 0) {
    close(pidfd);
    return fail("cannot open observed process stat record");
  }

  char stat_buffer[KODAC_MAX_PROC_STAT_BYTES];
  size_t stat_length = 0;
  int read_result = read_bounded_file(stat_fd, stat_buffer, sizeof(stat_buffer), &stat_length);
  close(stat_fd);
  if (read_result != 0) {
    close(pidfd);
    return fail(read_result > 0 ? "observed process stat record exceeds bound" : "cannot read observed process stat record");
  }

  uint64_t start_ticks = 0;
  if (parse_proc_start_ticks(stat_buffer, stat_length, pid, &start_ticks) != 0) {
    close(pidfd);
    return fail("cannot parse observed process start ticks");
  }

  struct stat artifact_after;
  if (fstat(KODAC_RUNSC_ARTIFACT_FD, &artifact_after) != 0 || !same_artifact_stat(&artifact_before, &artifact_after)) {
    close(pidfd);
    return fail("trusted runsc artifact metadata changed during observation");
  }

  struct stat process_exe_after;
  if (open_and_stat_process_exe(exe_path, &process_exe_after) != 0 ||
      process_exe_after.st_dev != artifact_before.st_dev ||
      process_exe_after.st_ino != artifact_before.st_ino ||
      process_exe_after.st_size != artifact_before.st_size) {
    close(pidfd);
    return fail("observed process executable changed during inspection");
  }

  alive = pidfd_is_alive(pidfd);
  if (alive <= 0) {
    close(pidfd);
    return fail(alive == 0 ? "observed process exited during inspection" : "cannot repoll observed process pidfd");
  }

  close(pidfd);

  if (printf("kodac-gvisor-proc-v1 pid=%ld start-ticks=%" PRIu64 " exe-dev=%ju exe-ino=%ju exe-size=%ju\n",
             (long)pid,
             start_ticks,
             (uintmax_t)process_exe.st_dev,
             (uintmax_t)process_exe.st_ino,
             (uintmax_t)process_exe.st_size) < 0) {
    return fail("cannot write observation record");
  }
  return 0;
}
