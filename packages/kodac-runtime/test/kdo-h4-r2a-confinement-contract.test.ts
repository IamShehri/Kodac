import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import test from "node:test"

import {
  CONFINEMENT_ENFORCEMENT_RESULTS,
  CONFINEMENT_MODES,
  KDO_H4_R2A_CONFINEMENT_VERSION,
  KDO_H4_R2A_ENFORCEMENT_EVIDENCE_VERSION,
  createConfinementBackendDescriptor,
  createConfinementEnforcementEvidence,
  createConfinementRequest,
  validateConfinementBackendDescriptor,
  validateConfinementEnforcementEvidence,
  validateConfinementRequest,
} from "../src/trust/confinement.ts"

const ID_A = "a".repeat(64)
const ID_B = "b".repeat(64)
const ID_C = "c".repeat(64)

const source = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf8")

function gitBlobSha1(text: string): string {
  const canonical = text.replace(/\r\n/g, "\n")
  const body = Buffer.from(canonical, "utf8")
  return createHash("sha1").update(`blob ${body.byteLength}\0`).update(body).digest("hex")
}

function request() {
  return createConfinementRequest({
    mode: "workspace-write",
    workspaceIdentity: ID_A,
    executionIntentIdentity: ID_B,
    scope: { readPaths: ["docs/readme.md"], writePaths: ["src/main.ts"] },
  })
}

function backend() {
  return createConfinementBackendDescriptor({
    name: "fixture-confinement",
    revision: "fixture-v1",
    platform: "linux",
    supportedModes: ["read-only", "workspace-write"],
  })
}

test("H4-R2A vocabularies are closed and requested policy remains separate from observed enforcement", () => {
  assert.equal(KDO_H4_R2A_CONFINEMENT_VERSION, "kodac-h4-r2a-confinement-v1")
  assert.equal(KDO_H4_R2A_ENFORCEMENT_EVIDENCE_VERSION, "kodac-h4-r2a-enforcement-evidence-v1")
  assert.deepEqual(CONFINEMENT_MODES, ["read-only", "workspace-write", "danger-full-access"])
  assert.deepEqual(CONFINEMENT_ENFORCEMENT_RESULTS, ["full", "partial", "unavailable"])
})

test("request identity is deterministic and binds mode workspace intent and scope", () => {
  const first = request()
  const second = request()
  assert.equal(first.requestIdentity, second.requestIdentity)
  assert.notEqual(first.requestIdentity, createConfinementRequest({
    mode: "read-only",
    workspaceIdentity: first.workspaceIdentity,
    executionIntentIdentity: first.executionIntentIdentity,
    scope: first.scope,
  }).requestIdentity)
  assert.notEqual(first.requestIdentity, createConfinementRequest({
    mode: first.mode,
    workspaceIdentity: ID_C,
    executionIntentIdentity: first.executionIntentIdentity,
    scope: first.scope,
  }).requestIdentity)
  assert.notEqual(first.requestIdentity, createConfinementRequest({
    mode: first.mode,
    workspaceIdentity: first.workspaceIdentity,
    executionIntentIdentity: ID_C,
    scope: first.scope,
  }).requestIdentity)
  assert.notEqual(first.requestIdentity, createConfinementRequest({
    mode: first.mode,
    workspaceIdentity: first.workspaceIdentity,
    executionIntentIdentity: first.executionIntentIdentity,
    scope: { readPaths: ["docs/readme.md"], writePaths: ["src/other.ts"] },
  }).requestIdentity)
})

test("request scope is strict canonical bounded and immutable", () => {
  const readPaths = ["docs/readme.md"]
  const writePaths = ["src/main.ts"]
  const value = createConfinementRequest({
    mode: "workspace-write",
    workspaceIdentity: ID_A,
    executionIntentIdentity: ID_B,
    scope: { readPaths, writePaths },
  })
  readPaths[0] = "mutated"
  writePaths[0] = "mutated"
  assert.deepEqual(value.scope.readPaths, ["docs/readme.md"])
  assert.deepEqual(value.scope.writePaths, ["src/main.ts"])
  assert.equal(Object.isFrozen(value), true)
  assert.equal(Object.isFrozen(value.scope), true)
  assert.equal(Object.isFrozen(value.scope.readPaths), true)
  assert.throws(() => createConfinementRequest({ mode: "read-only", workspaceIdentity: ID_A, executionIntentIdentity: ID_B, scope: { readPaths: ["b", "a"], writePaths: [] } }))
  assert.throws(() => createConfinementRequest({ mode: "read-only", workspaceIdentity: ID_A, executionIntentIdentity: ID_B, scope: { readPaths: ["a", "a"], writePaths: [] } }))
  assert.throws(() => createConfinementRequest({ mode: "read-only", workspaceIdentity: ID_A, executionIntentIdentity: ID_B, scope: { readPaths: ["../escape"], writePaths: [] } }))
  assert.throws(() => createConfinementRequest({ mode: "workspace-write", workspaceIdentity: ID_A, executionIntentIdentity: ID_B, scope: { readPaths: ["same"], writePaths: ["same"] } }))
})

