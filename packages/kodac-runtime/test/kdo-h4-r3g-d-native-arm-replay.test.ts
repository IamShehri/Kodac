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

import { parseGvisorTtlPhysicalArmReplayRecord } from "../src/execution/gateway-gvisor-ttl-arm-replay.ts"
import { inspectGvisorTtlPhysicalRecoveryRegistry } from "../src/execution/gateway-gvisor-ttl-recovery-registry.ts"
import {
  parseGvisorTtlPhysicalLeaseRecord,
  parseGvisorTtlPhysicalOwnerClaimRecord,
} from "../src/execution/gateway-gvisor-ttl-registry.ts"

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
  assert.ok(close > 0)
  const fields = statText.slice(close + 2).trim().split(/\s+/)
  assert.ok(fields.length >= 20)
  return BigInt(fields[19])
}

async function sha256File(path: string): Promise<string> {
  return createHash("sha256").update(await readFile(path)).digest("hex")
}

function runChild(executable: string, args: string[]): Promise<{ code: number | null; signal: NodeJS.Signals | null; stdout: string; stderr: string }> {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(executable, args, { stdio: ["ignore", "pipe", "pipe"] })
    let stdout = ""
    let stderr = ""
    child.stdout.setEncoding("utf8")
    child.stderr.setEncoding("utf8")
    child.stdout.on("data", (chunk: string) => { stdout += chunk })
    child.stderr.on("data", (chunk: string) => { stderr += chunk })
    child.once("error", rejectPromise)
    child.once("exit", (code, signal) => resolvePromise({ code, signal, stdout, stderr }))
  })
}

async function closeServer(server: ReturnType<typeof createServer>): Promise<void> {
  await new Promise<void>((resolvePromise, rejectPromise) => server.close((error) => error ? rejectPromise(error) : resolvePromise()))
}

async function nativeArgs(root: string, binary: string, socketPath: string): Promise<string[]> {
  await execFileAsync("cc", ["-std=c11", "-O2", "-Wall", "-Wextra", "-Werror", WATCHDOG_SOURCE, "-o", binary])
  const socketStat = await stat(socketPath, { bigint: true })
  const exeStat = await stat("/proc/self/exe", { bigint: true })
  const startTicks = parseStartTicks(await readFile("/proc/self/stat", "utf8"))
  const runscSha256 = await sha256File("/proc/self/exe")
  const getuid = process.getuid
  const getgid = process.getgid
  assert.equal(typeof getuid, "function")
  assert.equal(typeof getgid, "function")
  if (typeof getuid !== "function" || typeof getgid !== "function") throw new Error("Linux uid/gid primitives unavailable")
  return [
    "--arm", "--registry-root", root,
    "--arm-operation", ID.arm,
    "--arm-payload-digest", ID.payload,
    "--execution-attempt", ID.execution,
    "--requirement", ID.requirement,
    "--workload", ID.workload,
    "--container-binding", ID.binding,
    "--container-id", CONTAINER_ID,
    "--runtime-instance", ID.runtime,
    "--ttl-ms", "1000",
    "--watchdog-implementation", ID.watchdog,
    "--control-socket", socketPath,
    "--socket-device-inode", `${socketStat.dev}:${socketStat.ino}`,
    "--peer-pid-uid-gid", `${process.pid}:${getuid()}:${getgid()}`,
    "--process-tuple", `${startTicks}:${exeStat.dev}:${exeStat.ino}:${exeStat.size}`,
    "--runsc-artifact", ID.runscArtifact,
    "--runsc-sha256", runscSha256,
  ]
}

