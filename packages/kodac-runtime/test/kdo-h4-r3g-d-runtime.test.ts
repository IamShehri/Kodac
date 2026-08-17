import assert from "node:assert/strict"
import { execFile, spawn } from "node:child_process"
import { createHash } from "node:crypto"
import { chmod, mkdtemp, readFile, rm, stat } from "node:fs/promises"
import { createServer, type Socket } from "node:net"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)
const TEST_DIR = dirname(fileURLToPath(import.meta.url))
const RUNTIME_DIR = resolve(TEST_DIR, "..")
const WATCHDOG_SOURCE = join(RUNTIME_DIR, "native", "gvisor-ttl-watchdog.c")
const CONTAINER_ID = "1".repeat(64)
const ID = Object.freeze({
  arm: "2".repeat(64),
  payload: "3".repeat(64),
  execution: "4".repeat(64),
  requirement: "5".repeat(64),
  workload: "6".repeat(64),
  binding: "7".repeat(64),
  runtime: "8".repeat(64),
  watchdog: "9".repeat(64),
  runscArtifact: "a".repeat(64),
})

function parseStartTicks(statText: string): bigint {
  const close = statText.lastIndexOf(")")
  assert.ok(close > 0, "proc stat must contain a closing comm parenthesis")
  const fields = statText.slice(close + 2).trim().split(/\s+/)
  assert.ok(fields.length >= 20, "proc stat must contain field 22")
  const value = fields[19]
  assert.match(value, /^[1-9][0-9]*$/)
  return BigInt(value)
}

async function sha256File(path: string): Promise<string> {
  const bytes = await readFile(path)
  return createHash("sha256").update(bytes).digest("hex")
}

function runChild(executable: string, args: string[]): Promise<{ code: number | null; signal: NodeJS.Signals | null; stdout: string; stderr: string }> {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(executable, args, { stdio: ["ignore", "pipe", "pipe"] })
    let stdout = ""; let stderr = ""
    child.stdout.setEncoding("utf8"); child.stderr.setEncoding("utf8")
    child.stdout.on("data", (chunk: string) => { stdout += chunk })
    child.stderr.on("data", (chunk: string) => { stderr += chunk })
    child.once("error", rejectPromise)
    child.once("exit", (code, signal) => resolvePromise({ code, signal, stdout, stderr }))
  })
}

async function closeServer(server: ReturnType<typeof createServer>): Promise<void> {
  await new Promise<void>((resolvePromise, rejectPromise) => server.close((error) => error ? rejectPromise(error) : resolvePromise()))
}