test("unknown fields enums malformed identities and non-plain inputs fail closed", () => {
  assert.throws(() => createConfinementRequest({ mode: "unknown" as never, workspaceIdentity: ID_A, executionIntentIdentity: ID_B, scope: { readPaths: [], writePaths: [] } }))
  assert.throws(() => createConfinementRequest({ mode: "read-only", workspaceIdentity: "bad", executionIntentIdentity: ID_B, scope: { readPaths: [], writePaths: [] } }))
  assert.throws(() => createConfinementRequest({ mode: "read-only", workspaceIdentity: ID_A, executionIntentIdentity: ID_B, scope: new Map() as never }))
  assert.throws(() => validateConfinementRequest({ ...request(), extra: true }))
  assert.throws(() => validateConfinementRequest({ ...request(), requestIdentity: ID_C }))
})

test("sparse accessor symbol hidden and proxy structural hooks fail closed without executing traps", () => {
  let getterCalls = 0
  const accessorScope: Record<string, unknown> = { writePaths: [] }
  Object.defineProperty(accessorScope, "readPaths", {
    enumerable: true,
    get() {
      getterCalls += 1
      return ["docs/readme.md"]
    },
  })
  assert.throws(() => createConfinementRequest({ mode: "read-only", workspaceIdentity: ID_A, executionIntentIdentity: ID_B, scope: accessorScope as never }))
  assert.equal(getterCalls, 0)

  const accessorArray = ["docs/readme.md"]
  Object.defineProperty(accessorArray, "0", {
    enumerable: true,
    configurable: true,
    get() {
      getterCalls += 1
      return "docs/readme.md"
    },
  })
  assert.throws(() => createConfinementRequest({ mode: "read-only", workspaceIdentity: ID_A, executionIntentIdentity: ID_B, scope: { readPaths: accessorArray, writePaths: [] } }))
  assert.equal(getterCalls, 0)

  const sparse = new Array<string>(1)
  assert.throws(() => createConfinementRequest({ mode: "read-only", workspaceIdentity: ID_A, executionIntentIdentity: ID_B, scope: { readPaths: sparse, writePaths: [] } }))

  const hiddenScope: Record<string, unknown> = { readPaths: [], writePaths: [] }
  Object.defineProperty(hiddenScope, "hidden", { value: true, enumerable: false })
  assert.throws(() => createConfinementRequest({ mode: "read-only", workspaceIdentity: ID_A, executionIntentIdentity: ID_B, scope: hiddenScope as never }))

  const symbolScope: Record<string, unknown> = { readPaths: [], writePaths: [] }
  Object.defineProperty(symbolScope, Symbol("hidden"), { value: true, enumerable: true })
  assert.throws(() => createConfinementRequest({ mode: "read-only", workspaceIdentity: ID_A, executionIntentIdentity: ID_B, scope: symbolScope as never }))

  let proxyTrapCalls = 0
  const proxyScope = new Proxy({ readPaths: [], writePaths: [] }, {
    getPrototypeOf() {
      proxyTrapCalls += 1
      return Object.prototype
    },
    ownKeys(target) {
      proxyTrapCalls += 1
      return Reflect.ownKeys(target)
    },
  })
  assert.throws(() => createConfinementRequest({ mode: "read-only", workspaceIdentity: ID_A, executionIntentIdentity: ID_B, scope: proxyScope }))
  assert.equal(proxyTrapCalls, 0)

  const proxyPaths = new Proxy(["docs/readme.md"], {
    getPrototypeOf() {
      proxyTrapCalls += 1
      return Array.prototype
    },
    ownKeys(target) {
      proxyTrapCalls += 1
      return Reflect.ownKeys(target)
    },
  })
  assert.throws(() => createConfinementRequest({ mode: "read-only", workspaceIdentity: ID_A, executionIntentIdentity: ID_B, scope: { readPaths: proxyPaths, writePaths: [] } }))
  assert.equal(proxyTrapCalls, 0)
})

test("backend descriptors are inert deterministic immutable structural data", () => {
  const first = backend()
  const second = backend()
  assert.equal(first.backendIdentity, second.backendIdentity)
  assert.equal(Object.isFrozen(first), true)
  assert.equal(Object.isFrozen(first.supportedModes), true)
  assert.deepEqual(validateConfinementBackendDescriptor(JSON.parse(JSON.stringify(first))), first)
  assert.throws(() => createConfinementBackendDescriptor({ name: "x", revision: "r", platform: "linux", supportedModes: ["workspace-write", "read-only"] }))
  assert.throws(() => createConfinementBackendDescriptor({ name: "x", revision: "r", platform: "linux", supportedModes: ["read-only", "read-only"] }))
})

