import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { createRequire, syncBuiltinESMExports } from "node:module"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

import { NodeWorkspaceFileSystem, type WorkspaceFileSystem } from "../src/edit/filesystem.ts"
import type { ExecutionReceipt } from "../src/evidence/receipt.ts"
import { ExecutionGateway } from "../src/execution/gateway.ts"
import {
  captureRepositorySnapshot,
  createGatewayGitSnapshotSource,
  parseGitStatusPorcelainV1Z,
  type GitSnapshotSource,
} from "../src/repository/snapshot.ts"
import { repositoryIntelligenceReadPolicy } from "../src/trust/policy.ts"

const goldManifestPath = fileURLToPath(new URL("./fixtures/k3-r1/manifest.json", import.meta.url))
const require = createRequire(import.meta.url)
const childProcessModule = require("node:child_process") as { execFile: (...args: unknown[]) => unknown }

function git(cwd: string, args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8", windowsHide: true })
}

async function initRepository(files: Record<string, string> = { "src/a.txt": "alpha\n" }): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "kodac-k3-r2-"))
  git(root, ["init", "-q"])
  git(root, ["config", "user.email", "k3-r2@example.invalid"])
  git(root, ["config", "user.name", "K3-R2 Fixture"])
  for (const [path, content] of Object.entries(files)) {
    await mkdir(join(root, dirname(path)), { recursive: true })
    await writeFile(join(root, path), content, "utf8")
  }
  git(root, ["add", "."])
  git(root, ["commit", "-q", "-m", "fixture"])
  return root
}

async function realSnapshot(root: string, options: { maxEntries?: number; maxDepth?: number; hashBatchSize?: number } = {}) {
  const fs = new NodeWorkspaceFileSystem(root)
  const gateway = new ExecutionGateway(fs, repositoryIntelligenceReadPolicy())
  return captureRepositorySnapshot(fs, createGatewayGitSnapshotSource(gateway), options)
}

function fakeSource(heads: string[], statuses: string[], objectId = "b".repeat(40)): GitSnapshotSource {
  let headIndex = 0
  let statusIndex = 0
  return {
    async head() {
      return { value: heads[Math.min(headIndex++, heads.length - 1)], provenanceRef: `head:${headIndex}` }
    },
    async status() {
      return { value: statuses[Math.min(statusIndex++, statuses.length - 1)], provenanceRef: `status:${statusIndex}` }
    },
    async hashObjects(paths) {
      return { value: paths.map((path) => ({ path, gitObjectId: objectId })), provenanceRef: "hash:1" }
    },
  }
}

function fakeFs(root: string, entries: { path: string; type: "file" | "directory" | "symlink" }[]): WorkspaceFileSystem {
  return {
    root,
    async exists() { return true },
    async validatePath() {},
    async readText() { return "" },
    async readTextBounded() { return "" },
    async list() { return entries },
    async searchText() { return [] },
    async writeText() { throw new Error("fake snapshot filesystem is read-only") },
    async remove() { throw new Error("fake snapshot filesystem is read-only") },
    async move() { throw new Error("fake snapshot filesystem is read-only") },
  }
}

function gitBlobSha1(bytes: Buffer): string {
  const header = Buffer.from(`blob ${bytes.length}\0`, "utf8")
  return createHash("sha1").update(header).update(bytes).digest("hex")
}

function receiptRecorder(statuses: string[]) {
  return {
    onReceipt(receipt: ExecutionReceipt) {
      statuses.push(receipt.result.status)
    },
  }
}

async function withGitProcessOutput<T>(stdout: string, stderr: string, run: () => Promise<T>): Promise<T> {
  const originalExecFile = childProcessModule.execFile
  childProcessModule.execFile = (...args: unknown[]) => {
    if (args[0] !== "git") throw new Error(`K3-R2 test fixture intercepted unexpected executable: ${String(args[0])}`)
    const callback = args.at(-1)
    if (typeof callback !== "function") throw new Error("K3-R2 test fixture expected an execFile callback")
    queueMicrotask(() => {
      ;(callback as (error: Error | null, stdout: string, stderr: string) => void)(null, stdout, stderr)
    })
    return undefined
  }
  syncBuiltinESMExports()
  try {
    return await run()
  } finally {
    childProcessModule.execFile = originalExecFile
    syncBuiltinESMExports()
  }
}

