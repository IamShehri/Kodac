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

test("H4-R3G-D positive arm acknowledgement requires an active unexpired BOOTTIME lease", { skip: process.platform !== "linux", timeout: 20_000 }, async () => {
  const source = await readFile(WATCHDOG_SOURCE, "utf8")
  const runStart = source.indexOf("static int run_lease")
  const mainStart = source.indexOf("int main(", runStart)
  assert.ok(runStart >= 0 && mainStart > runStart)
  const body = source.slice(runStart, mainStart)

  const timer = body.indexOf("create_absolute_timer(lease->deadline_boottime_ns)")
  const waitDispatch = body.indexOf('send_rpc(subject->wait_fd, "containerManager.Wait", request->container_id, 0, arm_dispatch_deadline_ns)')
  const beforeAck = body.indexOf("boottime_before_io(lease->deadline_boottime_ns)", waitDispatch)
  const emitAck = body.indexOf("emit_arm_ack(request, subject, lease)", beforeAck)
  assert.ok(timer >= 0 && waitDispatch > timer && beforeAck > waitDispatch && emitAck > beforeAck, "lease timer and post-dispatch BOOTTIME check must both precede positive arm ACK")
  assert.match(body, /before_ack == KODAC_RESPONSE_TIMEOUT[^\n]*lease expired before positive arm acknowledgement/)
  assert.match(body, /wait_dispatch == KODAC_RESPONSE_TIMEOUT[^\n]*close\(timer_fd\)/)

  const root = await mkdtemp(join(tmpdir(), "kodac-r3gd-arm-ack-deadline-"))
  const harnessSource = join(root, "arm-ack-deadline.c")
  const harnessBinary = join(root, "arm-ack-deadline")
  const includedSource = JSON.stringify(WATCHDOG_SOURCE)
  const harness = `#define main kodac_watchdog_main
#include ${includedSource}
#undef main

int main(void) {
  uint64_t deadline = 0;
  if (boottime_deadline_after_ms(25, &deadline) != 0) return 10;
  int timer_fd = create_absolute_timer(deadline);
  if (timer_fd < 0) return 11;
  struct timespec delay = { .tv_sec = 0, .tv_nsec = 50000000L };
  while (nanosleep(&delay, &delay) != 0) {
    if (errno != EINTR) return 12;
  }
  int result = boottime_before_io(deadline);
  close(timer_fd);
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