test("enforcement evidence binds request attempt and backend while preserving partial and unavailable", () => {
  const confinementRequest = request()
  const descriptor = backend()
  const full = createConfinementEnforcementEvidence({ request: confinementRequest, executionAttemptIdentity: ID_C, backend: descriptor, enforcement: "full", reason: "fixture full" })
  const partial = createConfinementEnforcementEvidence({ request: confinementRequest, executionAttemptIdentity: ID_C, backend: descriptor, enforcement: "partial", reason: "fixture partial" })
  const unavailable = createConfinementEnforcementEvidence({ request: confinementRequest, executionAttemptIdentity: ID_C, backend: descriptor, enforcement: "unavailable", reason: "fixture unavailable" })
  assert.notEqual(full.evidenceIdentity, partial.evidenceIdentity)
  assert.notEqual(partial.evidenceIdentity, unavailable.evidenceIdentity)
  assert.equal(partial.enforcement, "partial")
  assert.equal(unavailable.enforcement, "unavailable")
  assert.equal(Object.isFrozen(full), true)
  assert.equal(Object.isFrozen(full.backend), true)
  assert.deepEqual(validateConfinementEnforcementEvidence(JSON.parse(JSON.stringify(full))), full)
  assert.throws(() => validateConfinementEnforcementEvidence({ ...full, requestIdentity: ID_A }))
})

test("all explicit H4-R2A item and UTF-8 byte bounds fail closed without truncation", () => {
  const tooManyPaths = Array.from({ length: 257 }, (_, index) => `scope/${String(index).padStart(3, "0")}`)
  assert.throws(() => createConfinementRequest({
    mode: "read-only",
    workspaceIdentity: ID_A,
    executionIntentIdentity: ID_B,
    scope: { readPaths: tooManyPaths, writePaths: [] },
  }), /256 entries/)

  const oversizedPath = `scope/${"é".repeat(510)}`
  assert.ok(Buffer.byteLength(oversizedPath, "utf8") > 1024)
  assert.throws(() => createConfinementRequest({
    mode: "read-only",
    workspaceIdentity: ID_A,
    executionIntentIdentity: ID_B,
    scope: { readPaths: [oversizedPath], writePaths: [] },
  }), /1024 UTF-8 bytes/)

  assert.throws(() => createConfinementBackendDescriptor({
    name: "é".repeat(81),
    revision: "fixture-v1",
    platform: "linux",
    supportedModes: ["read-only"],
  }), /160 UTF-8 bytes/)
  assert.throws(() => createConfinementBackendDescriptor({
    name: "fixture",
    revision: "é".repeat(129),
    platform: "linux",
    supportedModes: ["read-only"],
  }), /256 UTF-8 bytes/)

  assert.throws(() => createConfinementEnforcementEvidence({
    request: request(),
    executionAttemptIdentity: ID_C,
    backend: backend(),
    enforcement: "partial",
    reason: "é".repeat(2049),
  }), /4096 UTF-8 bytes/)
})

test("published schema mirrors strict structural contract without pretending runtime UTF-8 byte limits are maxLength", () => {
  const schema = JSON.parse(source("../../../schema/kdo-h4-r2a-confinement.schema.json")) as Record<string, unknown>
  const text = JSON.stringify(schema)
  assert.match(text, /kodac-h4-r2a-confinement-v1/)
  assert.match(text, /kodac-h4-r2a-enforcement-evidence-v1/)
  assert.match(text, /additionalProperties/)
  assert.doesNotMatch(text, /maxLength/)
})

test("H4-R2A production module is pure and protected authority surfaces remain byte-identical", () => {
  const confinementSource = source("../src/trust/confinement.ts")
  assert.match(confinementSource, /from "node:crypto"/)
  assert.match(confinementSource, /from "node:util"/)
  assert.doesNotMatch(confinementSource, /child_process|execFile|spawn\(|fetch\(|http|https|readFile|writeFile|appendFile|process\.env|Deno|Bun/)

  assert.equal(gitBlobSha1(source("../src/execution/gateway.ts")), "8b481c226276d0b06fabc8d614c1295cd0881a6a")
  assert.equal(gitBlobSha1(source("../src/trust/policy.ts")), "b4134e430204123bebe053ffc9105f05fca611c9")
  assert.equal(gitBlobSha1(source("../src/trust/approval.ts")), "d36a604cb1957bc65dac3978c626ba48a9b299fb")
  assert.equal(gitBlobSha1(source("../src/evidence/receipt.ts")), "bc11267496f8c8a2ca1dac713baccf88ec962b19")
})
