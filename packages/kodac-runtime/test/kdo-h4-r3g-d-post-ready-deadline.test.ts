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

test("H4-R3G-D socket readiness cannot authorize I/O after the absolute BOOTTIME deadline", { skip: process.platform !== "linux", timeout: 20_000 }, async () => {
  const source = await readFile(WATCHDOG_SOURCE, "utf8")

  const writeStart = source.indexOf("static int write_all_until_boottime")
  const sendStart = source.indexOf("static int send_rpc", writeStart)
  const writeBody = source.slice(writeStart, sendStart)
  const writePoll = writeBody.indexOf("poll_io_with_boottime_timer(fd, POLLOUT, timer_fd)")
  const writeCheck = writeBody.indexOf("boottime_before_io(deadline_ns)", writePoll)
  const writeSend = writeBody.indexOf("send(fd,", writeCheck)
  assert.ok(writePoll >= 0 && writeCheck > writePoll && writeSend > writeCheck, "dispatch must re-check CLOCK_BOOTTIME after readiness and before send")

  const readStart = source.indexOf("static int read_json_object")
  const successStart = source.indexOf("static const char *successful_result", readStart)
  const readBody = source.slice(readStart, successStart)
  const readPoll = readBody.indexOf("poll_io_with_boottime_timer(fd, POLLIN, timer_fd)")
  const readCheck = readBody.indexOf("boottime_before_io(deadline_ns)", readPoll)
  const readCall = readBody.indexOf("read(fd,", readCheck)
  assert.ok(readPoll >= 0 && readCheck > readPoll && readCall > readCheck, "response parsing must re-check CLOCK_BOOTTIME after readiness and before read")

  const root = await mkdtemp(join(tmpdir(), "kodac-r3gd-post-ready-deadline-"))
  const harnessSource = join(root, "post-ready-deadline.c")
  const harnessBinary = join(root, "post-ready-deadline")
  const includedSource = JSON.stringify(WATCHDOG_SOURCE)
  const harness = `#define main kodac_watchdog_main
#include ${includedSource}
#undef main

static int delay_past_deadline(void) {
  struct timespec delay = { .tv_sec = 0, .tv_nsec = 50000000L };
  while (nanosleep(&delay, &delay) != 0) {
    if (errno != EINTR) return -1;
  }
  return 0;
}

int main(void) {
  int sockets[2] = { -1, -1 };
  if (socketpair(AF_UNIX, SOCK_STREAM | SOCK_CLOEXEC, 0, sockets) != 0) return 10;

  uint64_t write_deadline = 0;
  if (boottime_deadline_after_ms(25, &write_deadline) != 0) return 11;
  int write_timer = create_absolute_timer(write_deadline);
  if (write_timer < 0) return 12;
  if (poll_io_with_boottime_timer(sockets[0], POLLOUT, write_timer) != 0) return 13;
  if (delay_past_deadline() != 0) return 14;
  if (boottime_before_io(write_deadline) != KODAC_RESPONSE_TIMEOUT) return 15;
  close(write_timer);

  if (send(sockets[1], "{", 1, MSG_NOSIGNAL) != 1) return 16;
  uint64_t read_deadline = 0;
  if (boottime_deadline_after_ms(25, &read_deadline) != 0) return 17;
  int read_timer = create_absolute_timer(read_deadline);
  if (read_timer < 0) return 18;
  if (poll_io_with_boottime_timer(sockets[0], POLLIN, read_timer) != 0) return 19;
  if (delay_past_deadline() != 0) return 20;
  if (boottime_before_io(read_deadline) != KODAC_RESPONSE_TIMEOUT) return 21;
  close(read_timer);

  char byte = 0;
  ssize_t count = recv(sockets[0], &byte, 1, MSG_DONTWAIT);
  close(sockets[0]);
  close(sockets[1]);
  if (count != 1 || byte != '{') return 22;
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