async function createFilesInOrder(root: string, names: string[]): Promise<void> {
  for (const name of names) await writeFile(join(root, name), `${name}\n`, "utf8")
}

test("K3-R2 clean repository produces a current complete deterministic snapshot", async () => {
  const root = await initRepository()
  try {
    const first = await realSnapshot(root)
    const second = await realSnapshot(root)
    assert.equal(first.freshness, "current")
    assert.equal(first.completeness.state, "complete")
    assert.equal(first.contentIdentity.value, second.contentIdentity.value)
    assert.match(first.repositoryIdentity.value, /^[0-9a-f]{64}$/)
    assert.ok(!JSON.stringify(first).includes(root))
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test("K3-R2 repeated capture without mutation preserves RepositoryContentIdentity", async () => {
  const root = await initRepository()
  try {
    assert.equal((await realSnapshot(root)).contentIdentity.value, (await realSnapshot(root)).contentIdentity.value)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test("K3-R2 working-tree content change changes RepositoryContentIdentity", async () => {
  const root = await initRepository()
  try {
    const before = await realSnapshot(root)
    await writeFile(join(root, "src/a.txt"), "beta\n", "utf8")
    const after = await realSnapshot(root)
    assert.notEqual(before.contentIdentity.value, after.contentIdentity.value)
    assert.equal(after.workingTree[0]?.state, "modified")
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test("K3-R2 status parser matches the canonical K3-R1 repository-state gold oracle", async () => {
  const manifest = JSON.parse(await readFile(goldManifestPath, "utf8"))
  const rawByCase: Record<string, string> = {
    "tracked-modified": " M src/math.ts\0",
    "staged-added": "A  src/new.ts\0",
    "tracked-deleted": " D src/obsolete.ts\0",
    "untracked-file": "?? notes/new.txt\0",
    "renamed-file": "R  src/new-name.ts\0src/old-name.ts\0",
  }
  for (const fixture of manifest.virtual_repository_state_cases) {
    const parsed = parseGitStatusPorcelainV1Z(rawByCase[fixture.case_id])
    assert.equal(parsed.length, 1)
    const change = parsed[0]
    assert.equal(change.state, fixture.expected.state)
    if (fixture.case_id === "renamed-file") {
      assert.equal(change.path, fixture.expected.after_path)
      assert.equal(change.sourcePath, fixture.expected.before_path)
    } else {
      assert.equal(change.path, fixture.expected.path)
    }
  }
})

test("K3-R2 NUL-delimited status parser preserves paths with spaces", () => {
  const parsed = parseGitStatusPorcelainV1Z("R  src/new name.ts\0src/old name.ts\0?? notes/new file.txt\0")
  assert.deepEqual(parsed.map((entry) => [entry.state, entry.path, entry.sourcePath ?? null]), [
    ["untracked", "notes/new file.txt", null],
    ["renamed", "src/new name.ts", "src/old name.ts"],
  ])
})

test("K3-R2 preserves mixed XY status without collapsing it", () => {
  const [change] = parseGitStatusPorcelainV1Z("MM src/a.ts\0")
  assert.equal(change.state, "modified")
  assert.equal(change.indexStatus, "M")
  assert.equal(change.worktreeStatus, "M")
})

test("K3-R2 canonical ordering is locale-independent across mixed-case and non-ASCII source order", async () => {
  const entries = [
    { path: "zeta.ts", type: "file" as const },
    { path: "Álpha.ts", type: "file" as const },
    { path: "Beta.ts", type: "file" as const },
    { path: "alpha.ts", type: "file" as const },
  ]
  const statusA = "?? zeta.ts\0?? Álpha.ts\0?? Beta.ts\0?? alpha.ts\0"
  const statusB = "?? alpha.ts\0?? Beta.ts\0?? Álpha.ts\0?? zeta.ts\0"
  const first = await captureRepositorySnapshot(
    fakeFs("/fixture", entries),
    fakeSource(["a".repeat(40)], [statusA]),
  )
  const second = await captureRepositorySnapshot(
    fakeFs("/fixture", [...entries].reverse()),
    fakeSource(["a".repeat(40)], [statusB]),
  )
  const expectedPaths = ["Beta.ts", "alpha.ts", "zeta.ts", "Álpha.ts"]
  assert.deepEqual(first.inventory.map((entry) => entry.path), expectedPaths)
  assert.deepEqual(second.inventory.map((entry) => entry.path), expectedPaths)
  assert.deepEqual(first.workingTree.map((entry) => entry.path), expectedPaths)
  assert.deepEqual(second.workingTree.map((entry) => entry.path), expectedPaths)
  assert.equal(first.contentIdentity.value, second.contentIdentity.value)
  assert.deepEqual(first.evidence.map((entry) => entry.evidenceId), second.evidence.map((entry) => entry.evidenceId))
})

test("K3-R2 filesystem ordering is code-unit deterministic before bounded snapshot truncation", async () => {
  const names = ["zeta.ts", "Álpha.ts", "Beta.ts", "alpha.ts"]
  const expectedAll = ["Beta.ts", "alpha.ts", "zeta.ts", "Álpha.ts"]
  const expectedRetained = expectedAll.slice(0, 2)
  const rootA = await mkdtemp(join(tmpdir(), "kodac-k3-r2-order-a-"))
  const rootB = await mkdtemp(join(tmpdir(), "kodac-k3-r2-order-b-"))
  try {
    await createFilesInOrder(rootA, names)
    await createFilesInOrder(rootB, [...names].reverse())
    const fsA = new NodeWorkspaceFileSystem(rootA)
    const fsB = new NodeWorkspaceFileSystem(rootB)
    assert.deepEqual(
      (await fsA.list(".", { recursive: false, maxEntries: 10, maxDepth: 1 })).map((entry) => entry.path),
      expectedAll,
    )
    assert.deepEqual(
      (await fsB.list(".", { recursive: false, maxEntries: 10, maxDepth: 1 })).map((entry) => entry.path),
      expectedAll,
    )

    const first = await captureRepositorySnapshot(
      fsA,
      fakeSource(["a".repeat(40)], [""]),
      { maxEntries: 2, maxDepth: 1 },
    )
    const second = await captureRepositorySnapshot(
      fsB,
      fakeSource(["a".repeat(40)], [""]),
      { maxEntries: 2, maxDepth: 1 },
    )
    assert.deepEqual(first.inventory.map((entry) => entry.path), expectedRetained)
    assert.deepEqual(second.inventory.map((entry) => entry.path), expectedRetained)
    assert.equal(first.contentIdentity.value, second.contentIdentity.value)
    assert.equal(first.completeness.state, "truncated")
    assert.equal(second.completeness.state, "truncated")
    assert.ok(first.completeness.reasons.includes("max-entries"))
    assert.ok(second.completeness.reasons.includes("max-entries"))
  } finally {
    await rm(rootA, { recursive: true, force: true })
    await rm(rootB, { recursive: true, force: true })
  }
})

test("K3-R2 inventory over the entry limit reports explicit truncation", async () => {
  const fs = fakeFs("/fixture", [
    { path: "a.txt", type: "file" },
    { path: "b.txt", type: "file" },
  ])
  const snapshot = await captureRepositorySnapshot(fs, fakeSource(["a".repeat(40)], [""]), { maxEntries: 1 })
  assert.equal(snapshot.completeness.state, "truncated")
  assert.ok(snapshot.completeness.reasons.includes("max-entries"))
  assert.ok(snapshot.completeness.omittedAtLeast >= 1)
})

test("K3-R2 pre/post Git mismatch marks freshness stale without retrying", async () => {
  const snapshot = await captureRepositorySnapshot(
    fakeFs("/fixture", []),
    fakeSource(["a".repeat(40), "c".repeat(40)], ["", ""]),
  )
  assert.equal(snapshot.freshness, "stale")
})

test("K3-R2 snapshot capture leaves the Git working tree unchanged", async () => {
  const root = await initRepository()
  try {
    const before = git(root, ["status", "--porcelain=v1", "-z", "--untracked-files=all"])
    await realSnapshot(root)
    const after = git(root, ["status", "--porcelain=v1", "-z", "--untracked-files=all"])
    assert.equal(after, before)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test("K3-R2 symlink inventory is not content-hashed and is explicitly partial", async () => {
  let hashCalls = 0
  const source = fakeSource(["a".repeat(40)], [""])
  const guardedSource: GitSnapshotSource = {
    ...source,
    async hashObjects(paths) {
      hashCalls++
      return source.hashObjects(paths)
    },
  }
  const snapshot = await captureRepositorySnapshot(fakeFs("/fixture", [{ path: "link", type: "symlink" }]), guardedSource)
  assert.equal(hashCalls, 0)
  assert.equal(snapshot.inventory[0]?.type, "symlink")
  assert.equal(snapshot.inventory[0]?.gitObjectId, undefined)
  assert.equal(snapshot.completeness.state, "partial")
  assert.ok(snapshot.completeness.reasons.includes("symlink-content-not-hashed"))
})

test("K3-R2 git.hash-object rejects workspace path escape", async () => {
  const root = await initRepository()
  try {
    const gateway = new ExecutionGateway(new NodeWorkspaceFileSystem(root), repositoryIntelligenceReadPolicy())
    await assert.rejects(() => gateway.gitHashObjects(["../outside.txt"]))
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test("K3-R2 generic ExecutionGateway.runCommand cannot spoof reserved git or repo capabilities", async () => {
  const root = await initRepository()
  try {
    const gateway = new ExecutionGateway(new NodeWorkspaceFileSystem(root), repositoryIntelligenceReadPolicy())
    await assert.rejects(() => gateway.runCommand("git.head", process.execPath, ["-e", "process.exit(0)"]), /reserved capability/)
    await assert.rejects(() => gateway.runCommand("repo.fake", process.execPath, ["-e", "process.exit(0)"]), /reserved capability/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test("K3-R2 malformed git.head output persists failure only", async () => {
  const gateway = new ExecutionGateway(fakeFs("/fixture", []), repositoryIntelligenceReadPolicy())
  assert.equal(Object.prototype.hasOwnProperty.call(gateway, "processRunner"), false)
  const statuses: string[] = []
  await withGitProcessOutput("not-a-git-object\n", "", async () => {
    await assert.rejects(
      () => gateway.gitHead(receiptRecorder(statuses)),
      /did not return a full object id/,
    )
  })
  assert.deepEqual(statuses, ["failure"])
})

test("K3-R2 malformed or mismatched git.hash-object output persists failure only", async () => {
  for (const stdout of ["", "not-an-object\n"]) {
    const gateway = new ExecutionGateway(
      fakeFs("/fixture", [{ path: "a.txt", type: "file" }]),
      repositoryIntelligenceReadPolicy(),
    )
    const statuses: string[] = []
    await withGitProcessOutput(stdout, "", async () => {
      await assert.rejects(
        () => gateway.gitHashObjects(["a.txt"], receiptRecorder(statuses)),
        /git hash-object/,
      )
    })
    assert.deepEqual(statuses, ["failure"])
  }
})

test("K3-R2 valid git.head and git.hash-object persist success receipts", async () => {
  const headGateway = new ExecutionGateway(fakeFs("/fixture", []), repositoryIntelligenceReadPolicy())
  const headObjectId = "a".repeat(40)
  const headStatuses: string[] = []
  await withGitProcessOutput(`${headObjectId}\n`, "", async () => {
    const headResult = await headGateway.gitHead(receiptRecorder(headStatuses))
    assert.equal(headResult.head, headObjectId)
    assert.equal(headResult.receipt.result.status, "success")
  })
  assert.deepEqual(headStatuses, ["success"])

  const hashGateway = new ExecutionGateway(
    fakeFs("/fixture", [{ path: "a.txt", type: "file" }]),
    repositoryIntelligenceReadPolicy(),
  )
  const fileObjectId = "b".repeat(40)
  const hashStatuses: string[] = []
  await withGitProcessOutput(`${fileObjectId}\n`, "", async () => {
    const hashResult = await hashGateway.gitHashObjects(["a.txt"], receiptRecorder(hashStatuses))
    assert.deepEqual(hashResult.objects, [{ path: "a.txt", gitObjectId: fileObjectId }])
    assert.equal(hashResult.receipt.result.status, "success")
  })
  assert.deepEqual(hashStatuses, ["success"])
})

test("K3-R2 dedicated git.hash-object preserves path order and object identities", async () => {
  const root = await initRepository({ "a.txt": "a\n", "b.txt": "b\n" })
  try {
    const gateway = new ExecutionGateway(new NodeWorkspaceFileSystem(root), repositoryIntelligenceReadPolicy())
    const result = await gateway.gitHashObjects(["b.txt", "a.txt"])
    assert.deepEqual(result.objects.map((item) => item.path), ["b.txt", "a.txt"])
    assert.ok(result.objects.every((item) => /^[0-9a-f]+$/.test(item.gitObjectId)))
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test("K3-R2 never emits model-hypothesis evidence", async () => {
  const snapshot = await captureRepositorySnapshot(
    fakeFs("/fixture", [{ path: "src/a.ts", type: "file" }]),
    fakeSource(["a".repeat(40)], [" M src/a.ts\0"]),
  )
  assert.ok(snapshot.evidence.every((item) => item.evidenceClass !== "model-hypothesis"))
  assert.ok(snapshot.evidence.every((item) => item.evidenceClass !== "parser-derived" && item.evidenceClass !== "precise-static"))
})

test("K3-R2 ADR and spec discovery is heuristic candidate evidence only", async () => {
  const snapshot = await captureRepositorySnapshot(
    fakeFs("/fixture", [
      { path: "docs/ADR-0002-example.md", type: "file" },
      { path: "specs/example.md", type: "file" },
    ]),
    fakeSource(["a".repeat(40)], [""]),
  )
  const candidates = snapshot.evidence.filter((item) => item.claim.kind === "architecture-candidate")
  assert.equal(candidates.length, 2)
  assert.ok(candidates.every((item) => item.evidenceClass === "heuristic-inference" && item.claim.value === "candidate"))
})

test("K3-R2 RepositoryContentIdentity excludes workspace-local root identity", async () => {
  const sourceA = fakeSource(["a".repeat(40)], [""])
  const sourceB = fakeSource(["a".repeat(40)], [""])
  const one = await captureRepositorySnapshot(fakeFs("/one", []), sourceA)
  const two = await captureRepositorySnapshot(fakeFs("/two", []), sourceB)
  assert.equal(one.contentIdentity.value, two.contentIdentity.value)
  assert.notEqual(one.repositoryIdentity.value, two.repositoryIdentity.value)
  assert.notEqual(one.snapshotIdentity.value, two.snapshotIdentity.value)
})

test("K3-R2 repository-intelligence policy allows only dedicated read-only Git capabilities", async () => {
  const policy = repositoryIntelligenceReadPolicy()
  for (const capability of ["git.head", "git.status", "git.hash-object"]) {
    assert.equal((await policy.evaluate({ capability, paths: [], inputDigest: "0" })).decision, "allow")
  }
  for (const capability of ["repo.apply_patch", "verification.command.tests", "git.diff", "repo.read"]) {
    assert.equal((await policy.evaluate({ capability, paths: [], inputDigest: "0" })).decision, "deny")
  }
})

test("K3-R2 keeps the canonical K3-R1 manifest repository-content identity unchanged across checkout line endings", async () => {
  const text = await readFile(goldManifestPath, "utf8")
  const canonicalLfText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  const bytes = Buffer.from(canonicalLfText, "utf8")
  assert.equal(gitBlobSha1(bytes), "6f812003a4b33e62ad1be672a39c7f42509fc500")
})
