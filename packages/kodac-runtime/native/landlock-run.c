/*
 * SPDX-License-Identifier: BSD-3-Clause
 *
 * Kodac H4-R2B Linux Landlock launcher primitive.
 * Adapted from deepseek-ai/deepseek-harness at
 * 47f943859bef60e4160492346772ded9b24f765a:
 * native/landlock-run/packages/entry/src/main.c
 * donor blob af0cc2a988b219a699f35aeb911dbd66f1946fd9.
 *
 * The donor subproject is BSD-3-Clause. See ../THIRD_PARTY_NOTICES.md.
 *
 * This source is intentionally not wired into Kodac production execution in
 * H4-R2B. Focused tests compile it into a temporary artifact and exercise the
 * intrinsic restrict-self-then-exec primitive only.
 *
 * CLI:
 *   kodac-landlock-run [--ro <path>]... [--rw <path>]... -- <argv>...
 *   kodac-landlock-run --probe
 *
 * Probe stdout (exactly one line on success):
 *   kodac-landlock-v1 abi=<N> claim-set=kodac-linux-landlock-fs-v1 enforcement=<full|partial>
 *
 * `full` is deliberately local to the Kodac fs-v1 claim set (Landlock
 * filesystem rights introduced through ABI 5). It does not mean all modern
 * Landlock capabilities or all filesystem operations.
 */

#define _GNU_SOURCE
#include <errno.h>
#include <fcntl.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/prctl.h>
#include <sys/stat.h>
#include <sys/syscall.h>
#include <unistd.h>

struct landlock_ruleset_attr {
  uint64_t handled_access_fs;
};

struct landlock_path_beneath_attr {
  uint64_t allowed_access;
  int32_t parent_fd;
} __attribute__((packed));

#define LANDLOCK_CREATE_RULESET_VERSION (1U << 0)
#define LANDLOCK_RULE_PATH_BENEATH 1

#define LL_FS_EXECUTE     (UINT64_C(1) << 0)
#define LL_FS_WRITE_FILE  (UINT64_C(1) << 1)
#define LL_FS_READ_FILE   (UINT64_C(1) << 2)
#define LL_FS_READ_DIR    (UINT64_C(1) << 3)
#define LL_FS_REMOVE_DIR  (UINT64_C(1) << 4)
#define LL_FS_REMOVE_FILE (UINT64_C(1) << 5)
#define LL_FS_MAKE_CHAR   (UINT64_C(1) << 6)
#define LL_FS_MAKE_DIR    (UINT64_C(1) << 7)
#define LL_FS_MAKE_REG    (UINT64_C(1) << 8)
#define LL_FS_MAKE_SOCK   (UINT64_C(1) << 9)
#define LL_FS_MAKE_FIFO   (UINT64_C(1) << 10)
#define LL_FS_MAKE_BLOCK  (UINT64_C(1) << 11)
#define LL_FS_MAKE_SYM    (UINT64_C(1) << 12)
#define LL_FS_REFER       (UINT64_C(1) << 13)
#define LL_FS_TRUNCATE    (UINT64_C(1) << 14)
#define LL_FS_IOCTL_DEV   (UINT64_C(1) << 15)

#define LL_ABI1_MASK (LL_FS_REFER - 1)
#define KODAC_FS_CLAIM_ABI 5L
#define KODAC_FS_CLAIM_SET "kodac-linux-landlock-fs-v1"

#ifndef __NR_landlock_create_ruleset
#define __NR_landlock_create_ruleset 444
#define __NR_landlock_add_rule 445
#define __NR_landlock_restrict_self 446
#endif

#define EXIT_LAUNCHER_FAILURE 125

static const char NOT_ENFORCED_MESSAGE[] =
  "landlock is not enforced by this kernel (ABI unsupported or disabled)";

static int fail(const char *prefix, const char *detail) {
  if (detail == NULL) {
    fprintf(stderr, "kodac-landlock: %s\n", prefix);
  } else {
    fprintf(stderr, "kodac-landlock: %s: %s\n", prefix, detail);
  }
  return EXIT_LAUNCHER_FAILURE;
}

static int fail_usage(const char *message, const char *detail) {
  fprintf(stderr, "kodac-landlock: usage error: %s%s\n", message,
          detail == NULL ? "" : detail);
  return EXIT_LAUNCHER_FAILURE;
}

struct cli {
  int probe;
  const char **ro;
  size_t ro_count;
  const char **rw;
  size_t rw_count;
  char **command;
};

static int parse(int argc, char **argv, struct cli *cli) {
  cli->ro = calloc(argc > 0 ? (size_t)argc : 1, sizeof *cli->ro);
  cli->rw = calloc(argc > 0 ? (size_t)argc : 1, sizeof *cli->rw);
  if (cli->ro == NULL || cli->rw == NULL) return fail("out of memory", NULL);

  int index = 1;
  while (index < argc) {
    const char *arg = argv[index];
    if (strcmp(arg, "--probe") == 0) {
      if (argc != 2) return fail_usage("--probe takes no other arguments", NULL);
      cli->probe = 1;
      index += 1;
    } else if (strcmp(arg, "--ro") == 0 || strcmp(arg, "--rw") == 0) {
      if (index + 1 >= argc) return fail_usage(arg, " requires a path");
      if (argv[index + 1][0] == '\0') return fail_usage(arg, " requires a non-empty path");
      if (strcmp(arg, "--ro") == 0) {
        cli->ro[cli->ro_count++] = argv[index + 1];
      } else {
        cli->rw[cli->rw_count++] = argv[index + 1];
      }
      index += 2;
    } else if (strcmp(arg, "--") == 0) {
      cli->command = &argv[index + 1];
      break;
    } else {
      return fail_usage("unknown argument: ", arg);
    }
  }

  if (!cli->probe && (cli->command == NULL || cli->command[0] == NULL)) {
    return fail_usage("missing `-- <argv>...` command", NULL);
  }
  return 0;
}

