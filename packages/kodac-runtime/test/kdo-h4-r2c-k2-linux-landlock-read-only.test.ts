import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  chmodSync,
  closeSync,
  existsSync,
  mkdtempSync,
  openSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import test from "node:test"

import { NodeWorkspaceFileSystem } from "../src/edit/filesystem.ts"
import {
  createReceipt,
  validateReceiptConfinementBinding,
} from "../src/evidence/receipt.ts"
import {
  ExecutionBlockedError,
  ExecutionFailedError,
  ExecutionGateway,
  ExecutionUnprovenError,
} from "../src/execution/gateway.ts"
import {
  createConfinementEnforcementEvidence,
  createConfinementRequest,
} from "../src/trust/confinement.ts"
import {
  KDO_H4_R2B_LINUX_LANDLOCK_LAUNCHER_FAILURE_EXIT,
  createLinuxLandlockBackendDescriptor,
} from "../src/trust/confinement-linux-landlock.ts"
import {
  KDO_H4_R2C_BOOTSTRAP_ENVIRONMENT_POLICY,
  KDO_H4_R2C_CONTROL_FLAG,
  KDO_H4_R2C_LAUNCHER_FD,
  KDO_H4_R2C_LAUNCHER_WRITE_PROTECTION,
  KDO_H4_R2C_MAX_LAUNCHER_BYTES,
  KDO_H4_R2C_PERMIT_FD,
  KDO_H4_R2C_READY_FD,
  KDO_H4_R2C_READY_MAX_BYTES,
  createConfinementExecutionAttempt,
  createConfinementReceiptBinding,
  createDurableConfinementEvidenceCommit,
  createDurableConfinementEvidenceRecord,
  createLauncherArtifactObservation,
  createLauncherArtifactWriteProtection,
  createLinuxLandlockRuntimeConfig,
  createLocalWorkspaceRootIdentity,
  parseLinuxLandlockReadyRecord,
  validateDurableConfinementEvidenceCommit,
  validateDurableConfinementEvidenceRecord,
  validateLinuxLandlockRuntimeConfig,
  type DurableConfinementEvidenceRecord,
} from "../src/trust/confinement-runtime.ts"
import { fixedPolicy } from "../src/trust/policy.ts"

const ID_A = "a".repeat(64)
const ID_B = "b".repeat(64)
const ID_C = "c".repeat(64)
const source = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf8")

function gitBlobSha1(text: string): string {
  const canonical = text.replace(/\r\n/g, "\n")
  const body = Buffer.from(canonical, "utf8")
  return createHash("sha1").update(`blob ${body.byteLength}\0`).update(body).digest("hex")
}

function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex")
}

function compileC(root: string, name: string, text: string): string {
  const sourcePath = join(root, `${name}.c`)
  const binary = join(root, name)
  writeFileSync(sourcePath, text, "utf8")
  const compile = spawnSync("cc", ["-std=c11", "-O2", "-Wall", "-Wextra", "-Werror", sourcePath, "-o", binary], {
    encoding: "utf8",
    shell: false,
  })
  assert.equal(compile.status, 0, `${name} compile failed: ${String(compile.stderr)}`)
  return binary
}

function compileLauncher(root: string): string {
  const nativePath = fileURLToPath(new URL("../native/landlock-run.c", import.meta.url))
  const binary = join(root, "kodac-landlock-run")
  const compile = spawnSync("cc", ["-std=c11", "-O2", "-Wall", "-Wextra", "-Werror", nativePath, "-o", binary], {
    encoding: "utf8",
    shell: false,
  })
  assert.equal(compile.status, 0, `native compile failed: ${String(compile.stderr)}`)
  return binary
}

function compileSigpipeProbe(root: string): string {
  return compileC(root, "sigpipe-probe", `#include <signal.h>\n#include <stdio.h>\nint main(void) {\n  void (*previous)(int) = signal(SIGPIPE, SIG_DFL);\n  if (previous == SIG_ERR) return 2;\n  if (previous != SIG_DFL) return 3;\n  fputs("SIGPIPE_DEFAULT", stdout);\n  return 0;\n}\n`)
}