test("H4-R3G-D native watchdog compiles warning-clean and reports only the fixed protocol version", { skip: process.platform !== "linux" }, async () => {
  const root = await mkdtemp(join(tmpdir(), "kodac-r3gd-build-"))
  try {
    const binary = join(root, "gvisor-ttl-watchdog")
    await execFileAsync("cc", ["-std=c11", "-O2", "-Wall", "-Wextra", "-Werror", WATCHDOG_SOURCE, "-o", binary])
    const version = await execFileAsync(binary, ["--version"], { encoding: "utf8" })
    assert.equal(version.stdout, "kodac-h4-r3g-d-watchdog-protocol-v1\n")
    await assert.rejects(execFileAsync(binary, ["--help"], { encoding: "utf8" }), /125|invalid fixed R3G-D arm request grammar/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test("H4-R3G-D watchdog retains authenticated channels, proves live-at-expiry, sends only fixed SIGKILL-all, and never rearms durable state", { skip: process.platform !== "linux", timeout: 20_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "kodac-r3gd-runtime-"))
  await chmod(root, 0o700)
  const binary = join(root, "gvisor-ttl-watchdog")
  const socketPath = join(root, "control.sock")
  const methods: string[] = []
  let signalArg: unknown
  let acceptedConnections = 0
  let waitSocket: Socket | undefined
  const server = createServer((socket) => {
    acceptedConnections += 1
    let buffered = ""
    socket.setEncoding("utf8")
    socket.on("data", (chunk: string) => {
      buffered += chunk
      let request: { method?: unknown; arg?: unknown }
      try { request = JSON.parse(buffered) as { method?: unknown; arg?: unknown } } catch { return }
      buffered = ""
      assert.equal(typeof request.method, "string")
      methods.push(request.method)
      if (request.method === "containerManager.Wait") {
        assert.equal(request.arg, CONTAINER_ID)
        waitSocket = socket
        return
      }
      if (request.method === "containerManager.Processes") {
        assert.equal(request.arg, CONTAINER_ID)
        socket.write(JSON.stringify({ success: true, err: "", result: [{ pid: 1 }] }))
        return
      }
      if (request.method === "containerManager.Signal") {
        signalArg = request.arg
        socket.write(JSON.stringify({ success: true, err: "", result: null }))
        setTimeout(() => waitSocket?.write(JSON.stringify({ success: true, err: "", result: 0 })), 5)
        return
      }
      socket.destroy(new Error(`unexpected RPC method ${String(request.method)}`))
    })
  })

  try {
    await execFileAsync("cc", ["-std=c11", "-O2", "-Wall", "-Wextra", "-Werror", WATCHDOG_SOURCE, "-o", binary])
    await new Promise<void>((resolvePromise, rejectPromise) => {
      server.once("error", rejectPromise)
      server.listen(socketPath, () => { server.off("error", rejectPromise); resolvePromise() })
    })

    const socketStat = await stat(socketPath, { bigint: true })
    const exeStat = await stat("/proc/self/exe", { bigint: true })
    const startTicks = parseStartTicks(await readFile("/proc/self/stat", "utf8"))
    const runscSha256 = await sha256File("/proc/self/exe")
    assert.equal(typeof process.getuid, "function")
    assert.equal(typeof process.getgid, "function")

    const args = [
      "--arm",
      "--registry-root", root,
      "--arm-operation", ID.arm,
      "--arm-payload-digest", ID.payload,
      "--execution-attempt", ID.execution,
      "--requirement", ID.requirement,
      "--workload", ID.workload,
      "--container-binding", ID.binding,
      "--container-id", CONTAINER_ID,
      "--runtime-instance", ID.runtime,
      "--ttl-ms", "75",
      "--watchdog-implementation", ID.watchdog,
      "--control-socket", socketPath,
      "--socket-device-inode", `${socketStat.dev}:${socketStat.ino}`,
      "--peer-pid-uid-gid", `${process.pid}:${process.getuid()}:${process.getgid()}`,
      "--process-tuple", `${startTicks}:${exeStat.dev}:${exeStat.ino}:${exeStat.size}`,
      "--runsc-artifact", ID.runscArtifact,
      "--runsc-sha256", runscSha256,
    ]

    const first = await runChild(binary, args)
    assert.equal(first.signal, null)
    assert.equal(first.code, 0, first.stderr)
    const lines = first.stdout.trim().split("\n")
    assert.equal(lines.length, 2, first.stdout)
    assert.match(lines[0], /^kodac-gvisor-ttl-arm-v1 /)
    assert.match(lines[1], /^kodac-gvisor-ttl-terminal-v1 /)
    assert.match(lines[1], / outcome=ttl-expired /)
    assert.deepEqual(methods, ["containerManager.Wait", "containerManager.Processes", "containerManager.Signal"])
    assert.deepEqual(signalArg, { CID: CONTAINER_ID, Signo: 9, PID: 0, Mode: 1 })
    assert.equal(acceptedConnections, 3)

    const leasePath = join(root, `${ID.arm}.lease`)
    const terminalPath = join(root, `${ID.arm}.terminal`)
    const leaseBefore = await readFile(leasePath, "utf8")
    const terminal = await readFile(terminalPath, "utf8")
    assert.match(leaseBefore, /physicalArmState=ARMED/)
    assert.match(leaseBefore, /ttlMs=75/)
    assert.match(terminal, /terminalOutcome=ttl-expired/)
    assert.match(terminal, /signalAcknowledgementIdentity=[0-9a-f]{64}/)

    const retryConnections = acceptedConnections
    const retry = await runChild(binary, args)
    assert.equal(retry.signal, null)
    assert.equal(retry.code, 126)
    assert.match(retry.stderr, /existing durable lease\/claim\/terminal state requires recovery/)
    assert.equal(retry.stdout, "")
    assert.equal(acceptedConnections, retryConnections, "durable replay must fail before any pathname reconnect")
    assert.equal(await readFile(leasePath, "utf8"), leaseBefore, "replay must not reset or extend the original deadline")
  } finally {
    for (const socket of server.connectionsCheckingInterval ? [] : []) void socket
    if (server.listening) await closeServer(server).catch(() => {})
    await rm(root, { recursive: true, force: true })
  }
})
