/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * Kodac H4-R4B-G0 trusted gVisor pre-workload gate.
 *
 * Contract:
 *   argv[1]    = exact absolute deferred workload executable
 *   argv[2..]  = exact deferred workload arguments
 *   stdin      = gate-control channel only
 *   permit     = exactly "GO\n" followed by EOF
 *
 * The gate emits no stdout/stderr bytes. Any failure before exec terminates
 * without executing the deferred workload.
 */

#include <errno.h>
#include <unistd.h>

#define KODAC_GATE_FAILURE_EXIT 125
#define KODAC_GATE_PERMIT_MAX_BYTES 4

static void fail_closed(void) {
  _exit(KODAC_GATE_FAILURE_EXIT);
}

static void require_exact_permit(void) {
  char permit[KODAC_GATE_PERMIT_MAX_BYTES];
  size_t used = 0;

  for (;;) {
    if (used == sizeof permit) {
      fail_closed();
    }

    ssize_t count = read(STDIN_FILENO, permit + used, sizeof permit - used);
    if (count < 0) {
      if (errno == EINTR) {
        continue;
      }
      fail_closed();
    }
    if (count == 0) {
      break;
    }
    used += (size_t)count;
  }

  if (used != 3 || permit[0] != 'G' || permit[1] != 'O' || permit[2] != '\n') {
    fail_closed();
  }
}

int main(int argc, char **argv) {
  if (argc < 2 || argv[1][0] != '/') {
    fail_closed();
  }

  require_exact_permit();

  if (close(STDIN_FILENO) != 0) {
    fail_closed();
  }

  execv(argv[1], &argv[1]);
  fail_closed();
}