function compileProtocolFixture(root: string): string {
  return compileC(root, "protocol-fixture", `#include <errno.h>\n#include <fcntl.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <unistd.h>\n\nstatic int write_all(int fd, const char *p, size_t n) {\n  size_t off = 0;\n  while (off < n) {\n    ssize_t w = write(fd, p + off, n - off);\n    if (w < 0) { if (errno == EINTR) continue; return 125; }\n    if (w == 0) return 125;\n    off += (size_t)w;\n  }\n  return 0;\n}\n\nint main(void) {\n  const char *mode = getenv("KODAC_FIXTURE_READY");\n  const char *ready = "kodac-landlock-ready-v1 abi=7 claim-set=kodac-linux-landlock-fs-v1 enforcement=full\\n";\n  char oversized[130];\n  size_t ready_len = strlen(ready);\n  if (mode != NULL && strcmp(mode, "partial") == 0) {\n    ready = "kodac-landlock-ready-v1 abi=3 claim-set=kodac-linux-landlock-fs-v1 enforcement=partial\\n";\n    ready_len = strlen(ready);\n  } else if (mode != NULL && strcmp(mode, "malformed") == 0) {\n    ready = "malformed\\n";\n    ready_len = strlen(ready);\n  } else if (mode != NULL && strcmp(mode, "oversized") == 0) {\n    memset(oversized, 'x', sizeof oversized);\n    oversized[sizeof oversized - 1] = '\\n';\n    ready = oversized;\n    ready_len = sizeof oversized;\n  }\n  if (write_all(4, ready, ready_len) != 0) return 125;\n  if (close(4) != 0) return 125;\n  char permit[4];\n  size_t used = 0;\n  for (;;) {\n    if (used == sizeof permit) return 125;\n    ssize_t r = read(5, permit + used, sizeof permit - used);\n    if (r < 0) { if (errno == EINTR) continue; return 125; }\n    if (r == 0) break;\n    used += (size_t)r;\n  }\n  if (used != 3 || memcmp(permit, "GO\\n", 3) != 0) return 125;\n  const char *witness = getenv("KODAC_GO_WITNESS");\n  if (witness != NULL) {\n    int fd = open(witness, O_WRONLY | O_CREAT | O_TRUNC, 0600);\n    if (fd < 0) return 125;\n    if (write_all(fd, "GO", 2) != 0) { close(fd); return 125; }\n    if (close(fd) != 0) return 125;\n  }\n  return 0;\n}\n`)
}

function compilePreloadFixture(root: string): string {
  const sourcePath = join(root, "preload-fixture.c")
  const library = join(root, "preload-fixture.so")
  writeFileSync(sourcePath, `#include <fcntl.h>\n#include <stdlib.h>\n#include <unistd.h>\n__attribute__((constructor)) static void before_main(void) {\n  const char *path = getenv("KODAC_PRELOAD_WITNESS");\n  if (path == NULL) return;\n  int fd = open(path, O_WRONLY | O_CREAT | O_TRUNC, 0600);\n  if (fd < 0) return;\n  if (write(fd, "PREMAIN", 7) != 7) { (void)close(fd); return; }\n  (void)close(fd);\n}\n`, "utf8")
  const compile = spawnSync("cc", ["-shared", "-fPIC", "-O2", "-Wall", "-Wextra", "-Werror", sourcePath, "-o", library], {
    encoding: "utf8",
    shell: false,
  })
  assert.equal(compile.status, 0, `preload fixture compile failed: ${String(compile.stderr)}`)
  return library
}

function requireIntegrationHost(t: { skip(message?: string): void }): boolean {
  const failOrSkip = (message: string): false => {
    if (process.env.GITHUB_ACTIONS === "true") assert.fail(message)
    t.skip(message)
    return false
  }
  if (typeof process.geteuid !== "function" || process.geteuid() === 0) {
    return failOrSkip("H4-R2C security proof requires a non-root Linux K2 process")
  }
  const compiler = spawnSync("cc", ["--version"], { encoding: "utf8", shell: false })
  if (compiler.status !== 0) return failOrSkip(`C compiler unavailable: ${String(compiler.error ?? compiler.stderr)}`)
  const sudo = spawnSync("sudo", ["-n", "true"], { encoding: "utf8", shell: false })
  if (sudo.status !== 0) return failOrSkip(`passwordless sudo unavailable for trusted launcher fixture: ${String(sudo.error ?? sudo.stderr)}`)
  return true
}

function protectLauncherForGateway(path: string): void {
  chmodSync(path, 0o755)
  const chown = spawnSync("sudo", ["-n", "chown", "0:0", path], { encoding: "utf8", shell: false })
  assert.equal(chown.status, 0, `could not make launcher fixture root-owned: ${String(chown.error ?? chown.stderr)}`)
  const stat = statSync(path)
  assert.equal(stat.uid, 0)
  assert.equal(stat.gid, 0)
  assert.equal(stat.nlink, 1)
  assert.equal(stat.mode & 0o022, 0)
  assert.equal(stat.mode & 0o005, 0o005)
}

function durableRuntime(launcherPath: string, onCommit?: (record: DurableConfinementEvidenceRecord) => void) {
  return createLinuxLandlockRuntimeConfig({
    launcherPath,
    expectedLauncherSha256: sha256File(launcherPath),
    evidence: {
      commit(record) {
        onCommit?.(record)
        return createDurableConfinementEvidenceCommit(record)
      },
    },
    requiredEnforcement: "full",
  })
}

