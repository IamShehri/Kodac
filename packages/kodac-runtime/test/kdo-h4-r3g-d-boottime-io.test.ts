import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)
const TEST_DIR = dirname(fileURLToPath(import.meta.url))
const RUNTIME_DIR = resolve(TEST_DIR, "..")
const WATCHDOG_SOURCE = join(RUNTIME_DIR, "native", "gvisor-ttl-watchdog.c")

test("H4-R3G-D RPC I/O deadlines are driven by absolute CLOCK_BOOTTIME timerfds", { skip: process.platform !== "linux", timeout: 20_000 }, async () => {
  const source = await readFile(WATCHDOG_SOURCE, "utf8")
  const writeStart = source.indexOf("static int write_all_until_boottime")
  const sendStart = source.indexOf("static int send_rpc", writeStart)
  const readStart = source.indexOf("static int read_json_object")
  const successStart = source.indexOf("static const char *successful_result", readStart)
  assert.ok(writeStart >= 0 && sendStart > writeStart)
  assert.ok(readStart >= 0 && successStart > readStart)
  assert.match(source.slice(writeStart, sendStart), /create_absolute_timer\(deadline_ns\)/)
  assert.match(source.slice(writeStart, sendStart), /poll_io_with_boottime_timer\(fd, POLLOUT, timer_fd\)/)
  assert.match(source.slice(readStart, successStart), /create_absolute_timer\(deadline_ns\)/)
  assert.match(source.slice(readStart, successStart), /poll_io_with_boottime_timer\(fd, POLLIN, timer_fd\)/)
  assert.match(source, /poll\(pollfds, 2, -1\)/)
  assert.match(source, /timerfd_create\(CLOCK_BOOTTIME, TFD_CLOEXEC \| TFD_NONBLOCK\)/)
  assert.doesNotMatch(source, /poll\(&pfd, 1, timeout_ms\)/)

  const root = await mkdtemp(join(tmpdir(), "kodac-r3gd-boottime-io-"))
  const harnessSource = join(root, "boottime-io.c")
  const harnessBinary = join(root, "boottime-io")
  const includedSource = JSON.stringify(WATCHDOG_SOURCE)
  const harness = `#define main kodac_watchdog_main
#include ${includedSource}
#undef main

int main(void) {
  int sockets[2] = { -1, -1 };
  if (socketpair(AF_UNIX, SOCK_STREAM | SOCK_CLOEXEC, 0, sockets) != 0) return 10;
  if (send(sockets[1], "{", 1, MSG_NOSIGNAL) != 1) return 11;

  uint64_t deadline = 0;
  if (boottime_deadline_after_ms(25, &deadline) != 0) return 12;
  char response[64];
  size_t response_length = 0;
  int result = read_json_object(sockets[0], response, sizeof(response), &response_length, deadline);

  close(sockets[0]);
  close(sockets[1]);
  return result == KODAC_RESPONSE_TIMEOUT ? 0 : 13;
}
`

  try {
    await writeFile(harnessSource, harness, "utf8")
    await execFileAsync("cc", ["-std=c11", "-O2", "-Wall", "-Wextra", "-Werror", harnessSource, "-o", harnessBinary])
    await execFileAsync(harnessBinary, [], { timeout: 5_000 })
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
