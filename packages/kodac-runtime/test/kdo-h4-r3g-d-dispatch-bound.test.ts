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

test("H4-R3G-D retained RPC dispatch is absolute CLOCK_BOOTTIME bounded", { skip: process.platform !== "linux", timeout: 20_000 }, async () => {
  const source = await readFile(WATCHDOG_SOURCE, "utf8")
  assert.match(source, /MSG_NOSIGNAL\s*\|\s*MSG_DONTWAIT/)
  assert.ok(source.includes('send_rpc(subject->wait_fd, "containerManager.Wait", request->container_id, 0, arm_dispatch_deadline_ns)'))
  assert.ok(source.includes('send_rpc(subject->processes_fd, "containerManager.Processes", request->container_id, 0, terminal_response_deadline_ns)'))
  assert.ok(source.includes('send_rpc(subject->signal_fd, "containerManager.Signal", request->container_id, 1, terminal_response_deadline_ns)'))

  const root = await mkdtemp(join(tmpdir(), "kodac-r3gd-dispatch-bound-"))
  const harnessSource = join(root, "dispatch-bound.c")
  const harnessBinary = join(root, "dispatch-bound")
  const includedSource = JSON.stringify(WATCHDOG_SOURCE)
  const harness = `#define main kodac_watchdog_main
#include ${includedSource}
#undef main

int main(void) {
  int sockets[2] = { -1, -1 };
  if (socketpair(AF_UNIX, SOCK_STREAM | SOCK_CLOEXEC, 0, sockets) != 0) return 10;

  int send_buffer = 1024;
  if (setsockopt(sockets[0], SOL_SOCKET, SO_SNDBUF, &send_buffer, sizeof(send_buffer)) != 0) return 11;

  char filler[4096];
  memset(filler, 'x', sizeof(filler));
  for (;;) {
    ssize_t count = send(sockets[0], filler, sizeof(filler), MSG_DONTWAIT | MSG_NOSIGNAL);
    if (count > 0) continue;
    if (count < 0 && (errno == EAGAIN || errno == EWOULDBLOCK)) break;
    return 12;
  }

  uint64_t before = 0;
  uint64_t deadline = 0;
  uint64_t after = 0;
  if (boottime_ns(&before) != 0) return 13;
  if (boottime_deadline_after_ms(25, &deadline) != 0) return 14;
  int result = write_all_until_boottime(sockets[0], "x", 1, deadline);
  if (boottime_ns(&after) != 0) return 15;

  close(sockets[0]);
  close(sockets[1]);

  if (result != KODAC_RESPONSE_TIMEOUT) return 16;
  if (after < deadline) return 17;
  if (after < before || after - before > 2000000000ULL) return 18;
  return 0;
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