static uint64_t fs_mask_for_abi(long abi) {
  uint64_t mask = LL_ABI1_MASK;
  if (abi >= 2) mask |= LL_FS_REFER;
  if (abi >= 3) mask |= LL_FS_TRUNCATE;
  if (abi >= 5) mask |= LL_FS_IOCTL_DEV;
  return mask;
}

static int add_rule(int ruleset_fd, const char *path, uint64_t access) {
  int path_fd = open(path, O_PATH | O_CLOEXEC);
  if (path_fd < 0) {
    fprintf(stderr, "kodac-landlock: cannot open rule path: %s: %s\n", path,
            strerror(errno));
    return EXIT_LAUNCHER_FAILURE;
  }

  struct stat st;
  if (fstat(path_fd, &st) != 0) {
    int saved = errno;
    close(path_fd);
    return fail("cannot stat rule path", strerror(saved));
  }

  if (!S_ISDIR(st.st_mode)) {
    access &= LL_FS_EXECUTE | LL_FS_WRITE_FILE | LL_FS_READ_FILE |
              LL_FS_TRUNCATE | LL_FS_IOCTL_DEV;
  }

  struct landlock_path_beneath_attr attr = {
    .allowed_access = access,
    .parent_fd = path_fd,
  };

  if (syscall(__NR_landlock_add_rule, ruleset_fd,
              LANDLOCK_RULE_PATH_BENEATH, &attr, 0) != 0) {
    int saved = errno;
    close(path_fd);
    return fail("landlock ruleset error", strerror(saved));
  }

  close(path_fd);
  return 0;
}

static int restrict_self(const struct cli *cli, int *partial,
                         long *observed_abi) {
  long abi = syscall(__NR_landlock_create_ruleset, NULL, 0,
                     LANDLOCK_CREATE_RULESET_VERSION);
  if (abi < 0) return fail(NOT_ENFORCED_MESSAGE, NULL);
  if (abi == 0) return fail("landlock returned invalid ABI 0", NULL);

  *observed_abi = abi;
  *partial = abi < KODAC_FS_CLAIM_ABI;

  long governed_abi = abi < KODAC_FS_CLAIM_ABI ? abi : KODAC_FS_CLAIM_ABI;
  uint64_t handled = fs_mask_for_abi(governed_abi);

  struct landlock_ruleset_attr attr = { .handled_access_fs = handled };
  int ruleset_fd = (int)syscall(__NR_landlock_create_ruleset, &attr,
                                sizeof attr, 0);
  if (ruleset_fd < 0) return fail("landlock ruleset error", strerror(errno));

  const uint64_t read_side = LL_FS_EXECUTE | LL_FS_READ_FILE | LL_FS_READ_DIR;
  for (size_t i = 0; i < cli->ro_count; i++) {
    int code = add_rule(ruleset_fd, cli->ro[i], read_side & handled);
    if (code != 0) {
      close(ruleset_fd);
      return code;
    }
  }

  for (size_t i = 0; i < cli->rw_count; i++) {
    int code = add_rule(ruleset_fd, cli->rw[i], handled);
    if (code != 0) {
      close(ruleset_fd);
      return code;
    }
  }

  if (prctl(PR_SET_NO_NEW_PRIVS, 1, 0, 0, 0) != 0) {
    int saved = errno;
    close(ruleset_fd);
    return fail("landlock ruleset error", strerror(saved));
  }

  if (syscall(__NR_landlock_restrict_self, ruleset_fd, 0) != 0) {
    int saved = errno;
    close(ruleset_fd);
    return fail("landlock ruleset error", strerror(saved));
  }

  close(ruleset_fd);
  return 0;
}

int main(int argc, char **argv) {
  struct cli cli = { 0 };
  int code = parse(argc, argv, &cli);
  if (code != 0) return code;

  if (cli.probe) {
    static const char *probe_root = "/";
    struct cli probe = { .ro = &probe_root, .ro_count = 1 };
    int partial = 0;
    long abi = 0;
    code = restrict_self(&probe, &partial, &abi);
    if (code != 0) return code;
    printf("kodac-landlock-v1 abi=%ld claim-set=%s enforcement=%s\n",
           abi, KODAC_FS_CLAIM_SET, partial ? "partial" : "full");
    return 0;
  }

  int partial = 0;
  long abi = 0;
  code = restrict_self(&cli, &partial, &abi);
  if (code != 0) return code;

  if (partial) {
    fprintf(stderr,
            "kodac-landlock: claim-set=%s enforcement=partial abi=%ld\n",
            KODAC_FS_CLAIM_SET, abi);
  }

  execvp(cli.command[0], cli.command);
  return fail("exec failed", strerror(errno));
}
