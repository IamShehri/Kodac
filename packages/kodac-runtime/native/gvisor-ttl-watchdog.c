#define _GNU_SOURCE

#include <errno.h>
#include <fcntl.h>
#include <inttypes.h>
#include <limits.h>
#include <linux/if_alg.h>
#include <poll.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/file.h>
#include <sys/random.h>
#include <sys/socket.h>
#include <sys/stat.h>
#include <sys/syscall.h>
#include <sys/timerfd.h>
#include <sys/types.h>
#include <sys/un.h>
#include <time.h>
#include <unistd.h>

#define KODAC_FAILURE_EXIT 125
#define KODAC_INDETERMINATE_EXIT 126
#define KODAC_RESPONSE_TIMEOUT 2
#define KODAC_PROTOCOL_VERSION "kodac-h4-r3g-d-watchdog-protocol-v1"
#define KODAC_LEASE_VERSION "kodac-h4-r3g-d-watchdog-lease-v1"
#define KODAC_ARM_LINE_VERSION "kodac-gvisor-ttl-arm-v1"
#define KODAC_TERMINAL_LINE_VERSION "kodac-gvisor-ttl-terminal-v1"
#define KODAC_CLOCK_NAME "CLOCK_BOOTTIME"
#define KODAC_MAX_PATH_BYTES 4096
#define KODAC_MAX_RPC_BYTES 65536
#define KODAC_MAX_PROC_STAT_BYTES 8192
#define KODAC_MAX_RECORD_BYTES 16384
#define KODAC_BOOT_ID_BYTES 36
#define KODAC_MAX_TTL_MS 86400000ULL
#ifndef KODAC_ARM_DISPATCH_TIMEOUT_MS
#define KODAC_ARM_DISPATCH_TIMEOUT_MS 5000
#endif
#ifndef KODAC_TERMINATION_ACK_TIMEOUT_MS
#define KODAC_TERMINATION_ACK_TIMEOUT_MS 30000
#endif

#ifndef O_PATH
#define O_PATH 010000000
#endif

#ifndef SYS_pidfd_open
#ifdef __NR_pidfd_open
#define SYS_pidfd_open __NR_pidfd_open
#else
#error "pidfd_open syscall number unavailable"
#endif
#endif

typedef struct {
  const char *registry_root;
  const char *arm_operation_identity;
  const char *canonical_arm_payload_digest;
  const char *execution_attempt_identity;
  const char *requirement_identity;
  const char *workload_identity;
  const char *container_binding_identity;
  const char *container_id;
  const char *runtime_instance_identity;
  uint64_t ttl_ms;
  const char *watchdog_implementation_identity;
  const char *control_socket_path;
  uint64_t socket_device;
  uint64_t socket_inode;
  pid_t expected_peer_pid;
  uid_t expected_peer_uid;
  gid_t expected_peer_gid;
  uint64_t expected_start_ticks;
  uint64_t expected_exe_device;
  uint64_t expected_exe_inode;
  uint64_t expected_exe_size;
  const char *runsc_artifact_identity;
  const char *expected_runsc_sha256;
} arm_request;

typedef struct {
  int directory_fd;
  int lock_fd;
  char lock_name[96];
  char lease_name[96];
  char claim_name[96];
  char terminal_name[96];
} lease_registry;

typedef struct {
  int socket_path_fd;
  int wait_fd;
  int processes_fd;
  int signal_fd;
  int pidfd;
  int exe_fd;
  struct ucred peer;
  struct stat endpoint_stat;
  struct stat exe_stat;
  uint64_t start_ticks;
  char control_peer_binding_identity[65];
  char retained_pidfd_process_identity[65];
  char retained_runsc_executable_identity[65];
} retained_subject;

typedef struct {
  char boot_id[37];
  char clock_domain_identity[65];
  uint64_t lease_start_boottime_ns;
  uint64_t deadline_boottime_ns;
  char lease_identity[65];
  char owner_instance_identity[65];
  uint64_t fence_token;
  char claim_record_identity[65];
  char registry_record_identity[65];
} lease_state;

static int fail(const char *message) {
  fprintf(stderr, "kodac-gvisor-ttl: %s\n", message);
  return KODAC_FAILURE_EXIT;
}

static int indeterminate(const char *message) {
  fprintf(stderr, "kodac-gvisor-ttl: indeterminate: %s\n", message);
  return KODAC_INDETERMINATE_EXIT;
}

static void close_if_open(int *fd) {
  if (*fd >= 0) {
    close(*fd);
    *fd = -1;
  }
}