test("H4-R2C structural contracts are strict immutable and receipt binding rejects semantic substitution", () => {
  assert.equal(KDO_H4_R2C_CONTROL_FLAG, "--controlled")
  assert.equal(KDO_H4_R2C_LAUNCHER_FD, 3)
  assert.equal(KDO_H4_R2C_READY_FD, 4)
  assert.equal(KDO_H4_R2C_PERMIT_FD, 5)
  assert.equal(KDO_H4_R2C_READY_MAX_BYTES, 128)
  assert.equal(KDO_H4_R2C_MAX_LAUNCHER_BYTES, 4 * 1024 * 1024)
  assert.equal(KDO_H4_R2C_BOOTSTRAP_ENVIRONMENT_POLICY, "reject-linux-loader-control-v1")
  assert.equal(KDO_H4_R2C_LAUNCHER_WRITE_PROTECTION, "root-owned-unprivileged-read-exec-v1")

  const fullReady = parseLinuxLandlockReadyRecord("kodac-landlock-ready-v1 abi=9 claim-set=kodac-linux-landlock-fs-v1 enforcement=full\n")
  assert.deepEqual(fullReady, { abi: 9, claimSet: "kodac-linux-landlock-fs-v1", enforcement: "full" })
  const partialReady = parseLinuxLandlockReadyRecord("kodac-landlock-ready-v1 abi=3 claim-set=kodac-linux-landlock-fs-v1 enforcement=partial\n")
  assert.equal(partialReady.enforcement, "partial")
  assert.throws(() => parseLinuxLandlockReadyRecord("kodac-landlock-ready-v1 abi=3 claim-set=kodac-linux-landlock-fs-v1 enforcement=full\n"))
  assert.throws(() => parseLinuxLandlockReadyRecord(`${"x".repeat(128)}\n`))
  assert.throws(() => parseLinuxLandlockReadyRecord("é\n"))

  const firstAttempt = createConfinementExecutionAttempt({ executionIntentIdentity: ID_A, nonce: "nonce-a" })
  const sameAttempt = createConfinementExecutionAttempt({ executionIntentIdentity: ID_A, nonce: "nonce-a" })
  const secondAttempt = createConfinementExecutionAttempt({ executionIntentIdentity: ID_A, nonce: "nonce-b" })
  assert.equal(firstAttempt.executionAttemptIdentity, sameAttempt.executionAttemptIdentity)
  assert.notEqual(firstAttempt.executionAttemptIdentity, secondAttempt.executionAttemptIdentity)
  assert.equal(Object.isFrozen(firstAttempt), true)

  const writeProtection = createLauncherArtifactWriteProtection({ ownerUid: 0, ownerGid: 0, permissions: 0o755, linkCount: 1 })
  assert.equal(Object.isFrozen(writeProtection), true)
  assert.throws(() => createLauncherArtifactWriteProtection({ ownerUid: 1000, ownerGid: 0, permissions: 0o755, linkCount: 1 }))
  assert.throws(() => createLauncherArtifactWriteProtection({ ownerUid: 0, ownerGid: 0, permissions: 0o775, linkCount: 1 }))
  assert.throws(() => createLauncherArtifactWriteProtection({ ownerUid: 0, ownerGid: 0, permissions: 0o755, linkCount: 2 }))

  const workspaceIdentity = createLocalWorkspaceRootIdentity("/workspace")
  const request = createConfinementRequest({ mode: "read-only", workspaceIdentity, executionIntentIdentity: ID_A, scope: { readPaths: ["docs/readme.md"], writePaths: [] } })
  const backend = createLinuxLandlockBackendDescriptor()
  const enforcementEvidence = createConfinementEnforcementEvidence({ request, executionAttemptIdentity: firstAttempt.executionAttemptIdentity, backend, enforcement: "full", reason: "fixture full" })
  const launcherArtifact = createLauncherArtifactObservation({ launcherPath: "/opt/kodac/landlock-run", sha256: ID_B, sizeBytes: 1234, writeProtection })
  const record = createDurableConfinementEvidenceRecord({ executionAttempt: firstAttempt, request, enforcementEvidence, launcherArtifact })
  const commit = createDurableConfinementEvidenceCommit(record)
  const binding = createConfinementReceiptBinding({ record, commit })
  assert.deepEqual(validateDurableConfinementEvidenceRecord(JSON.parse(JSON.stringify(record))), record)
  assert.deepEqual(validateDurableConfinementEvidenceCommit(JSON.parse(JSON.stringify(commit)), record), commit)
  assert.throws(() => validateDurableConfinementEvidenceCommit({ ...commit, recordIdentity: ID_C }, record))
  assert.throws(() => createDurableConfinementEvidenceRecord({ executionAttempt: secondAttempt, request, enforcementEvidence, launcherArtifact }))

  const receipt = createReceipt({
    capability: "fixture.receipt",
    inputDigest: ID_A,
    paths: [],
    policy: { decision: "allow", reason: "fixture" },
    confinement: binding,
    startedAt: "2026-08-14T00:00:00.000Z",
    completedAt: "2026-08-14T00:00:01.000Z",
    result: { status: "success", outputDigest: ID_B, outputBytes: 0, exitCode: 0 },
  })
  assert.ok(receipt.confinement)
  assert.deepEqual(validateReceiptConfinementBinding(JSON.parse(JSON.stringify(receipt.confinement))), receipt.confinement)
  assert.throws(() => validateReceiptConfinementBinding({ ...receipt.confinement, requestIdentity: ID_C }), /binding identity mismatch/)
  assert.throws(() => validateReceiptConfinementBinding({ ...receipt.confinement, enforcement: "partial" }), /binding identity mismatch/)

  const sink = { commit: (_record: DurableConfinementEvidenceRecord) => commit }
  const runtime = createLinuxLandlockRuntimeConfig({ launcherPath: "/opt/kodac/landlock-run", expectedLauncherSha256: ID_B, evidence: sink, requiredEnforcement: "full" })
  sink.commit = () => ({ tampered: true }) as never
  assert.equal(Object.isFrozen(runtime), true)
  assert.equal(Object.isFrozen(runtime.evidence), true)
  assert.deepEqual(validateLinuxLandlockRuntimeConfig(runtime), runtime)
  assert.throws(() => validateLinuxLandlockRuntimeConfig({ ...runtime, requiredEnforcement: "partial" }))
})