test("H4-R3G-D native watchdog durably records the exact physical arm replay before positive stdout ACK", { skip: process.platform !== "linux", timeout: 20_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "kodac-r3gd-native-arm-replay-"))
  await chmod(root, 0o700)
  const binary = join(root, "watchdog")
  const socketPath = join(root, "control.sock")
  const sockets = new Set<Socket>()
  let waitSocket: Socket | undefined
  const server = createServer((socket) => {
    sockets.add(socket)
    socket.once("close", () => sockets.delete(socket))
    let buffered = ""
    socket.setEncoding("utf8")
    socket.on("data", (chunk: string) => {
      buffered += chunk
      let request: { method?: unknown; arg?: unknown }
      try { request = JSON.parse(buffered) as { method?: unknown; arg?: unknown } } catch { return }
      buffered = ""
      if (request.method === "containerManager.Wait") { waitSocket = socket; return }
      if (request.method === "containerManager.Processes") { socket.write(JSON.stringify({ success: true, err: "", result: [{ pid: 1 }] })); return }
      if (request.method === "containerManager.Signal") {
        socket.write(JSON.stringify({ success: true, err: "", result: null }))
        setTimeout(() => waitSocket?.write(JSON.stringify({ success: true, err: "", result: 0 })), 5)
      }
    })
  })
  try {
    await new Promise<void>((resolvePromise, rejectPromise) => { server.once("error", rejectPromise); server.listen(socketPath, () => { server.off("error", rejectPromise); resolvePromise() }) })
    const args = await nativeArgs(root, binary, socketPath)
    const result = await runChild(binary, args)
    assert.equal(result.signal, null)
    assert.equal(result.code, 0, result.stderr)
    const armLine = result.stdout.trim().split("\n")[0]
    const physicalAckMatch = / physical-ack=([0-9a-f]{64})$/.exec(armLine)
    assert.ok(physicalAckMatch, armLine)

    const claim = parseGvisorTtlPhysicalOwnerClaimRecord(await readFile(join(root, `${ID.arm}.claim`), "utf8"))
    const lease = parseGvisorTtlPhysicalLeaseRecord(await readFile(join(root, `${ID.arm}.lease`), "utf8"), claim)
    const replay = parseGvisorTtlPhysicalArmReplayRecord(await readFile(join(root, `${ID.arm}.arm`), "utf8"), lease)
    assert.equal(replay.physicalArmAcknowledgementIdentity, physicalAckMatch[1])
    assert.equal(replay.controlPeerBindingIdentity.length, 64)
    assert.equal(replay.retainedPidfdProcessIdentity.length, 64)
    assert.equal(replay.retainedRunscExecutableIdentity.length, 64)

    const recovery = await inspectGvisorTtlPhysicalRecoveryRegistry(root)
    assert.equal(recovery.length, 1)
    assert.equal(recovery[0].armOperationIdentity, ID.arm)
    assert.equal(recovery[0].clockContinuity, "SAME_BOOT")
    assert.equal(recovery[0].armReplay?.armRegistryRecordIdentity, replay.armRegistryRecordIdentity)
    assert.equal(recovery[0].terminal?.terminalOutcome, "ttl-expired")
  } finally {
    for (const socket of sockets) socket.destroy()
    if (server.listening) await closeServer(server).catch(() => {})
    await rm(root, { recursive: true, force: true })
  }
})

test("H4-R3G-D failed retained Wait dispatch leaves no physical arm replay and emits no positive ACK", { skip: process.platform !== "linux", timeout: 20_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "kodac-r3gd-native-arm-replay-fail-"))
  await chmod(root, 0o700)
  const binary = join(root, "watchdog")
  const socketPath = join(root, "control.sock")
  const sockets = new Set<Socket>()
  let accepted = 0
  const server = createServer((socket) => {
    accepted += 1
    sockets.add(socket)
    socket.once("close", () => sockets.delete(socket))
    socket.on("error", () => {})
    if (accepted === 1) socket.destroy()
  })
  try {
    await new Promise<void>((resolvePromise, rejectPromise) => { server.once("error", rejectPromise); server.listen(socketPath, () => { server.off("error", rejectPromise); resolvePromise() }) })
    const args = await nativeArgs(root, binary, socketPath)
    const result = await runChild(binary, args)
    assert.equal(result.signal, null)
    assert.ok(result.code === 125 || result.code === 126, result.stderr)
    assert.equal(result.stdout, "")
    await assert.rejects(readFile(join(root, `${ID.arm}.arm`), "utf8"), (error: unknown) => {
      return error instanceof Error && "code" in error && (error as NodeJS.ErrnoException).code === "ENOENT"
    })
    const recovery = await inspectGvisorTtlPhysicalRecoveryRegistry(root)
    assert.equal(recovery.length, 1)
    assert.equal(recovery[0].armOperationIdentity, ID.arm)
    assert.equal(recovery[0].armReplay, null)
    assert.equal(recovery[0].terminal, null)
    assert.equal(recovery[0].clockContinuity, "SAME_BOOT")
  } finally {
    for (const socket of sockets) socket.destroy()
    if (server.listening) await closeServer(server).catch(() => {})
    await rm(root, { recursive: true, force: true })
  }
})