static int is_lower_hex_string(const char *value, size_t exact_length) {
  if (value == NULL || strlen(value) != exact_length) return 0;
  for (size_t i = 0; i < exact_length; ++i) {
    const unsigned char c = (unsigned char)value[i];
    if (!((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f'))) return 0;
  }
  return 1;
}

static int is_boot_id(const char *value) {
  if (value == NULL || strlen(value) != KODAC_BOOT_ID_BYTES) return 0;
  for (size_t i = 0; i < KODAC_BOOT_ID_BYTES; ++i) {
    if (i == 8 || i == 13 || i == 18 || i == 23) {
      if (value[i] != '-') return 0;
      continue;
    }
    const unsigned char c = (unsigned char)value[i];
    if (!((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f'))) return 0;
  }
  return 1;
}

static int parse_u64(const char *text, uint64_t minimum, uint64_t maximum, uint64_t *out) {
  if (text == NULL || text[0] == '\0' || (text[0] == '0' && text[1] != '\0')) return -1;
  for (const unsigned char *p = (const unsigned char *)text; *p != '\0'; ++p) {
    if (*p < '0' || *p > '9') return -1;
  }
  errno = 0;
  char *end = NULL;
  unsigned long long value = strtoull(text, &end, 10);
  if (errno != 0 || end == text || *end != '\0' || value < minimum || value > maximum) return -1;
  *out = (uint64_t)value;
  return 0;
}

static int parse_pid(const char *text, pid_t *out) {
  uint64_t value = 0;
  if (parse_u64(text, 1, INT_MAX, &value) != 0) return -1;
  *out = (pid_t)value;
  return 0;
}

static int parse_uid(const char *text, uid_t *out) {
  uint64_t value = 0;
  if (parse_u64(text, 0, UINT_MAX, &value) != 0) return -1;
  *out = (uid_t)value;
  return 0;
}

static int parse_gid(const char *text, gid_t *out) {
  uint64_t value = 0;
  if (parse_u64(text, 0, UINT_MAX, &value) != 0) return -1;
  *out = (gid_t)value;
  return 0;
}

static int canonical_absolute_path(const char *path) {
  if (path == NULL || path[0] != '/' || path[1] == '\0' || strlen(path) > KODAC_MAX_PATH_BYTES) return 0;
  if (strstr(path, "//") != NULL || strstr(path, "/./") != NULL || strstr(path, "/../") != NULL) return 0;
  size_t length = strlen(path);
  if (length > 1 && path[length - 1] == '/') return 0;
  if (length >= 2 && strcmp(path + length - 2, "/.") == 0) return 0;
  if (length >= 3 && strcmp(path + length - 3, "/..") == 0) return 0;
  return 1;
}

static int exact_flag(const char *actual, const char *expected) {
  return actual != NULL && expected != NULL && strcmp(actual, expected) == 0;
}

static int parse_arm_request(int argc, char **argv, arm_request *request) {
  if (argc != 36 || !exact_flag(argv[1], "--arm") ||
      !exact_flag(argv[2], "--registry-root") ||
      !exact_flag(argv[4], "--arm-operation") ||
      !exact_flag(argv[6], "--arm-payload-digest") ||
      !exact_flag(argv[8], "--execution-attempt") ||
      !exact_flag(argv[10], "--requirement") ||
      !exact_flag(argv[12], "--workload") ||
      !exact_flag(argv[14], "--container-binding") ||
      !exact_flag(argv[16], "--container-id") ||
      !exact_flag(argv[18], "--runtime-instance") ||
      !exact_flag(argv[20], "--ttl-ms") ||
      !exact_flag(argv[22], "--watchdog-implementation") ||
      !exact_flag(argv[24], "--control-socket") ||
      !exact_flag(argv[26], "--socket-device-inode") ||
      !exact_flag(argv[28], "--peer-pid-uid-gid") ||
      !exact_flag(argv[30], "--process-tuple") ||
      !exact_flag(argv[32], "--runsc-artifact") ||
      !exact_flag(argv[34], "--runsc-sha256")) return -1;

  if (!canonical_absolute_path(argv[3]) || !canonical_absolute_path(argv[25])) return -1;
  if (!is_lower_hex_string(argv[5], 64) || !is_lower_hex_string(argv[7], 64) ||
      !is_lower_hex_string(argv[9], 64) || !is_lower_hex_string(argv[11], 64) ||
      !is_lower_hex_string(argv[13], 64) || !is_lower_hex_string(argv[15], 64) ||
      !is_lower_hex_string(argv[17], 64) || !is_lower_hex_string(argv[19], 64) ||
      !is_lower_hex_string(argv[23], 64) || !is_lower_hex_string(argv[33], 64) ||
      !is_lower_hex_string(argv[35], 64)) return -1;

  uint64_t ttl_ms = 0;
  if (parse_u64(argv[21], 1, KODAC_MAX_TTL_MS, &ttl_ms) != 0) return -1;

  char *pair = strdup(argv[27]);
  char *peer = strdup(argv[29]);
  char *process = strdup(argv[31]);
  if (pair == NULL || peer == NULL || process == NULL) { free(pair); free(peer); free(process); return -1; }

  int result = -1;
  char *save = NULL;
  char *device_text = strtok_r(pair, ":", &save);
  char *inode_text = strtok_r(NULL, ":", &save);
  if (device_text == NULL || inode_text == NULL || strtok_r(NULL, ":", &save) != NULL) goto done;
  uint64_t socket_device = 0, socket_inode = 0;
  if (parse_u64(device_text, 1, UINT64_MAX, &socket_device) != 0 || parse_u64(inode_text, 1, UINT64_MAX, &socket_inode) != 0) goto done;

  save = NULL;
  char *pid_text = strtok_r(peer, ":", &save);
  char *uid_text = strtok_r(NULL, ":", &save);
  char *gid_text = strtok_r(NULL, ":", &save);
  if (pid_text == NULL || uid_text == NULL || gid_text == NULL || strtok_r(NULL, ":", &save) != NULL) goto done;
  pid_t expected_peer_pid;
  uid_t expected_peer_uid;
  gid_t expected_peer_gid;
  if (parse_pid(pid_text, &expected_peer_pid) != 0 || parse_uid(uid_text, &expected_peer_uid) != 0 || parse_gid(gid_text, &expected_peer_gid) != 0) goto done;

  save = NULL;
  char *ticks_text = strtok_r(process, ":", &save);
  char *exe_device_text = strtok_r(NULL, ":", &save);
  char *exe_inode_text = strtok_r(NULL, ":", &save);
  char *exe_size_text = strtok_r(NULL, ":", &save);
  if (ticks_text == NULL || exe_device_text == NULL || exe_inode_text == NULL || exe_size_text == NULL || strtok_r(NULL, ":", &save) != NULL) goto done;
  uint64_t expected_start_ticks = 0, expected_exe_device = 0, expected_exe_inode = 0, expected_exe_size = 0;
  if (parse_u64(ticks_text, 1, UINT64_MAX, &expected_start_ticks) != 0 ||
      parse_u64(exe_device_text, 1, UINT64_MAX, &expected_exe_device) != 0 ||
      parse_u64(exe_inode_text, 1, UINT64_MAX, &expected_exe_inode) != 0 ||
      parse_u64(exe_size_text, 1, UINT64_MAX, &expected_exe_size) != 0) goto done;

  request->registry_root = argv[3];
  request->arm_operation_identity = argv[5];
  request->canonical_arm_payload_digest = argv[7];
  request->execution_attempt_identity = argv[9];
  request->requirement_identity = argv[11];
  request->workload_identity = argv[13];
  request->container_binding_identity = argv[15];
  request->container_id = argv[17];
  request->runtime_instance_identity = argv[19];
  request->ttl_ms = ttl_ms;
  request->watchdog_implementation_identity = argv[23];
  request->control_socket_path = argv[25];
  request->socket_device = socket_device;
  request->socket_inode = socket_inode;
  request->expected_peer_pid = expected_peer_pid;
  request->expected_peer_uid = expected_peer_uid;
  request->expected_peer_gid = expected_peer_gid;
  request->expected_start_ticks = expected_start_ticks;
  request->expected_exe_device = expected_exe_device;
  request->expected_exe_inode = expected_exe_inode;
  request->expected_exe_size = expected_exe_size;
  request->runsc_artifact_identity = argv[33];
  request->expected_runsc_sha256 = argv[35];
  result = 0;

done:
  free(pair); free(peer); free(process);
  return result;
}

static int pidfd_open_exact(pid_t pid) {
  return (int)syscall(SYS_pidfd_open, pid, 0);
}

static int pidfd_is_alive(int pidfd) {
  struct pollfd pfd = { .fd = pidfd, .events = POLLIN, .revents = 0 };
  int result;
  do { result = poll(&pfd, 1, 0); } while (result < 0 && errno == EINTR);
  if (result < 0) return -1;
  return result == 0 && pfd.revents == 0 ? 1 : 0;
}

static int read_bounded_fd(int fd, char *buffer, size_t capacity, size_t *length_out) {
  size_t used = 0;
  while (used < capacity) {
    ssize_t count;
    do { count = read(fd, buffer + used, capacity - used); } while (count < 0 && errno == EINTR);
    if (count < 0) return -1;
    if (count == 0) { *length_out = used; return 0; }
    used += (size_t)count;
  }
  char extra;
  ssize_t count;
  do { count = read(fd, &extra, 1); } while (count < 0 && errno == EINTR);
  if (count < 0) return -1;
  return count == 0 ? (*length_out = used, 0) : 1;
}

static int parse_proc_start_ticks(const char *buffer, size_t length, pid_t expected_pid, uint64_t *ticks_out) {
  if (length == 0 || length > KODAC_MAX_PROC_STAT_BYTES) return -1;
  char local[KODAC_MAX_PROC_STAT_BYTES + 1];
  memcpy(local, buffer, length); local[length] = '\0';
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
      char saved = *cursor; *cursor = '\0';
      uint64_t value = 0; int valid = parse_u64(start, 1, UINT64_MAX, &value) == 0;
      *cursor = saved;
      if (!valid) return -1;
      *ticks_out = value;
      return 0;
    }
  }
  return -1;
}

static int read_process_start_ticks(pid_t pid, uint64_t *ticks_out) {
  char path[64];
  int written = snprintf(path, sizeof(path), "/proc/%ld/stat", (long)pid);
  if (written <= 0 || (size_t)written >= sizeof(path)) return -1;
  int fd = open(path, O_RDONLY | O_CLOEXEC);
  if (fd < 0) return -1;
  char buffer[KODAC_MAX_PROC_STAT_BYTES]; size_t length = 0;
  int result = read_bounded_fd(fd, buffer, sizeof(buffer), &length);
  int saved = errno; close(fd); errno = saved;
  if (result != 0) return -1;
  return parse_proc_start_ticks(buffer, length, pid, ticks_out);
}

static int open_sha256_operation(void) {
  int transform_fd = socket(AF_ALG, SOCK_SEQPACKET | SOCK_CLOEXEC, 0);
  if (transform_fd < 0) return -1;
  struct sockaddr_alg address;
  memset(&address, 0, sizeof(address));
  address.salg_family = AF_ALG;
  memcpy(address.salg_type, "hash", 5);
  memcpy(address.salg_name, "sha256", 7);
  if (bind(transform_fd, (struct sockaddr *)&address, sizeof(address)) != 0) { close(transform_fd); return -1; }
  int operation_fd = accept4(transform_fd, NULL, NULL, SOCK_CLOEXEC);
  close(transform_fd);
  return operation_fd;
}

static int read_sha256_digest(int operation_fd, char out_hex[65]) {
  unsigned char digest[32]; size_t offset = 0;
  while (offset < sizeof(digest)) {
    ssize_t count;
    do { count = read(operation_fd, digest + offset, sizeof(digest) - offset); } while (count < 0 && errno == EINTR);
    if (count <= 0) return -1;
    offset += (size_t)count;
  }
  static const char hex[] = "0123456789abcdef";
  for (size_t i = 0; i < sizeof(digest); ++i) { out_hex[i * 2] = hex[digest[i] >> 4]; out_hex[i * 2 + 1] = hex[digest[i] & 0x0f]; }
  out_hex[64] = '\0';
  return 0;
}

static int sha256_fd(int source_fd, char out_hex[65]) {
  struct stat source_stat;
  if (fstat(source_fd, &source_stat) != 0 || !S_ISREG(source_stat.st_mode) || source_stat.st_size < 0) return -1;
  uint64_t remaining = (uint64_t)source_stat.st_size;
  if (lseek(source_fd, 0, SEEK_SET) < 0) return -1;
  int operation_fd = open_sha256_operation();
  if (operation_fd < 0) return -1;
  if (remaining == 0) {
    if (send(operation_fd, NULL, 0, 0) < 0) { close(operation_fd); return -1; }
  }
  unsigned char buffer[65536];
  while (remaining > 0) {
    size_t wanted = remaining < sizeof(buffer) ? (size_t)remaining : sizeof(buffer);
    ssize_t count;
    do { count = read(source_fd, buffer, wanted); } while (count < 0 && errno == EINTR);
    if (count <= 0 || (uint64_t)count > remaining) { close(operation_fd); return -1; }
    remaining -= (uint64_t)count;
    int flags = remaining == 0 ? 0 : MSG_MORE;
    ssize_t sent;
    do { sent = send(operation_fd, buffer, (size_t)count, flags); } while (sent < 0 && errno == EINTR);
    if (sent != count) { close(operation_fd); return -1; }
  }
  int result = read_sha256_digest(operation_fd, out_hex);
  close(operation_fd);
  return result;
}

static int sha256_bytes(const void *bytes, size_t length, char out_hex[65]) {
  int operation_fd = open_sha256_operation();
  if (operation_fd < 0) return -1;
  ssize_t sent;
  do { sent = send(operation_fd, bytes, length, 0); } while (sent < 0 && errno == EINTR);
  if (sent < 0 || (size_t)sent != length) { close(operation_fd); return -1; }
  int result = read_sha256_digest(operation_fd, out_hex);
  close(operation_fd);
  return result;
}

static int append_hash_component(char *buffer, size_t capacity, size_t *offset, const char *value) {
  size_t length = strlen(value);
  if (*offset + length + 1 > capacity) return -1;
  memcpy(buffer + *offset, value, length); *offset += length; buffer[(*offset)++] = '\0';
  return 0;
}

static int hash_joined(char out_hex[65], const char *domain, const char *const *parts, size_t count) {
  char buffer[KODAC_MAX_RECORD_BYTES]; size_t offset = 0;
  if (append_hash_component(buffer, sizeof(buffer), &offset, "KODAC-H4-R3G-D-WATCHDOG") != 0 ||
      append_hash_component(buffer, sizeof(buffer), &offset, domain) != 0 ||
      append_hash_component(buffer, sizeof(buffer), &offset, "V1") != 0) return -1;
  for (size_t i = 0; i < count; ++i) if (append_hash_component(buffer, sizeof(buffer), &offset, parts[i]) != 0) return -1;
  return sha256_bytes(buffer, offset, out_hex);
}

static int random_identity(char out_hex[65]) {
  unsigned char bytes[32]; size_t offset = 0;
  while (offset < sizeof(bytes)) {
    ssize_t count;
    do { count = getrandom(bytes + offset, sizeof(bytes) - offset, 0); } while (count < 0 && errno == EINTR);
    if (count <= 0) return -1;
    offset += (size_t)count;
  }
  return sha256_bytes(bytes, sizeof(bytes), out_hex);
}

static int read_boot_id(char out[37]) {
  int fd = open("/proc/sys/kernel/random/boot_id", O_RDONLY | O_CLOEXEC | O_NOFOLLOW);
  if (fd < 0) return -1;
  char buffer[64]; size_t length = 0;
  int result = read_bounded_fd(fd, buffer, sizeof(buffer) - 1, &length);
  int saved = errno; close(fd); errno = saved;
  if (result != 0 || length == 0) return -1;
  while (length > 0 && (buffer[length - 1] == '\n' || buffer[length - 1] == '\r')) --length;
  buffer[length] = '\0';
  if (!is_boot_id(buffer)) return -1;
  memcpy(out, buffer, 37);
  return 0;
}

static int boottime_ns(uint64_t *out) {
  struct timespec value;
  if (clock_gettime(CLOCK_BOOTTIME, &value) != 0 || value.tv_sec < 0 || value.tv_nsec < 0 || value.tv_nsec >= 1000000000L) return -1;
  uint64_t seconds = (uint64_t)value.tv_sec;
  if (seconds > (UINT64_MAX - (uint64_t)value.tv_nsec) / 1000000000ULL) return -1;
  *out = seconds * 1000000000ULL + (uint64_t)value.tv_nsec;
  return 0;
}

static int boottime_deadline_after_ms(uint64_t milliseconds, uint64_t *out) {
  uint64_t now = 0;
  if (boottime_ns(&now) != 0 || milliseconds > (UINT64_MAX - now) / 1000000ULL) return -1;
  *out = now + milliseconds * 1000000ULL;
  return 0;
}

static int open_registry(const arm_request *request, lease_registry *registry) {
  memset(registry, 0, sizeof(*registry)); registry->directory_fd = -1; registry->lock_fd = -1;
  registry->directory_fd = open(request->registry_root, O_RDONLY | O_DIRECTORY | O_NOFOLLOW | O_CLOEXEC);
  if (registry->directory_fd < 0) return -1;
  struct stat root;
  if (fstat(registry->directory_fd, &root) != 0 || !S_ISDIR(root.st_mode) || root.st_uid != geteuid() || (root.st_mode & 0022) != 0) return -1;
  if (snprintf(registry->lock_name, sizeof(registry->lock_name), "%s.lock", request->arm_operation_identity) >= (int)sizeof(registry->lock_name) ||
      snprintf(registry->lease_name, sizeof(registry->lease_name), "%s.lease", request->arm_operation_identity) >= (int)sizeof(registry->lease_name) ||
      snprintf(registry->claim_name, sizeof(registry->claim_name), "%s.claim", request->arm_operation_identity) >= (int)sizeof(registry->claim_name) ||
      snprintf(registry->terminal_name, sizeof(registry->terminal_name), "%s.terminal", request->arm_operation_identity) >= (int)sizeof(registry->terminal_name)) return -1;
  registry->lock_fd = openat(registry->directory_fd, registry->lock_name, O_RDWR | O_CREAT | O_NOFOLLOW | O_CLOEXEC, 0600);
  if (registry->lock_fd < 0) return -1;
  struct stat lock_stat;
  if (fstat(registry->lock_fd, &lock_stat) != 0 || !S_ISREG(lock_stat.st_mode) || lock_stat.st_uid != geteuid() || lock_stat.st_nlink != 1 || (lock_stat.st_mode & 0077) != 0) return -1;
  if (flock(registry->lock_fd, LOCK_EX | LOCK_NB) != 0) return -1;
  struct stat named;
  if (fstatat(registry->directory_fd, registry->lock_name, &named, AT_SYMLINK_NOFOLLOW) != 0 || named.st_dev != lock_stat.st_dev || named.st_ino != lock_stat.st_ino) return -1;
  return 0;
}

static int durable_replace_at(int directory_fd, const char *final_name, const char *payload, size_t length) {
  char temporary[128]; unsigned char nonce[8]; size_t random_offset = 0;
  while (random_offset < sizeof(nonce)) {
    ssize_t count;
    do { count = getrandom(nonce + random_offset, sizeof(nonce) - random_offset, 0); } while (count < 0 && errno == EINTR);
    if (count <= 0) return -1;
    random_offset += (size_t)count;
  }
  int written = snprintf(temporary, sizeof(temporary), ".tmp-%ld-%02x%02x%02x%02x%02x%02x%02x%02x", (long)getpid(), nonce[0], nonce[1], nonce[2], nonce[3], nonce[4], nonce[5], nonce[6], nonce[7]);
  if (written <= 0 || (size_t)written >= sizeof(temporary)) return -1;
  int fd = openat(directory_fd, temporary, O_WRONLY | O_CREAT | O_EXCL | O_NOFOLLOW | O_CLOEXEC, 0600);
  if (fd < 0) return -1;
  size_t offset = 0; int result = -1;
  while (offset < length) {
    ssize_t count;
    do { count = write(fd, payload + offset, length - offset); } while (count < 0 && errno == EINTR);
    if (count <= 0) goto done;
    offset += (size_t)count;
  }
  if (fsync(fd) != 0) goto done;
  if (renameat(directory_fd, temporary, directory_fd, final_name) != 0) goto done;
  if (fsync(directory_fd) != 0) goto done;
  result = 0;
done:
  { int saved = errno; close(fd); if (result != 0) unlinkat(directory_fd, temporary, 0); errno = saved; }
  return result;
}

static int durable_create_claim(const arm_request *request, lease_registry *registry, lease_state *lease) {
  if (random_identity(lease->owner_instance_identity) != 0) return -1;
  lease->fence_token = 1;
  char token[32]; snprintf(token, sizeof(token), "%" PRIu64, lease->fence_token);
  const char *parts[] = { request->arm_operation_identity, lease->owner_instance_identity, token, lease->boot_id };
  if (hash_joined(lease->claim_record_identity, "OWNER_CLAIM", parts, 4) != 0) return -1;
  char record[KODAC_MAX_RECORD_BYTES];
  int length = snprintf(record, sizeof(record), "version=kodac-h4-r3g-d-owner-claim-v1\narmOperationIdentity=%s\nownerInstanceIdentity=%s\nterminalFenceToken=%s\nlinuxBootId=%s\nclaimRecordIdentity=%s\n", request->arm_operation_identity, lease->owner_instance_identity, token, lease->boot_id, lease->claim_record_identity);
  if (length <= 0 || (size_t)length >= sizeof(record)) return -1;
  return durable_replace_at(registry->directory_fd, registry->claim_name, record, (size_t)length);
}

static int durable_create_lease(const arm_request *request, lease_registry *registry, lease_state *lease) {
  char start[32], deadline[32], ttl[32], fence[32];
  snprintf(start, sizeof(start), "%" PRIu64, lease->lease_start_boottime_ns);
  snprintf(deadline, sizeof(deadline), "%" PRIu64, lease->deadline_boottime_ns);
  snprintf(ttl, sizeof(ttl), "%" PRIu64, request->ttl_ms);
  snprintf(fence, sizeof(fence), "%" PRIu64, lease->fence_token);
  const char *lease_parts[] = { request->arm_operation_identity, request->canonical_arm_payload_digest, request->runtime_instance_identity, lease->boot_id, start, deadline, request->watchdog_implementation_identity };
  if (hash_joined(lease->lease_identity, "LEASE", lease_parts, 7) != 0) return -1;
  const char *registry_parts[] = { KODAC_LEASE_VERSION, request->arm_operation_identity, request->canonical_arm_payload_digest, lease->lease_identity, request->execution_attempt_identity, request->requirement_identity, request->workload_identity, request->container_binding_identity, request->container_id, request->runtime_instance_identity, ttl, lease->boot_id, lease->clock_domain_identity, start, deadline, request->watchdog_implementation_identity, lease->owner_instance_identity, fence, lease->claim_record_identity };
  if (hash_joined(lease->registry_record_identity, "LEASE_REGISTRY", registry_parts, 19) != 0) return -1;
  char record[KODAC_MAX_RECORD_BYTES];
  int length = snprintf(record, sizeof(record),
    "version=%s\narmOperationIdentity=%s\ncanonicalArmPayloadDigest=%s\nleaseIdentity=%s\nexecutionAttemptIdentity=%s\nrequirementIdentity=%s\nworkloadIdentity=%s\ncontainerBindingIdentity=%s\ncontainerId=%s\nruntimeInstanceIdentity=%s\nttlMs=%s\nlinuxBootId=%s\nclockDomainIdentity=%s\nleaseStartBoottimeNs=%s\ndeadlineBoottimeNs=%s\nwatchdogImplementationIdentity=%s\nphysicalArmState=ARMED\nownerInstanceIdentity=%s\nterminalFenceToken=%s\nclaimRecordIdentity=%s\nregistryRecordIdentity=%s\n",
    KODAC_LEASE_VERSION, request->arm_operation_identity, request->canonical_arm_payload_digest, lease->lease_identity, request->execution_attempt_identity, request->requirement_identity, request->workload_identity, request->container_binding_identity, request->container_id, request->runtime_instance_identity, ttl, lease->boot_id, lease->clock_domain_identity, start, deadline, request->watchdog_implementation_identity, lease->owner_instance_identity, fence, lease->claim_record_identity, lease->registry_record_identity);
  if (length <= 0 || (size_t)length >= sizeof(record)) return -1;
  return durable_replace_at(registry->directory_fd, registry->lease_name, record, (size_t)length);
}

static int endpoint_pin(const arm_request *request, retained_subject *subject) {
  subject->socket_path_fd = open(request->control_socket_path, O_PATH | O_NOFOLLOW | O_CLOEXEC);
  if (subject->socket_path_fd < 0) return -1;
  if (fstat(subject->socket_path_fd, &subject->endpoint_stat) != 0 || !S_ISSOCK(subject->endpoint_stat.st_mode)) return -1;
  if ((uint64_t)subject->endpoint_stat.st_dev != request->socket_device || (uint64_t)subject->endpoint_stat.st_ino != request->socket_inode) return -1;
  return 0;
}

static int connect_pinned_socket(int path_fd, struct ucred expected_peer, int *out_fd) {
  int fd = socket(AF_UNIX, SOCK_STREAM | SOCK_CLOEXEC, 0);
  if (fd < 0) return -1;
  struct sockaddr_un address; memset(&address, 0, sizeof(address)); address.sun_family = AF_UNIX;
  int written = snprintf(address.sun_path, sizeof(address.sun_path), "/proc/self/fd/%d", path_fd);
  if (written <= 0 || (size_t)written >= sizeof(address.sun_path)) { close(fd); return -1; }
  if (connect(fd, (struct sockaddr *)&address, offsetof(struct sockaddr_un, sun_path) + (size_t)written + 1) != 0) { close(fd); return -1; }
  struct ucred observed; socklen_t length = sizeof(observed);
  if (getsockopt(fd, SOL_SOCKET, SO_PEERCRED, &observed, &length) != 0 || length != sizeof(observed)) { close(fd); return -1; }
  if (observed.pid != expected_peer.pid || observed.uid != expected_peer.uid || observed.gid != expected_peer.gid) { close(fd); return -1; }
  *out_fd = fd;
  return 0;
}

static int authenticate_subject(const arm_request *request, retained_subject *subject) {
  memset(subject, 0, sizeof(*subject));
  subject->socket_path_fd = subject->wait_fd = subject->processes_fd = subject->signal_fd = subject->pidfd = subject->exe_fd = -1;
  if (endpoint_pin(request, subject) != 0) return -1;
  struct ucred expected = { .pid = request->expected_peer_pid, .uid = request->expected_peer_uid, .gid = request->expected_peer_gid };
  if (connect_pinned_socket(subject->socket_path_fd, expected, &subject->wait_fd) != 0 ||
      connect_pinned_socket(subject->socket_path_fd, expected, &subject->processes_fd) != 0 ||
      connect_pinned_socket(subject->socket_path_fd, expected, &subject->signal_fd) != 0) return -1;
  subject->peer = expected;
  subject->pidfd = pidfd_open_exact(expected.pid);
  if (subject->pidfd < 0 || pidfd_is_alive(subject->pidfd) != 1) return -1;
  if (read_process_start_ticks(expected.pid, &subject->start_ticks) != 0 || subject->start_ticks != request->expected_start_ticks) return -1;
  char exe_path[64]; int written = snprintf(exe_path, sizeof(exe_path), "/proc/%ld/exe", (long)expected.pid);
  if (written <= 0 || (size_t)written >= sizeof(exe_path)) return -1;
  subject->exe_fd = open(exe_path, O_RDONLY | O_CLOEXEC);
  if (subject->exe_fd < 0 || fstat(subject->exe_fd, &subject->exe_stat) != 0 || !S_ISREG(subject->exe_stat.st_mode)) return -1;
  if ((uint64_t)subject->exe_stat.st_dev != request->expected_exe_device || (uint64_t)subject->exe_stat.st_ino != request->expected_exe_inode || (uint64_t)subject->exe_stat.st_size != request->expected_exe_size) return -1;
  char digest[65];
  if (sha256_fd(subject->exe_fd, digest) != 0 || strcmp(digest, request->expected_runsc_sha256) != 0) return -1;
  if (pidfd_is_alive(subject->pidfd) != 1) return -1;
  uint64_t ticks_after = 0;
  if (read_process_start_ticks(expected.pid, &ticks_after) != 0 || ticks_after != subject->start_ticks) return -1;
  char pid[32], uid[32], gid[32], start[32], dev[32], ino[32], size[32], socket_dev[32], socket_ino[32];
  snprintf(pid, sizeof(pid), "%ld", (long)expected.pid); snprintf(uid, sizeof(uid), "%u", (unsigned)expected.uid); snprintf(gid, sizeof(gid), "%u", (unsigned)expected.gid);
  snprintf(start, sizeof(start), "%" PRIu64, subject->start_ticks); snprintf(dev, sizeof(dev), "%ju", (uintmax_t)subject->exe_stat.st_dev); snprintf(ino, sizeof(ino), "%ju", (uintmax_t)subject->exe_stat.st_ino); snprintf(size, sizeof(size), "%ju", (uintmax_t)subject->exe_stat.st_size);
  snprintf(socket_dev, sizeof(socket_dev), "%ju", (uintmax_t)subject->endpoint_stat.st_dev); snprintf(socket_ino, sizeof(socket_ino), "%ju", (uintmax_t)subject->endpoint_stat.st_ino);
  const char *peer_parts[] = { request->runtime_instance_identity, request->container_id, socket_dev, socket_ino, pid, uid, gid, start, dev, ino, size, digest };
  if (hash_joined(subject->control_peer_binding_identity, "CONTROL_PEER", peer_parts, 12) != 0) return -1;
  const char *pidfd_parts[] = { pid, start, dev, ino, size, request->runtime_instance_identity };
  if (hash_joined(subject->retained_pidfd_process_identity, "PIDFD_PROCESS", pidfd_parts, 6) != 0) return -1;
  const char *exe_parts[] = { digest, dev, ino, size, request->runsc_artifact_identity };
  if (hash_joined(subject->retained_runsc_executable_identity, "RUNSC_EXECUTABLE", exe_parts, 5) != 0) return -1;
  return 0;
}

static void close_subject(retained_subject *subject) {
  close_if_open(&subject->wait_fd); close_if_open(&subject->processes_fd); close_if_open(&subject->signal_fd); close_if_open(&subject->pidfd); close_if_open(&subject->exe_fd); close_if_open(&subject->socket_path_fd);
}

static int create_absolute_timer(uint64_t deadline_ns);

static int poll_io_with_boottime_timer(int fd, short io_events, int timer_fd) {
  struct pollfd pollfds[2] = {
    { .fd = fd, .events = io_events, .revents = 0 },
    { .fd = timer_fd, .events = POLLIN, .revents = 0 },
  };
  int result;
  do { result = poll(pollfds, 2, -1); } while (result < 0 && errno == EINTR);
  if (result < 0) return -1;
  if ((pollfds[1].revents & POLLIN) != 0) return KODAC_RESPONSE_TIMEOUT;
  if (pollfds[1].revents != 0) return -1;
  if ((pollfds[0].revents & io_events) != 0) return 0;
  return -1;
}

static int write_all_until_boottime(int fd, const char *buffer, size_t length, uint64_t deadline_ns) {
  int timer_fd = create_absolute_timer(deadline_ns);
  if (timer_fd < 0) return -1;
  size_t offset = 0;
  int result = 0;
  while (offset < length) {
    int ready = poll_io_with_boottime_timer(fd, POLLOUT, timer_fd);
    if (ready != 0) { result = ready; break; }
    ssize_t count;
    do { count = send(fd, buffer + offset, length - offset, MSG_NOSIGNAL | MSG_DONTWAIT); } while (count < 0 && errno == EINTR);
    if (count < 0 && (errno == EAGAIN || errno == EWOULDBLOCK)) continue;
    if (count <= 0) { result = -1; break; }
    offset += (size_t)count;
  }
  close(timer_fd);
  return result;
}

static int send_rpc(int fd, const char *method, const char *container_id, int signal_request, uint64_t deadline_ns) {
  char request[512];
  int length;
  if (signal_request) length = snprintf(request, sizeof(request), "{\"method\":\"%s\",\"arg\":{\"CID\":\"%s\",\"Signo\":9,\"PID\":0,\"Mode\":1}}", method, container_id);
  else length = snprintf(request, sizeof(request), "{\"method\":\"%s\",\"arg\":\"%s\"}", method, container_id);
  if (length <= 0 || (size_t)length >= sizeof(request)) return -1;
  return write_all_until_boottime(fd, request, (size_t)length, deadline_ns);
}

static int read_json_object(int fd, char *buffer, size_t capacity, size_t *length_out, uint64_t deadline_ns) {
  int timer_fd = create_absolute_timer(deadline_ns);
  if (timer_fd < 0) return -1;
  size_t used = 0; int started = 0, depth = 0, in_string = 0, escaped = 0;
  int result = -1;
  for (;;) {
    int ready = poll_io_with_boottime_timer(fd, POLLIN, timer_fd);
    if (ready != 0) { result = ready; break; }
    char byte;
    ssize_t count;
    do { count = read(fd, &byte, 1); } while (count < 0 && errno == EINTR);
    if (count <= 0) break;
    if (used + 1 >= capacity) break;
    buffer[used++] = byte;
    if (!started) {
      if (byte == ' ' || byte == '\t' || byte == '\r' || byte == '\n') continue;
      if (byte != '{') break;
      started = 1; depth = 1; continue;
    }
    if (in_string) {
      if (escaped) { escaped = 0; continue; }
      if (byte == '\\') { escaped = 1; continue; }
      if (byte == '"') in_string = 0;
      continue;
    }
    if (byte == '"') { in_string = 1; continue; }
    if (byte == '{' || byte == '[') ++depth;
    else if (byte == '}' || byte == ']') {
      --depth;
      if (depth < 0) break;
      if (depth == 0) { buffer[used] = '\0'; *length_out = used; result = 0; break; }
    }
  }
  close(timer_fd);
  return result;
}

static const char *successful_result(const char *json) {
  static const char prefix[] = "{\"success\":true,\"err\":\"\",\"result\":";
  while (*json == ' ' || *json == '\t' || *json == '\r' || *json == '\n') ++json;
  size_t length = sizeof(prefix) - 1;
  return strncmp(json, prefix, length) == 0 ? json + length : NULL;
}

static int response_success(int fd, int require_nonempty_array, char identity_out[65], uint64_t deadline_ns) {
  char response[KODAC_MAX_RPC_BYTES + 1]; size_t length = 0;
  int read_result = read_json_object(fd, response, sizeof(response), &length, deadline_ns);
  if (read_result != 0) return read_result;
  const char *result = successful_result(response);
  if (result == NULL) return -1;
  if (require_nonempty_array) {
    while (*result == ' ' || *result == '\t' || *result == '\r' || *result == '\n') ++result;
    if (*result != '[') return -1;
    ++result; while (*result == ' ' || *result == '\t' || *result == '\r' || *result == '\n') ++result;
    if (*result == ']') return 1;
  }
  return identity_out == NULL ? 0 : sha256_bytes(response, length, identity_out);
}

static int revalidate_retained_subject(const arm_request *request, retained_subject *subject) {
  if (pidfd_is_alive(subject->pidfd) != 1) return -1;
  struct stat endpoint;
  if (fstat(subject->socket_path_fd, &endpoint) != 0 || endpoint.st_dev != subject->endpoint_stat.st_dev || endpoint.st_ino != subject->endpoint_stat.st_ino) return -1;
  struct stat exe;
  if (fstat(subject->exe_fd, &exe) != 0 || exe.st_dev != subject->exe_stat.st_dev || exe.st_ino != subject->exe_stat.st_ino || exe.st_size != subject->exe_stat.st_size) return -1;
  uint64_t ticks = 0;
  if (read_process_start_ticks(request->expected_peer_pid, &ticks) != 0 || ticks != subject->start_ticks) return -1;
  char digest[65]; if (sha256_fd(subject->exe_fd, digest) != 0 || strcmp(digest, request->expected_runsc_sha256) != 0) return -1;
  return pidfd_is_alive(subject->pidfd) == 1 ? 0 : -1;
}

static int create_absolute_timer(uint64_t deadline_ns) {
  int fd = timerfd_create(CLOCK_BOOTTIME, TFD_CLOEXEC | TFD_NONBLOCK);
  if (fd < 0) return -1;
  struct itimerspec spec; memset(&spec, 0, sizeof(spec));
  spec.it_value.tv_sec = (time_t)(deadline_ns / 1000000000ULL);
  spec.it_value.tv_nsec = (long)(deadline_ns % 1000000000ULL);
  if (timerfd_settime(fd, TFD_TIMER_ABSTIME, &spec, NULL) != 0) { close(fd); return -1; }
  return fd;
}

static int read_timer(int fd) {
  uint64_t expirations = 0;
  ssize_t count;
  do { count = read(fd, &expirations, sizeof(expirations)); } while (count < 0 && errno == EINTR);
  return count == (ssize_t)sizeof(expirations) && expirations > 0 ? 0 : -1;
}

static int emit_arm_ack(const arm_request *request, const retained_subject *subject, const lease_state *lease) {
  char physical_ack_identity[65];
  const char *parts[] = { lease->lease_identity, request->arm_operation_identity, request->runtime_instance_identity, subject->control_peer_binding_identity, request->runsc_artifact_identity, request->expected_runsc_sha256, lease->registry_record_identity, lease->clock_domain_identity, lease->boot_id, lease->owner_instance_identity, lease->claim_record_identity };
  if (hash_joined(physical_ack_identity, "PHYSICAL_ARM_ACK", parts, 11) != 0) return -1;
  if (printf("%s lease=%s arm-operation=%s runtime-instance=%s control-peer=%s runsc-artifact=%s verified-runsc-sha256=%s registry-record=%s clock-domain=%s boot-id=%s lease-start-boottime-ns=%" PRIu64 " deadline-boottime-ns=%" PRIu64 " owner-instance=%s terminal-fence-token=%" PRIu64 " claim-record=%s physical-ack=%s\n",
      KODAC_ARM_LINE_VERSION, lease->lease_identity, request->arm_operation_identity, request->runtime_instance_identity, subject->control_peer_binding_identity, request->runsc_artifact_identity, request->expected_runsc_sha256, lease->registry_record_identity, lease->clock_domain_identity, lease->boot_id, lease->lease_start_boottime_ns, lease->deadline_boottime_ns, lease->owner_instance_identity, lease->fence_token, lease->claim_record_identity, physical_ack_identity) < 0) return -1;
  return fflush(stdout) == 0 ? 0 : -1;
}

static int durable_terminal(const arm_request *request, lease_registry *registry, const lease_state *lease, const retained_subject *subject, const char *outcome, const char *exit_ns, const char *live_ns, const char *live_probe_identity, const char *process_set_identity, const char *signal_identity, const char *termination_identity, char registry_terminal_identity[65]) {
  char fence[32]; snprintf(fence, sizeof(fence), "%" PRIu64, lease->fence_token);
  const char *parts[] = { request->arm_operation_identity, lease->lease_identity, request->runtime_instance_identity, outcome, lease->owner_instance_identity, fence, lease->claim_record_identity, subject->control_peer_binding_identity, subject->retained_pidfd_process_identity, request->runsc_artifact_identity, request->expected_runsc_sha256, subject->retained_runsc_executable_identity, lease->clock_domain_identity, lease->boot_id, exit_ns, live_ns, live_probe_identity, process_set_identity, signal_identity, termination_identity };
  if (hash_joined(registry_terminal_identity, "TERMINAL_REGISTRY", parts, 20) != 0) return -1;
  char record[KODAC_MAX_RECORD_BYTES];
  int length = snprintf(record, sizeof(record), "version=kodac-h4-r3g-d-terminal-registry-v1\narmOperationIdentity=%s\nleaseIdentity=%s\nruntimeInstanceIdentity=%s\nterminalOutcome=%s\nownerInstanceIdentity=%s\nterminalFenceToken=%s\nclaimRecordIdentity=%s\ncontrolPeerBindingIdentity=%s\nretainedPidfdProcessIdentity=%s\nrunscArtifactIdentity=%s\nverifiedRunscSha256=%s\nretainedRunscExecutableIdentity=%s\nclockDomainIdentity=%s\nlinuxBootId=%s\nexitEventObservedBoottimeNs=%s\nliveAtExpiryObservedBoottimeNs=%s\nliveAtExpiryProbeIdentity=%s\nliveAtExpiryProcessSetIdentity=%s\nsignalAcknowledgementIdentity=%s\nterminationAcknowledgementIdentity=%s\nregistryTerminalRecordIdentity=%s\n", request->arm_operation_identity, lease->lease_identity, request->runtime_instance_identity, outcome, lease->owner_instance_identity, fence, lease->claim_record_identity, subject->control_peer_binding_identity, subject->retained_pidfd_process_identity, request->runsc_artifact_identity, request->expected_runsc_sha256, subject->retained_runsc_executable_identity, lease->clock_domain_identity, lease->boot_id, exit_ns, live_ns, live_probe_identity, process_set_identity, signal_identity, termination_identity, registry_terminal_identity);
  if (length <= 0 || (size_t)length >= sizeof(record)) return -1;
  return durable_replace_at(registry->directory_fd, registry->terminal_name, record, (size_t)length);
}

static int emit_terminal(const arm_request *request, const lease_state *lease, const retained_subject *subject, const char *outcome, const char *exit_ns, const char *live_ns, const char *live_probe_identity, const char *process_set_identity, const char *signal_identity, const char *termination_identity, const char *registry_terminal_identity) {
  if (printf("%s lease=%s arm-operation=%s runtime-instance=%s outcome=%s owner-instance=%s terminal-fence-token=%" PRIu64 " claim-record=%s control-peer=%s socket-device=%ju socket-inode=%ju peer-pid=%ld peer-uid=%u peer-gid=%u retained-pidfd-process=%s runsc-artifact=%s verified-runsc-sha256=%s retained-runsc-executable=%s clock-domain=%s boot-id=%s exit-event-boottime-ns=%s live-at-expiry-boottime-ns=%s live-probe=%s process-set=%s signal-ack=%s termination-ack=%s registry-terminal=%s\n",
      KODAC_TERMINAL_LINE_VERSION, lease->lease_identity, request->arm_operation_identity, request->runtime_instance_identity, outcome, lease->owner_instance_identity, lease->fence_token, lease->claim_record_identity, subject->control_peer_binding_identity, (uintmax_t)subject->endpoint_stat.st_dev, (uintmax_t)subject->endpoint_stat.st_ino, (long)subject->peer.pid, (unsigned)subject->peer.uid, (unsigned)subject->peer.gid, subject->retained_pidfd_process_identity, request->runsc_artifact_identity, request->expected_runsc_sha256, subject->retained_runsc_executable_identity, lease->clock_domain_identity, lease->boot_id, exit_ns, live_ns, live_probe_identity, process_set_identity, signal_identity, termination_identity, registry_terminal_identity) < 0) return -1;
  return fflush(stdout) == 0 ? 0 : -1;
}

static int registry_entry_exists(int directory_fd, const char *name) {
  struct stat value;
  if (fstatat(directory_fd, name, &value, AT_SYMLINK_NOFOLLOW) == 0) return 1;
  return errno == ENOENT ? 0 : -1;
}

static int verify_no_prior_state(lease_registry *registry) {
  int lease = registry_entry_exists(registry->directory_fd, registry->lease_name);
  int claim = registry_entry_exists(registry->directory_fd, registry->claim_name);
  int terminal = registry_entry_exists(registry->directory_fd, registry->terminal_name);
  if (lease < 0 || claim < 0 || terminal < 0) return -1;
  return lease || claim || terminal ? 1 : 0;
}

static int wait_for_terminal_after_signal(retained_subject *subject, uint64_t deadline_ns, char termination_identity[65]) {
  return response_success(subject->wait_fd, 0, termination_identity, deadline_ns);
}

static int run_lease(const arm_request *request, lease_registry *registry, retained_subject *subject, lease_state *lease) {
  if (read_boot_id(lease->boot_id) != 0) return fail("cannot establish Linux boot identity");
  const char *clock_parts[] = { lease->boot_id, KODAC_CLOCK_NAME };
  if (hash_joined(lease->clock_domain_identity, "CLOCK_DOMAIN", clock_parts, 2) != 0) return fail("cannot derive clock-domain identity");
  if (boottime_ns(&lease->lease_start_boottime_ns) != 0) return fail("cannot read CLOCK_BOOTTIME lease start");
  if (request->ttl_ms > (UINT64_MAX - lease->lease_start_boottime_ns) / 1000000ULL) return fail("TTL deadline overflows uint64");
  lease->deadline_boottime_ns = lease->lease_start_boottime_ns + request->ttl_ms * 1000000ULL;
  if (durable_create_claim(request, registry, lease) != 0) return fail("cannot durably claim watchdog owner/fence generation");
  if (durable_create_lease(request, registry, lease) != 0) return fail("cannot durably commit watchdog lease registry entry");

  uint64_t arm_dispatch_deadline_ns = 0;
  if (boottime_deadline_after_ms(KODAC_ARM_DISPATCH_TIMEOUT_MS, &arm_dispatch_deadline_ns) != 0) return indeterminate("cannot establish bounded retained Wait dispatch deadline");
  if (arm_dispatch_deadline_ns > lease->deadline_boottime_ns) arm_dispatch_deadline_ns = lease->deadline_boottime_ns;
  int wait_dispatch = send_rpc(subject->wait_fd, "containerManager.Wait", request->container_id, 0, arm_dispatch_deadline_ns);
  if (wait_dispatch == KODAC_RESPONSE_TIMEOUT) return indeterminate("retained Wait request dispatch timed out before positive arm acknowledgement");
  if (wait_dispatch != 0) return indeterminate("retained Wait request failed before positive arm acknowledgement");
  if (emit_arm_ack(request, subject, lease) != 0) return fail("cannot emit physical arm acknowledgement");

  int timer_fd = create_absolute_timer(lease->deadline_boottime_ns);
  if (timer_fd < 0) return indeterminate("cannot arm CLOCK_BOOTTIME timerfd after durable lease");
  struct pollfd events[2] = {
    { .fd = subject->wait_fd, .events = POLLIN, .revents = 0 },
    { .fd = timer_fd, .events = POLLIN, .revents = 0 },
  };
  int polled;
  do { polled = poll(events, 2, -1); } while (polled < 0 && errno == EINTR);
  if (polled <= 0) { close(timer_fd); return indeterminate("terminal race poll failed"); }

  uint64_t observed_ns = 0;
  if (boottime_ns(&observed_ns) != 0) { close(timer_fd); return indeterminate("cannot timestamp terminal race"); }

  int wait_reached_deadline = 0;
  if ((events[0].revents & POLLIN) != 0 && observed_ns < lease->deadline_boottime_ns) {
    char termination_identity[65];
    int wait_result = response_success(subject->wait_fd, 0, termination_identity, lease->deadline_boottime_ns);
    if (wait_result == 0) {
      int alive = pidfd_is_alive(subject->pidfd);
      if (alive != 0) { close(timer_fd); return indeterminate(alive > 0 ? "Wait reported exit but admitted peer remains alive" : "cannot validate pidfd after natural exit"); }
      char exit_ns[32]; snprintf(exit_ns, sizeof(exit_ns), "%" PRIu64, observed_ns);
      char registry_terminal[65];
      if (durable_terminal(request, registry, lease, subject, "natural-exit", exit_ns, "-", "-", "-", "-", termination_identity, registry_terminal) != 0) { close(timer_fd); return indeterminate("cannot durably commit natural-exit terminal record"); }
      if (emit_terminal(request, lease, subject, "natural-exit", exit_ns, "-", "-", "-", "-", termination_identity, registry_terminal) != 0) { close(timer_fd); return indeterminate("cannot emit natural-exit terminal acknowledgement"); }
      close(timer_fd); return 0;
    }
    if (wait_result == KODAC_RESPONSE_TIMEOUT) wait_reached_deadline = 1;
    else { close(timer_fd); return indeterminate("pre-deadline Wait response is malformed or unsuccessful"); }
  }

  uint64_t expiry_ns = 0;
  if (boottime_ns(&expiry_ns) != 0) { close(timer_fd); return indeterminate("cannot timestamp expiry transition"); }
  if (!wait_reached_deadline && (events[1].revents & POLLIN) != 0) {
    if (read_timer(timer_fd) != 0) { close(timer_fd); return indeterminate("cannot consume immutable expiry timer"); }
  } else if (expiry_ns < lease->deadline_boottime_ns) {
    close(timer_fd); return indeterminate("terminal race became ambiguous before expiry");
  }
  close(timer_fd);

  uint64_t live_ns_value = 0;
  if (boottime_ns(&live_ns_value) != 0 || live_ns_value < lease->deadline_boottime_ns) return indeterminate("expiry liveness timestamp precedes deadline");
  if (revalidate_retained_subject(request, subject) != 0) return indeterminate("exact admitted runsc peer is not live at expiry");

  uint64_t terminal_response_deadline_ns = 0;
  if (boottime_deadline_after_ms(KODAC_TERMINATION_ACK_TIMEOUT_MS, &terminal_response_deadline_ns) != 0) return indeterminate("cannot establish bounded terminal RPC deadline");

  int processes_dispatch = send_rpc(subject->processes_fd, "containerManager.Processes", request->container_id, 0, terminal_response_deadline_ns);
  if (processes_dispatch == KODAC_RESPONSE_TIMEOUT) return indeterminate("retained Processes request dispatch timed out at expiry");
  if (processes_dispatch != 0) return indeterminate("retained Processes request failed at expiry");
  char process_set_identity[65];
  int process_result = response_success(subject->processes_fd, 1, process_set_identity, terminal_response_deadline_ns);
  if (process_result == 1) return indeterminate("retained Processes proved no live process at expiry; kill causality is not authorized");
  if (process_result == KODAC_RESPONSE_TIMEOUT) return indeterminate("retained Processes response timed out at expiry");
  if (process_result != 0) return indeterminate("retained Processes response is malformed or unsuccessful");
  uint64_t after_processes = 0;
  if (boottime_ns(&after_processes) != 0 || after_processes < lease->deadline_boottime_ns) return indeterminate("live-at-expiry observation is not monotonic");
  if (revalidate_retained_subject(request, subject) != 0) return indeterminate("exact peer changed between liveness proof and signal");
  char live_ns[32]; snprintf(live_ns, sizeof(live_ns), "%" PRIu64, after_processes);
  char live_probe_identity[65];
  const char *live_parts[] = { request->runtime_instance_identity, live_ns, process_set_identity, subject->control_peer_binding_identity, subject->retained_pidfd_process_identity };
  if (hash_joined(live_probe_identity, "LIVE_AT_EXPIRY", live_parts, 5) != 0) return indeterminate("cannot derive live-at-expiry proof identity");
  int signal_dispatch = send_rpc(subject->signal_fd, "containerManager.Signal", request->container_id, 1, terminal_response_deadline_ns);
  if (signal_dispatch == KODAC_RESPONSE_TIMEOUT) return indeterminate("retained Signal request dispatch timed out");
  if (signal_dispatch != 0) return indeterminate("retained Signal request failed");
  char signal_identity[65];
  int signal_result = response_success(subject->signal_fd, 0, signal_identity, terminal_response_deadline_ns);
  if (signal_result == KODAC_RESPONSE_TIMEOUT) return indeterminate("fixed SIGKILL-all signal acknowledgement timed out");
  if (signal_result != 0) return indeterminate("fixed SIGKILL-all signal was not acknowledged");
  char termination_identity[65];
  int termination_result = wait_for_terminal_after_signal(subject, terminal_response_deadline_ns, termination_identity);
  if (termination_result == KODAC_RESPONSE_TIMEOUT) return indeterminate("terminal Wait acknowledgement timed out after signal");
  if (termination_result != 0) return indeterminate("terminal Wait acknowledgement missing after signal");
  char registry_terminal[65];
  if (durable_terminal(request, registry, lease, subject, "ttl-expired", "-", live_ns, live_probe_identity, process_set_identity, signal_identity, termination_identity, registry_terminal) != 0) return indeterminate("cannot durably commit ttl-expired terminal record");
  if (emit_terminal(request, lease, subject, "ttl-expired", "-", live_ns, live_probe_identity, process_set_identity, signal_identity, termination_identity, registry_terminal) != 0) return indeterminate("cannot emit ttl-expired terminal acknowledgement");
  return 0;
}

int main(int argc, char **argv) {
  if (argc == 2 && strcmp(argv[1], "--version") == 0) {
    if (printf("%s\n", KODAC_PROTOCOL_VERSION) < 0) return KODAC_FAILURE_EXIT;
    return 0;
  }

  arm_request request;
  memset(&request, 0, sizeof(request));
  if (parse_arm_request(argc, argv, &request) != 0) return fail("invalid fixed R3G-D arm request grammar");

  lease_registry registry;
  if (open_registry(&request, &registry) != 0) return fail("trusted watchdog registry or exclusive lease lock is unavailable");
  int prior = verify_no_prior_state(&registry);
  if (prior != 0) {
    close_if_open(&registry.lock_fd); close_if_open(&registry.directory_fd);
    return prior > 0 ? indeterminate("existing durable lease/claim/terminal state requires recovery; pathname reconnect or fresh deadline is forbidden") : fail("cannot inspect durable lease registry state");
  }

  retained_subject subject;
  if (authenticate_subject(&request, &subject) != 0) {
    close_subject(&subject); close_if_open(&registry.lock_fd); close_if_open(&registry.directory_fd);
    return fail("exact retained gVisor control peer admission failed");
  }

  lease_state lease;
  memset(&lease, 0, sizeof(lease));
  int result = run_lease(&request, &registry, &subject, &lease);

  close_subject(&subject);
  close_if_open(&registry.lock_fd);
  close_if_open(&registry.directory_fd);
  return result;
}