test("H4-R2C authority boundaries preserve ASK blocker and protected surfaces", () => {
  const runtimeSource = source("../src/trust/confinement-runtime.ts")
  assert.doesNotMatch(runtimeSource, /child_process|\bspawn\s*\(|\bexecFile\s*\(|readFile|writeFile|appendFile|process\.env|Deno|Bun/)
  const gatewaySource = source("../src/execution/gateway.ts")
  assert.match(gatewaySource, /external executable identity requires H4-R2 confinement/)
  assert.match(gatewaySource, /\/proc\/self\/fd\//)
  assert.match(gatewaySource, /artifact\.handle\.fd/)
  assert.match(gatewaySource, /KDO_H4_R2C_CONTROL_FLAG/)
  assert.match(gatewaySource, /awaitEvidenceCommit/)
  assert.match(gatewaySource, /unsafeLinuxLoaderEnvironmentKey/)
  assert.match(gatewaySource, /createLauncherArtifactWriteProtection/)
  assert.doesNotMatch(gatewaySource, /workspace-write/)
  assert.match(source("../src/evidence/receipt.ts"), /bindingIdentity/)

  // Ledger phase is verified by the repository-level pre/post-ledger inventory gate.
  // This focused runtime proof must remain valid both before and after the separately
  // authorized ledger path is added.
  assert.equal(gitBlobSha1(source("../src/trust/confinement.ts")), "873f235120645c0a12f10a5bff7e9591db6bb341")
  assert.equal(gitBlobSha1(source("../src/trust/policy.ts")), "b4134e430204123bebe053ffc9105f05fca611c9")
  assert.equal(gitBlobSha1(source("../src/trust/approval.ts")), "d36a604cb1957bc65dac3978c626ba48a9b299fb")
  assert.equal(gitBlobSha1(source("../src/verification/done-gate.ts")), "067e147569fa52cc2b04c5df26fbe20a01e958e9")
  assert.equal(gitBlobSha1(source("../src/agent/loop.ts")), "a5b7c2bbb2a5f7658f683e7baf45655b41b775f8")
  assert.equal(gitBlobSha1(source("../src/tools/registry.ts")), "0bdf5cfd02efda7cab0c81976c7735bc7b46081b")
  assert.equal(gitBlobSha1(source("../package.json")), "af4c20a3dae387c15cc5fb2eb28d415c8f115b95")
  assert.equal(gitBlobSha1(source("../scripts/run-tests.mjs")), "9a0bcde0e565168c78eb7fe4d3cf08236d24baa7")
})

test("Linux retained open-file bytes survive configured-path replacement", { skip: process.platform !== "linux" }, () => {
  const root = mkdtempSync(join(tmpdir(), "kodac-r2c-fd-"))
  try {
    const configured = join(root, "launcher")
    const replacement = join(root, "replacement")
    writeFileSync(configured, "verified-bytes", "utf8")
    writeFileSync(replacement, "replacement-bytes", "utf8")
    const fd = openSync(configured, "r")
    try {
      renameSync(replacement, configured)
      assert.equal(readFileSync(fd, "utf8"), "verified-bytes")
      assert.equal(readFileSync(configured, "utf8"), "replacement-bytes")
    } finally { closeSync(fd) }
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test("Linux same-inode mutation is observable and untrusted launcher ownership is rejected before spawn", { skip: process.platform !== "linux" }, async () => {
  if (typeof process.geteuid !== "function" || process.geteuid() === 0) return
  const root = mkdtempSync(join(tmpdir(), "kodac-r2c-inode-"))
  try {
    const configured = join(root, "launcher")
    writeFileSync(configured, "verified-bytes", "utf8")
    chmodSync(configured, 0o755)
    const fd = openSync(configured, "r")
    try {
      writeFileSync(configured, "mutated-in-place", "utf8")
      assert.equal(readFileSync(fd, "utf8"), "mutated-in-place")
    } finally { closeSync(fd) }

    let commits = 0
    const runtime = createLinuxLandlockRuntimeConfig({
      launcherPath: configured,
      expectedLauncherSha256: sha256File(configured),
      evidence: { commit() { commits += 1; throw new Error("must not commit") } },
      requiredEnforcement: "full",
    })
    const gateway = new ExecutionGateway(new NodeWorkspaceFileSystem(root), fixedPolicy("allow", "fixture allow"), undefined, runtime)
    await assert.rejects(
      () => gateway.runConfinedReadOnlyCommand("fixture.landlock-untrusted-inode", "/bin/true", [], undefined, { env: {} }),
      (error: unknown) => {
        assert.ok(error instanceof ExecutionFailedError)
        assert.match(error.message, /owned by root:root/)
        return true
      },
    )
    assert.equal(commits, 0)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test("H4-R2C Linux integration proves controlled read-only execution and fail-closed protocol evidence", { skip: process.platform !== "linux" }, async (t) => {
  if (!requireIntegrationHost(t)) return
  const root = mkdtempSync(join(tmpdir(), "kodac-h4-r2c-"))
  try {
    const binary = compileLauncher(root)
    const probe = spawnSync(binary, ["--probe"], { encoding: "utf8", shell: false })
    if (probe.status !== 0) {
      const message = `Landlock unavailable on this host: ${String(probe.error ?? probe.stderr)}`
      if (process.env.GITHUB_ACTIONS === "true") assert.fail(message)
      t.skip(message)
      return
    }
    const probeMatch = /^kodac-landlock-v1 abi=([1-9][0-9]*) claim-set=kodac-linux-landlock-fs-v1 enforcement=(full|partial)\n$/.exec(probe.stdout)
    assert.ok(probeMatch, `unexpected probe output: ${probe.stdout}`)
    assert.equal(probeMatch[2], "full", `R2C requires full Landlock enforcement; got: ${probe.stdout}`)

    protectLauncherForGateway(binary)

    const missingFdLauncher = openSync(binary, "r")
    try {
      const missing = spawnSync(binary, ["--controlled", "--ro", "/", "--", process.execPath, "-e", "process.stdout.write('TARGET_EXECUTED')"], { encoding: "utf8", shell: false, stdio: ["ignore", "pipe", "pipe", missingFdLauncher] })
      assert.equal(missing.status, KDO_H4_R2B_LINUX_LANDLOCK_LAUNCHER_FAILURE_EXIT)
      assert.equal(missing.stdout.includes("TARGET_EXECUTED"), false)
    } finally { closeSync(missingFdLauncher) }

    const aliasControlPath = join(root, "aliased-control")
    const launcherFd = openSync(binary, "r")
    const aliasedControlFd = openSync(aliasControlPath, "w+")
    try {
      const aliased = spawnSync(binary, ["--controlled", "--ro", "/", "--", process.execPath, "-e", "process.stdout.write('TARGET_EXECUTED')"], { encoding: "utf8", shell: false, stdio: ["ignore", "pipe", "pipe", launcherFd, aliasedControlFd, aliasedControlFd] })
      assert.equal(aliased.status, KDO_H4_R2B_LINUX_LANDLOCK_LAUNCHER_FAILURE_EXIT)
      assert.match(aliased.stderr, /controlled descriptor map is aliased/)
      assert.equal(aliased.stdout.includes("TARGET_EXECUTED"), false)
    } finally { closeSync(launcherFd); closeSync(aliasedControlFd) }

    const readyControlPath = join(root, "ready-control")
    const permitControlPath = join(root, "permit-control")
    const directionalLauncherFd = openSync(binary, "r")
    const readyControlFd = openSync(readyControlPath, "w+")
    const permitControlFd = openSync(permitControlPath, "w+")
    try {
      const wrongDuplexTransport = spawnSync(binary, ["--controlled", "--ro", "/", "--", process.execPath, "-e", "process.stdout.write('TARGET_EXECUTED')"], {
        encoding: "utf8",
        shell: false,
        stdio: ["ignore", "pipe", "pipe", directionalLauncherFd, readyControlFd, permitControlFd],
      })
      assert.equal(wrongDuplexTransport.status, KDO_H4_R2B_LINUX_LANDLOCK_LAUNCHER_FAILURE_EXIT)
      assert.match(wrongDuplexTransport.stderr, /cannot disable the forbidden (read|write) direction/)
      assert.equal(wrongDuplexTransport.stdout.includes("TARGET_EXECUTED"), false)
    } finally {
      closeSync(directionalLauncherFd)
      closeSync(readyControlFd)
      closeSync(permitControlFd)
    }

    const fs = new NodeWorkspaceFileSystem(root)
    const committed: DurableConfinementEvidenceRecord[] = []
    const runtime = durableRuntime(binary, (record) => committed.push(record))
    const gateway = new ExecutionGateway(fs, fixedPolicy("allow", "fixture allow"), undefined, runtime)

    const preloadLibrary = compilePreloadFixture(root)
    const preloadWitness = join(root, "pre-landlock-preload-witness")
    await assert.rejects(
      () => gateway.runConfinedReadOnlyCommand("fixture.landlock-preload-blocked", process.execPath, ["-e", "process.exit(0)"], undefined, {
        env: { LD_PRELOAD: preloadLibrary, KODAC_PRELOAD_WITNESS: preloadWitness },
        timeoutMs: 10_000,
      }),
      (error: unknown) => {
        assert.ok(error instanceof ExecutionBlockedError)
        assert.match(error.message, /LD_PRELOAD is forbidden before Landlock activation/)
        return true
      },
    )
    assert.equal(existsSync(preloadWitness), false)
    assert.equal(committed.length, 0)

    const read = await gateway.runConfinedReadOnlyCommand("fixture.landlock-read", process.execPath, ["-e", "require('node:fs').readFileSync('/etc/hosts'); process.stdout.write('READ_OK')"], undefined, { env: {}, timeoutMs: 10_000 })
    assert.equal(read.stdout, "READ_OK")
    assert.equal(read.receipt.policy.decision, "allow")
    assert.equal(read.receipt.confinement?.enforcement, "full")
    assert.equal(read.receipt.confinement?.durableRecordIdentity, committed[0]?.recordIdentity)
    assert.equal(committed.length, 1)
    const proofRecord = committed[0]
    assert.ok(proofRecord)
    const proofCommit = createDurableConfinementEvidenceCommit(proofRecord)
    assert.equal(proofRecord.launcherArtifact.sha256, sha256File(binary))
    assert.equal(proofRecord.launcherArtifact.writeProtection.policy, KDO_H4_R2C_LAUNCHER_WRITE_PROTECTION)
    assert.equal(proofRecord.launcherArtifact.writeProtection.ownerUid, 0)
    assert.equal(proofRecord.launcherArtifact.writeProtection.ownerGid, 0)
    assert.ok(read.receipt.confinement)
    console.log(`H4_R2C_LINUX_PROOF ${JSON.stringify({
      abi: Number(probeMatch[1]),
      claimSet: "kodac-linux-landlock-fs-v1",
      enforcement: probeMatch[2],
      bootstrapEnvironmentPolicy: KDO_H4_R2C_BOOTSTRAP_ENVIRONMENT_POLICY,
      launcherWriteProtection: proofRecord.launcherArtifact.writeProtection,
      launcherExpectedSha256: sha256File(binary),
      launcherObservedSha256: proofRecord.launcherArtifact.sha256,
      workspaceIdentity: proofRecord.request.workspaceIdentity,
      executionIntentIdentity: proofRecord.request.executionIntentIdentity,
      requestIdentity: proofRecord.request.requestIdentity,
      executionAttemptIdentity: proofRecord.executionAttempt.executionAttemptIdentity,
      backendIdentity: proofRecord.enforcementEvidence.backend.backendIdentity,
      enforcementEvidenceIdentity: proofRecord.enforcementEvidence.evidenceIdentity,
      durableRecordIdentity: proofRecord.recordIdentity,
      durableCommitAcknowledgmentIdentity: proofCommit.acknowledgmentIdentity,
      receiptBindingIdentity: read.receipt.confinement.bindingIdentity,
    })}`)

    const blockedWrite = join(root, "target-must-not-write.txt")
    await assert.rejects(() => gateway.runConfinedReadOnlyCommand("fixture.landlock-no-write", process.execPath, ["-e", `require('node:fs').writeFileSync(${JSON.stringify(blockedWrite)}, 'BAD')`], undefined, { env: {}, timeoutMs: 10_000 }), (error: unknown) => {
      assert.ok(error instanceof ExecutionFailedError)
      assert.equal(error.receipt.confinement?.enforcement, "full")
      return true
    })
    assert.equal(existsSync(blockedWrite), false)

    const fdClean = await gateway.runConfinedReadOnlyCommand("fixture.landlock-fd-clean", "/bin/sh", ["-c", "for fd in 3 4 5; do if [ -e /proc/self/fd/$fd ]; then exit 91; fi; done; printf FD_CLEAN"], undefined, { env: {}, timeoutMs: 10_000 })
    assert.equal(fdClean.stdout, "FD_CLEAN")

    const sigpipeProbe = compileSigpipeProbe(root)
    const sigpipe = await gateway.runConfinedReadOnlyCommand("fixture.landlock-sigpipe-default", sigpipeProbe, [], undefined, { env: {}, timeoutMs: 10_000 })
    assert.equal(sigpipe.stdout, "SIGPIPE_DEFAULT")

    const commitMarker = join(root, "durable-before-go.txt")
    const orderingRuntime = durableRuntime(binary, () => writeFileSync(commitMarker, "COMMITTED", "utf8"))
    const orderingGateway = new ExecutionGateway(fs, fixedPolicy("allow", "fixture allow"), undefined, orderingRuntime)
    const ordering = await orderingGateway.runConfinedReadOnlyCommand("fixture.landlock-ordering", process.execPath, ["-e", `process.stdout.write(require('node:fs').readFileSync(${JSON.stringify(commitMarker)}, 'utf8'))`], undefined, { env: {}, timeoutMs: 10_000 })
    assert.equal(ordering.stdout, "COMMITTED")

    let approvalCalls = 0
    const approval = { service: { decide() { approvalCalls += 1; return {} } }, evidence: { commit() { approvalCalls += 1; return {} } } }
    const askGateway = new ExecutionGateway(fs, fixedPolicy("ask", "fixture ask"), approval as never, runtime)
    await assert.rejects(() => askGateway.runConfinedReadOnlyCommand("fixture.landlock-ask", process.execPath, ["-e", "process.exit(0)"], undefined, { env: {} }), (error: unknown) => {
      assert.ok(error instanceof ExecutionBlockedError)
      assert.match(error.message, /external executable identity requires H4-R2 confinement/)
      return true
    })
    assert.equal(approvalCalls, 0)

    const denyRuntime = createLinuxLandlockRuntimeConfig({ launcherPath: "/definitely/missing/kodac-landlock-run", expectedLauncherSha256: ID_C, evidence: { commit() { throw new Error("must not run") } }, requiredEnforcement: "full" })
    const denyGateway = new ExecutionGateway(fs, fixedPolicy("deny", "fixture deny"), undefined, denyRuntime)
    await assert.rejects(() => denyGateway.runConfinedReadOnlyCommand("fixture.landlock-deny", process.execPath, ["-e", "process.exit(0)"], undefined, { env: {} }), ExecutionBlockedError)

    const missingRuntimeGateway = new ExecutionGateway(fs, fixedPolicy("allow", "fixture allow"))
    await assert.rejects(() => missingRuntimeGateway.runConfinedReadOnlyCommand("fixture.landlock-missing-runtime", process.execPath, ["-e", "process.exit(0)"], undefined, { env: {} }), ExecutionBlockedError)

    let mismatchCommits = 0
    const mismatchRuntime = createLinuxLandlockRuntimeConfig({ launcherPath: binary, expectedLauncherSha256: ID_C, evidence: { commit() { mismatchCommits += 1; throw new Error("must not commit") } }, requiredEnforcement: "full" })
    const mismatchGateway = new ExecutionGateway(fs, fixedPolicy("allow", "fixture allow"), undefined, mismatchRuntime)
    await assert.rejects(() => mismatchGateway.runConfinedReadOnlyCommand("fixture.landlock-digest-mismatch", process.execPath, ["-e", "process.exit(0)"], undefined, { env: {} }), ExecutionFailedError)
    assert.equal(mismatchCommits, 0)

    const noCommitTarget = join(root, "must-not-run-on-commit-failure.txt")
    const failingRuntime = createLinuxLandlockRuntimeConfig({ launcherPath: binary, expectedLauncherSha256: sha256File(binary), evidence: { commit() { throw new Error("fixture durable commit failure") } }, requiredEnforcement: "full" })
    const failingGateway = new ExecutionGateway(fs, fixedPolicy("allow", "fixture allow"), undefined, failingRuntime)
    await assert.rejects(() => failingGateway.runConfinedReadOnlyCommand("fixture.landlock-commit-failure", process.execPath, ["-e", `require('node:fs').writeFileSync(${JSON.stringify(noCommitTarget)}, 'BAD')`], undefined, { env: {}, timeoutMs: 10_000 }), ExecutionFailedError)
    assert.equal(existsSync(noCommitTarget), false)

    let neverCommitStartedResolve: (() => void) | undefined
    const neverCommitStarted = new Promise<void>((resolve) => { neverCommitStartedResolve = resolve })
    const neverCommitTarget = join(root, "must-not-run-on-never-commit.txt")
    const neverCommitRuntime = createLinuxLandlockRuntimeConfig({ launcherPath: binary, expectedLauncherSha256: sha256File(binary), evidence: { commit() { neverCommitStartedResolve?.(); return new Promise<never>(() => {}) } }, requiredEnforcement: "full" })
    const neverCommitGateway = new ExecutionGateway(fs, fixedPolicy("allow", "fixture allow"), undefined, neverCommitRuntime)
    const neverCommitRun = neverCommitGateway.runConfinedReadOnlyCommand("fixture.landlock-never-commit", process.execPath, ["-e", `require('node:fs').writeFileSync(${JSON.stringify(neverCommitTarget)}, 'BAD')`], undefined, { env: {}, timeoutMs: 250 })
    await neverCommitStarted
    await assert.rejects(() => neverCommitRun, ExecutionFailedError)
    assert.equal(existsSync(neverCommitTarget), false)

    let releaseCommit: (() => void) | undefined
    let commitStartedResolve: (() => void) | undefined
    const commitStarted = new Promise<void>((resolve) => { commitStartedResolve = resolve })
    const cancelTarget = join(root, "must-not-run-after-cancel.txt")
    const pendingRuntime = createLinuxLandlockRuntimeConfig({ launcherPath: binary, expectedLauncherSha256: sha256File(binary), evidence: { commit(record) { commitStartedResolve?.(); return new Promise((resolve) => { releaseCommit = () => resolve(createDurableConfinementEvidenceCommit(record)) }) } }, requiredEnforcement: "full" })
    const controller = new AbortController()
    const pendingGateway = new ExecutionGateway(fs, fixedPolicy("allow", "fixture allow"), undefined, pendingRuntime)
    const pending = pendingGateway.runConfinedReadOnlyCommand("fixture.landlock-cancel-before-go", process.execPath, ["-e", `require('node:fs').writeFileSync(${JSON.stringify(cancelTarget)}, 'BAD')`], undefined, { signal: controller.signal, env: {}, timeoutMs: 10_000 })
    await commitStarted
    controller.abort()
    assert.ok(releaseCommit)
    releaseCommit()
    await assert.rejects(() => pending, ExecutionFailedError)
    assert.equal(existsSync(cancelTarget), false)

    const protocolFixture = compileProtocolFixture(root)
    protectLauncherForGateway(protocolFixture)
    const protocolSha = sha256File(protocolFixture)
    const witness = join(root, "go-witness")

    let malformedAckCommits = 0
    const malformedAckRuntime = createLinuxLandlockRuntimeConfig({ launcherPath: protocolFixture, expectedLauncherSha256: protocolSha, evidence: { commit(record) { malformedAckCommits += 1; return { ...createDurableConfinementEvidenceCommit(record), acknowledgmentIdentity: ID_C } } }, requiredEnforcement: "full" })
    const malformedAckGateway = new ExecutionGateway(fs, fixedPolicy("allow", "fixture allow"), undefined, malformedAckRuntime)
    await assert.rejects(() => malformedAckGateway.runConfinedReadOnlyCommand("fixture.landlock-malformed-ack", "/bin/true", [], undefined, { env: { KODAC_FIXTURE_READY: "full", KODAC_GO_WITNESS: witness }, timeoutMs: 2_000 }), ExecutionFailedError)
    assert.equal(malformedAckCommits, 1)
    assert.equal(existsSync(witness), false)

    const partialRecords: DurableConfinementEvidenceRecord[] = []
    const partialRuntime = createLinuxLandlockRuntimeConfig({ launcherPath: protocolFixture, expectedLauncherSha256: protocolSha, evidence: { commit(record) { partialRecords.push(record); return createDurableConfinementEvidenceCommit(record) } }, requiredEnforcement: "full" })
    const partialGateway = new ExecutionGateway(fs, fixedPolicy("allow", "fixture allow"), undefined, partialRuntime)
    await assert.rejects(() => partialGateway.runConfinedReadOnlyCommand("fixture.landlock-partial", "/bin/true", [], undefined, { env: { KODAC_FIXTURE_READY: "partial", KODAC_GO_WITNESS: witness }, timeoutMs: 2_000 }), ExecutionFailedError)
    assert.equal(partialRecords.length, 1)
    assert.equal(partialRecords[0]?.enforcementEvidence.enforcement, "partial")
    assert.equal(existsSync(witness), false)

    for (const readyMode of ["malformed", "oversized"] as const) {
      let readyCommits = 0
      const readyRuntime = createLinuxLandlockRuntimeConfig({ launcherPath: protocolFixture, expectedLauncherSha256: protocolSha, evidence: { commit(record) { readyCommits += 1; return createDurableConfinementEvidenceCommit(record) } }, requiredEnforcement: "full" })
      const readyGateway = new ExecutionGateway(fs, fixedPolicy("allow", "fixture allow"), undefined, readyRuntime)
      await assert.rejects(() => readyGateway.runConfinedReadOnlyCommand(`fixture.landlock-ready-${readyMode}`, "/bin/true", [], undefined, { env: { KODAC_FIXTURE_READY: readyMode, KODAC_GO_WITNESS: witness }, timeoutMs: 2_000 }), ExecutionFailedError)
      assert.equal(readyCommits, 0)
      assert.equal(existsSync(witness), false)
    }

    const unprovenGateway = new ExecutionGateway(fs, fixedPolicy("allow", "fixture allow"), undefined, runtime)
    await assert.rejects(() => unprovenGateway.runConfinedReadOnlyCommand("fixture.landlock-receipt-persist-failure", process.execPath, ["-e", "process.stdout.write('TARGET_OK')"], { onReceipt() { throw new Error("fixture receipt sink failure") } }, { env: {}, timeoutMs: 10_000 }), (error: unknown) => {
      assert.ok(error instanceof ExecutionUnprovenError)
      assert.equal(error.receipt.confinement?.enforcement, "full")
      assert.ok(error.receipt.confinement?.bindingIdentity)
      return true
    })

    assert.ok(committed.length >= 4)
    const identities = committed.map((record) => record.executionAttempt.executionAttemptIdentity)
    assert.equal(new Set(identities).size, identities.length)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
