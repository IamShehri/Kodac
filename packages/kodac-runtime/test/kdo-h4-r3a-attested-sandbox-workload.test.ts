import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import test from "node:test"

import {
  KDO_H4_R3A_ATTESTATION_KIND,
  KDO_H4_R3A_ATTESTATION_REFERENCE_VERSION,
  KDO_H4_R3A_ENTRYPOINT_VERSION,
  KDO_H4_R3A_LIMITS,
  KDO_H4_R3A_NETWORK_MODE,
  KDO_H4_R3A_NETWORK_POLICY_VERSION,
  KDO_H4_R3A_OCI_SOURCE_VERSION,
  KDO_H4_R3A_OPENSANDBOX_DONOR_PROVENANCE,
  KDO_H4_R3A_RESOURCE_POLICY_VERSION,
  KDO_H4_R3A_WORKLOAD_VERSION,
  createSandboxEntrypoint,
  createSandboxNetworkPolicy,
  createSandboxOciImageSource,
  createSandboxResourcePolicy,
  createSandboxWorkloadAttestationReference,
  createSandboxWorkloadRequest,
  validateSandboxEntrypoint,
  validateSandboxNetworkPolicy,
  validateSandboxOciImageSource,
  validateSandboxResourcePolicy,
  validateSandboxWorkloadAttestationReference,
  validateSandboxWorkloadAttestationReferenceForWorkload,
  validateSandboxWorkloadRequest,
} from "../src/trust/sandbox-workload.ts"
import { createConfinementRequest } from "../src/trust/confinement.ts"

const source = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf8")

function gitBlobSha1(text: string): string {
  const canonical = text.replace(/\r\n/g, "\n")
  const body = Buffer.from(canonical, "utf8")
  return createHash("sha1").update(`blob ${body.byteLength}\0`).update(body).digest("hex")
}

const FIXTURE_DIGEST = `sha256:${"1".repeat(64)}`
const OTHER_DIGEST = `sha256:${"3".repeat(64)}`
const ATTESTATION_DIGEST = `sha256:${"2".repeat(64)}`
const WORKSPACE_IDENTITY = "a".repeat(64)
const EXECUTION_INTENT_IDENTITY = "b".repeat(64)

function fixtureConfinement(input: { workspace?: string; intent?: string } = {}) {
  return createConfinementRequest({
    mode: "read-only",
    workspaceIdentity: input.workspace ?? WORKSPACE_IDENTITY,
    executionIntentIdentity: input.intent ?? EXECUTION_INTENT_IDENTITY,
    scope: { readPaths: ["src"], writePaths: [] },
  })
}

function fixtureParts(input: { digest?: string; repository?: string } = {}) {
  const sourceValue = createSandboxOciImageSource({
    repository: input.repository ?? "ghcr.io/acme/kodac-fixture",
    digest: input.digest ?? FIXTURE_DIGEST,
  })
  const entrypoint = createSandboxEntrypoint({ executable: "/usr/bin/node", args: ["--version", "é"] })
  const resourcePolicy = createSandboxResourcePolicy({
    cpuMillis: 1000,
    memoryBytes: 536870912,
    ttlMs: 60000,
    maxOutputBytes: 1048576,
  })
  const networkPolicy = createSandboxNetworkPolicy({ mode: "deny-all" })
  const confinement = fixtureConfinement()
  const workload = createSandboxWorkloadRequest({
    source: sourceValue,
    entrypoint,
    resourcePolicy,
    networkPolicy,
    confinement,
    credentialBindingIdentity: null,
  })
  return { sourceValue, entrypoint, resourcePolicy, networkPolicy, confinement, workload }
}

test("H4-R3A predecessor donor versions limits and protected authority baseline are exact", () => {
  assert.deepEqual(KDO_H4_R3A_OPENSANDBOX_DONOR_PROVENANCE, {
    repository: "opensandbox-group/OpenSandbox",
    sourceCommit: "f8ed8734ce1fda69f0979f912160fb933b9bfa0c",
    sourceTree: "cf033b4f880b7e84b563dcf7f63722582ea48762",
    license: "Apache-2.0",
    licenseBlob: "b09cd7856d58590578ee1a4f3ad45d1310a97f87",
    intakeMode: "STUDY_REIMPLEMENT",
    sources: [
      { path: "specs/sandbox-lifecycle.yml", blob: "8564db4f8ef50434348b27cefe49bf2d11a9a323" },
      { path: "docs/community/release-verification.md", blob: "13eaae323a8d196eb83b6f2b28a7cde863f7e31d" },
      { path: "oseps/0004-secure-container-runtime.md", blob: "65d1ec76530b01c7f530a582ba1bbc7deb5c8b35" },
      { path: "specs/egress-api.yaml", blob: "08e4885176998e854df62b999914c5eb01855308" },
      { path: "docs/guides/credential-vault.md", blob: "435b18ed410018b4fc39d7c00933dd67290b6959" },
    ],
  })
  assert.equal(KDO_H4_R3A_OCI_SOURCE_VERSION, "kodac-h4-r3a-oci-image-source-v1")
  assert.equal(KDO_H4_R3A_ENTRYPOINT_VERSION, "kodac-h4-r3a-entrypoint-v1")
  assert.equal(KDO_H4_R3A_RESOURCE_POLICY_VERSION, "kodac-h4-r3a-resource-policy-v1")
  assert.equal(KDO_H4_R3A_NETWORK_POLICY_VERSION, "kodac-h4-r3a-network-policy-v1")
  assert.equal(KDO_H4_R3A_WORKLOAD_VERSION, "kodac-h4-r3a-sandbox-workload-v1")
  assert.equal(KDO_H4_R3A_ATTESTATION_REFERENCE_VERSION, "kodac-h4-r3a-workload-attestation-ref-v1")
  assert.equal(KDO_H4_R3A_NETWORK_MODE, "deny-all")
  assert.equal(KDO_H4_R3A_ATTESTATION_KIND, "sigstore-bundle")
  assert.deepEqual(KDO_H4_R3A_LIMITS, {
    maxRepositoryBytes: 512,
    maxExecutableBytes: 4096,
    maxArgs: 256,
    maxArgBytes: 8192,
    maxArgsBytes: 65536,
    maxCpuMillis: 256000,
    maxMemoryBytes: 1099511627776,
    maxTtlMs: 86400000,
    maxOutputBytes: 16777216,
    maxIssuerBytes: 2048,
    maxProducerIdentityBytes: 2048,
  })

  assert.equal(
    gitBlobSha1(source("../../../docs/planning/KODAC_KDO_H4_R3A_ATTESTED_SANDBOX_WORKLOAD_IDENTITY_AUTHORIZATION_2026-08-15.md")),
    "12b7454068ed82f135c37f05ba6b166674032fca",
  )
  assert.equal(
    gitBlobSha1(source("../../../docs/planning/KODAC_KDO_H4_READINESS_OPENSANDBOX_DONOR_DIFFERENTIAL_AUDIT_2026-08-15.md")),
    "00fbcb55b66de686734a7a8dff27c953a73ce0f1",
  )

  const protectedBlobs: Record<string, string> = {
    "../src/trust/approval.ts": "d36a604cb1957bc65dac3978c626ba48a9b299fb",
    "../src/trust/confinement.ts": "873f235120645c0a12f10a5bff7e9591db6bb341",
    "../src/trust/confinement-linux-landlock.ts": "94b325f73246514f31b950ba4fed38023e3e3cfc",
    "../src/trust/confinement-runtime.ts": "1ca0313fb25c62e549445ebcf1aef029b18e6b86",
    "../src/execution/gateway.ts": "8de6063a929381d0c889a0638507a41f5fbdc645",
    "../src/evidence/receipt.ts": "214403398751c9d22bf695786c7fd7c6fd7e35e1",
    "../src/verification/done-gate.ts": "067e147569fa52cc2b04c5df26fbe20a01e958e9",
    "../src/agent/loop.ts": "576ad425db7e845b9705c982e95dd4f7522f8c43",
    "../package.json": "af4c20a3dae387c15cc5fb2eb28d415c8f115b95",
    "../scripts/run-tests.mjs": "9a0bcde0e565168c78eb7fe4d3cf08236d24baa7",
    "../THIRD_PARTY_NOTICES.md": "aaa1ce56d27f5b7dd185f9aaa257d978c2a56c76",
  }
  for (const [path, expected] of Object.entries(protectedBlobs)) {
    assert.equal(gitBlobSha1(source(path)), expected, `${path} must remain byte-identical`)
  }
})

test("H4-R3A fixed structural identity vectors including confinement lineage are exact", () => {
  const { sourceValue, entrypoint, resourcePolicy, networkPolicy, confinement, workload } = fixtureParts()
  assert.equal(confinement.requestIdentity, "a22b2611b230d184748ab77f59155127a5e7a6c6bfe469df6cb3cbffc7351ee5")
  assert.equal(sourceValue.sourceIdentity, "89b8758e4ac8a073c06768ffc6e4aae994cbf4607db33c92ee993a4f1fa23a86")
  assert.equal(entrypoint.entrypointIdentity, "e3b75ab65d9efc9d41bc16f71cb22a0b7936edb749d46af1697700c34ed0f844")
  assert.equal(resourcePolicy.resourcePolicyIdentity, "cf0077cf2277c1800a5bb08f1780abb2504255fa7b58eec369cc2a27811fb510")
  assert.equal(networkPolicy.networkPolicyIdentity, "c17924ecbb8bfaa005dd6c8b0b321adf7f606b19b39672de51ac5b53c14ad3d6")
  assert.equal(workload.workloadIdentity, "7e148da8275b34e873bd6fdd33cc5d4977c6577a4f3631ca988c3b9c227801c3")
  assert.equal(workload.executionIntentIdentity, EXECUTION_INTENT_IDENTITY)
  assert.equal(workload.workspaceIdentity, WORKSPACE_IDENTITY)
  assert.equal(workload.confinementRequestIdentity, confinement.requestIdentity)
  assert.deepEqual(workload.confinement, confinement)
  assert.equal(workload.credentialBindingIdentity, null)

  const attestation = createSandboxWorkloadAttestationReference({
    workload,
    subjectDigest: FIXTURE_DIGEST,
    attestationKind: "sigstore-bundle",
    attestationDigest: ATTESTATION_DIGEST,
    issuer: "https://token.actions.githubusercontent.com",
    producerIdentity: "github.com/acme/repo/.github/workflows/release.yml@refs/tags/v1",
  })
  assert.equal(attestation.attestationReferenceIdentity, "eccbe2d5e53053874d4e7d492d92e0f883388f56f5db0ef139af4e707309b9c6")
})

test("H4-R3A OCI source accepts only digest-bound canonical tag-free repositories", () => {
  const accepted = createSandboxOciImageSource({ repository: "registry.example.com:5000/team/image", digest: FIXTURE_DIGEST })
  assert.deepEqual(validateSandboxOciImageSource(accepted), accepted)

  for (const digest of [
    "1".repeat(64),
    `sha256:${"A".repeat(64)}`,
    `sha512:${"1".repeat(64)}`,
    `sha256:${"1".repeat(63)}`,
    `sha256:${"1".repeat(65)}`,
  ]) assert.throws(() => createSandboxOciImageSource({ repository: "ghcr.io/acme/image", digest }))

  for (const repository of [
    "python",
    "https://ghcr.io/acme/image",
    "ghcr.io/acme/image:v1",
    `ghcr.io/acme/image@${FIXTURE_DIGEST}`,
    "ghcr.io/acme//image",
    "ghcr.io/acme/../image",
    "ghcr.io/Acme/image",
    "ghcr.io/acme/image?x=1",
    "ghcr.io/acme/image#frag",
    "ghcr.io/acme/my image",
  ]) assert.throws(() => createSandboxOciImageSource({ repository, digest: FIXTURE_DIGEST }), repository)

  assert.throws(() => createSandboxOciImageSource({ repository: `ghcr.io/${"a".repeat(505)}`, digest: FIXTURE_DIGEST }), /UTF-8 bytes/)
  assert.notEqual(fixtureParts({ digest: OTHER_DIGEST }).sourceValue.sourceIdentity, fixtureParts().sourceValue.sourceIdentity)
  assert.notEqual(fixtureParts({ repository: "ghcr.io/acme/other" }).sourceValue.sourceIdentity, fixtureParts().sourceValue.sourceIdentity)
})

test("H4-R3A entrypoint is absolute ordered detached and byte-bounded", () => {
  const inputArgs = ["alpha", "β", ""]
  const value = createSandboxEntrypoint({ executable: "/opt/app/bin/run", args: inputArgs })
  inputArgs[0] = "mutated"
  assert.deepEqual(value.args, ["alpha", "β", ""])
  assert.equal(Object.isFrozen(value), true)
  assert.equal(Object.isFrozen(value.args), true)
  assert.deepEqual(validateSandboxEntrypoint(value), value)

  for (const executable of ["bin/run", "/opt/app/../bin/run", "/opt//app/run", "/opt/app/"]) {
    assert.throws(() => createSandboxEntrypoint({ executable, args: [] }), /canonical POSIX path/)
  }
  assert.throws(() => createSandboxEntrypoint({ executable: "/x\u0000y", args: [] }), /NUL/)
  assert.throws(() => createSandboxEntrypoint({ executable: `/${"界".repeat(1400)}`, args: [] }), /UTF-8 bytes/)

  assert.doesNotThrow(() => createSandboxEntrypoint({ executable: "/bin/x", args: ["x".repeat(KDO_H4_R3A_LIMITS.maxArgBytes)] }))
  assert.throws(() => createSandboxEntrypoint({ executable: "/bin/x", args: ["x".repeat(KDO_H4_R3A_LIMITS.maxArgBytes + 1)] }), /UTF-8 bytes/)
  assert.doesNotThrow(() => createSandboxEntrypoint({ executable: "/bin/x", args: Array.from({ length: KDO_H4_R3A_LIMITS.maxArgs }, () => "") }))
  assert.throws(() => createSandboxEntrypoint({ executable: "/bin/x", args: Array.from({ length: KDO_H4_R3A_LIMITS.maxArgs + 1 }, () => "") }), /entries/)

  const exactAggregate = Array.from({ length: 8 }, () => "x".repeat(KDO_H4_R3A_LIMITS.maxArgBytes))
  assert.equal(exactAggregate.reduce((total, arg) => total + Buffer.byteLength(arg), 0), KDO_H4_R3A_LIMITS.maxArgsBytes)
  assert.doesNotThrow(() => createSandboxEntrypoint({ executable: "/bin/x", args: exactAggregate }))
  assert.throws(() => createSandboxEntrypoint({ executable: "/bin/x", args: [...exactAggregate, "x"] }), /aggregate UTF-8 bytes/)

  const sparse = new Array(1) as string[]
  assert.throws(() => createSandboxEntrypoint({ executable: "/bin/x", args: sparse }), /dense/)
  const extra = ["x"] as string[] & { extra?: boolean }
  extra.extra = true
  assert.throws(() => createSandboxEntrypoint({ executable: "/bin/x", args: extra }), /unexpected array field/)
})

test("H4-R3A resource bounds and deny-all network vocabulary fail closed", () => {
  const base = fixtureParts().resourcePolicy
  assert.deepEqual(validateSandboxResourcePolicy(base), base)
  const variants = [
    { field: "cpuMillis", max: KDO_H4_R3A_LIMITS.maxCpuMillis },
    { field: "memoryBytes", max: KDO_H4_R3A_LIMITS.maxMemoryBytes },
    { field: "ttlMs", max: KDO_H4_R3A_LIMITS.maxTtlMs },
    { field: "maxOutputBytes", max: KDO_H4_R3A_LIMITS.maxOutputBytes },
  ] as const
  for (const variant of variants) {
    const input: { cpuMillis: number; memoryBytes: number; ttlMs: number; maxOutputBytes: number } = {
      cpuMillis: 1, memoryBytes: 1, ttlMs: 1, maxOutputBytes: 1,
    }
    input[variant.field] = variant.max
    assert.doesNotThrow(() => createSandboxResourcePolicy(input))
    input[variant.field] = variant.max + 1
    assert.throws(() => createSandboxResourcePolicy(input), /integer from 1 through/)
  }
  assert.throws(() => createSandboxResourcePolicy({ cpuMillis: 0, memoryBytes: 1, ttlMs: 1, maxOutputBytes: 1 }))
  assert.throws(() => createSandboxResourcePolicy({ cpuMillis: 1.5, memoryBytes: 1, ttlMs: 1, maxOutputBytes: 1 }))
  assert.notEqual(createSandboxResourcePolicy({ cpuMillis: 1001, memoryBytes: 536870912, ttlMs: 60000, maxOutputBytes: 1048576 }).resourcePolicyIdentity, base.resourcePolicyIdentity)

  const network = createSandboxNetworkPolicy({ mode: "deny-all" })
  assert.deepEqual(validateSandboxNetworkPolicy(network), network)
  assert.throws(() => createSandboxNetworkPolicy({ mode: "allow-all" as never }), /deny-all/)
  assert.throws(() => createSandboxNetworkPolicy({ mode: "deny-all", rules: [] } as never), /exactly/)
})

test("H4-R3A workload self-contains canonical confinement lineage and every admitted authority change changes identity", () => {
  const { sourceValue, entrypoint, resourcePolicy, networkPolicy, confinement, workload } = fixtureParts()
  assert.deepEqual(validateSandboxWorkloadRequest(workload), workload)
  assert.equal(Object.isFrozen(workload), true)
  assert.equal(Object.isFrozen(workload.source), true)
  assert.equal(Object.isFrozen(workload.entrypoint.args), true)
  assert.equal(Object.isFrozen(workload.confinement), true)
  assert.equal(Object.isFrozen(workload.confinement.scope.readPaths), true)

  const create = (input: {
    sourceValue?: typeof sourceValue
    entrypoint?: typeof entrypoint
    resourcePolicy?: typeof resourcePolicy
    confinement?: typeof confinement
  } = {}) => createSandboxWorkloadRequest({
    source: input.sourceValue ?? sourceValue,
    entrypoint: input.entrypoint ?? entrypoint,
    resourcePolicy: input.resourcePolicy ?? resourcePolicy,
    networkPolicy,
    confinement: input.confinement ?? confinement,
    credentialBindingIdentity: null,
  })

  assert.notEqual(create({ sourceValue: fixtureParts({ digest: OTHER_DIGEST }).sourceValue }).workloadIdentity, workload.workloadIdentity)
  assert.notEqual(create({ sourceValue: fixtureParts({ repository: "ghcr.io/acme/other" }).sourceValue }).workloadIdentity, workload.workloadIdentity)
  assert.notEqual(create({ entrypoint: createSandboxEntrypoint({ executable: "/usr/bin/node2", args: entrypoint.args }) }).workloadIdentity, workload.workloadIdentity)
  assert.notEqual(create({ entrypoint: createSandboxEntrypoint({ executable: entrypoint.executable, args: ["é", "--version"] }) }).workloadIdentity, workload.workloadIdentity)
  assert.notEqual(create({ resourcePolicy: createSandboxResourcePolicy({ cpuMillis: 2000, memoryBytes: 536870912, ttlMs: 60000, maxOutputBytes: 1048576 }) }).workloadIdentity, workload.workloadIdentity)
  assert.notEqual(create({ confinement: fixtureConfinement({ intent: "c".repeat(64) }) }).workloadIdentity, workload.workloadIdentity)
  assert.notEqual(create({ confinement: fixtureConfinement({ workspace: "d".repeat(64) }) }).workloadIdentity, workload.workloadIdentity)

  assert.throws(() => createSandboxWorkloadRequest({
    source: sourceValue,
    entrypoint,
    resourcePolicy,
    networkPolicy,
    confinement,
    credentialBindingIdentity: "secret-handle" as never,
  }), /must be null/)

  const outerIntentTamper = JSON.parse(JSON.stringify(workload)) as Record<string, unknown>
  outerIntentTamper.executionIntentIdentity = "c".repeat(64)
  assert.throws(() => validateSandboxWorkloadRequest(outerIntentTamper), /executionIntentIdentity does not match confinement request/)

  const outerRequestTamper = JSON.parse(JSON.stringify(workload)) as Record<string, unknown>
  outerRequestTamper.confinementRequestIdentity = "0".repeat(64)
  assert.throws(() => validateSandboxWorkloadRequest(outerRequestTamper), /confinementRequestIdentity does not match confinement request/)

  const nestedTamper = JSON.parse(JSON.stringify(workload)) as Record<string, unknown>
  const nestedConfinement = nestedTamper.confinement as Record<string, unknown>
  const nestedScope = nestedConfinement.scope as Record<string, unknown>
  nestedScope.readPaths = ["other"]
  assert.throws(() => validateSandboxWorkloadRequest(nestedTamper), /confinement request identity mismatch/)

  const hashTamper = JSON.parse(JSON.stringify(workload)) as Record<string, unknown>
  hashTamper.workloadIdentity = "0".repeat(64)
  assert.throws(() => validateSandboxWorkloadRequest(hashTamper), /workload identity mismatch/)
})

test("H4-R3A attestation remains separate from workload content authority", () => {
  const { workload } = fixtureParts()
  const first = createSandboxWorkloadAttestationReference({
    workload,
    subjectDigest: workload.source.digest,
    attestationKind: "sigstore-bundle",
    attestationDigest: ATTESTATION_DIGEST,
    issuer: "https://token.actions.githubusercontent.com",
    producerIdentity: "github.com/acme/repo/.github/workflows/release.yml@refs/tags/v1",
  })
  const second = createSandboxWorkloadAttestationReference({
    workload,
    subjectDigest: workload.source.digest,
    attestationKind: "sigstore-bundle",
    attestationDigest: `sha256:${"4".repeat(64)}`,
    issuer: "https://token.actions.githubusercontent.com",
    producerIdentity: "github.com/acme/repo/.github/workflows/release.yml@refs/tags/v2",
  })
  assert.equal(first.workloadIdentity, workload.workloadIdentity)
  assert.equal(second.workloadIdentity, workload.workloadIdentity)
  assert.notEqual(first.attestationReferenceIdentity, second.attestationReferenceIdentity)
  assert.deepEqual(validateSandboxWorkloadAttestationReference(first), first)
  assert.deepEqual(validateSandboxWorkloadAttestationReferenceForWorkload(first, workload), first)

  const otherWorkload = fixtureParts({ digest: OTHER_DIGEST }).workload
  const otherReference = createSandboxWorkloadAttestationReference({
    workload: otherWorkload,
    subjectDigest: otherWorkload.source.digest,
    attestationKind: "sigstore-bundle",
    attestationDigest: ATTESTATION_DIGEST,
    issuer: "issuer",
    producerIdentity: "producer",
  })
  assert.throws(() => validateSandboxWorkloadAttestationReferenceForWorkload(otherReference, workload), /workload identity mismatch|subject digest mismatch/)
  assert.throws(() => createSandboxWorkloadAttestationReference({
    workload,
    subjectDigest: OTHER_DIGEST,
    attestationKind: "sigstore-bundle",
    attestationDigest: ATTESTATION_DIGEST,
    issuer: "issuer",
    producerIdentity: "producer",
  }), /must equal workload source digest/)
  assert.throws(() => createSandboxWorkloadAttestationReference({
    workload,
    subjectDigest: workload.source.digest,
    attestationKind: "other" as never,
    attestationDigest: ATTESTATION_DIGEST,
    issuer: "issuer",
    producerIdentity: "producer",
  }), /unsupported/)
})

test("H4-R3A hostile structural inputs fail before Proxy/accessor hooks execute", () => {
  let traps = 0
  const proxy = new Proxy({ repository: "ghcr.io/acme/image", digest: FIXTURE_DIGEST }, {
    getPrototypeOf() { traps += 1; return Object.prototype },
    ownKeys() { traps += 1; return [] },
    get(target, property, receiver) { traps += 1; return Reflect.get(target, property, receiver) },
  })
  assert.throws(() => createSandboxOciImageSource(proxy), /non-proxy plain object/)
  assert.equal(traps, 0)

  let argTraps = 0
  const proxiedArgs = new Proxy(["x"], {
    getPrototypeOf() { argTraps += 1; return Array.prototype },
    ownKeys() { argTraps += 1; return ["0", "length"] },
    get(target, property, receiver) { argTraps += 1; return Reflect.get(target, property, receiver) },
  })
  assert.throws(() => createSandboxEntrypoint({ executable: "/bin/x", args: proxiedArgs }), /non-proxy plain array/)
  assert.equal(argTraps, 0)

  let getterCalls = 0
  const accessor: Record<string, unknown> = { digest: FIXTURE_DIGEST }
  Object.defineProperty(accessor, "repository", {
    enumerable: true,
    get() { getterCalls += 1; return "ghcr.io/acme/image" },
  })
  assert.throws(() => createSandboxOciImageSource(accessor as never), /data property/)
  assert.equal(getterCalls, 0)

  const hidden = { repository: "ghcr.io/acme/image", digest: FIXTURE_DIGEST }
  Object.defineProperty(hidden, "secret", { value: true, enumerable: false })
  assert.throws(() => createSandboxOciImageSource(hidden), /enumerable/)
  const symbolBearing = { repository: "ghcr.io/acme/image", digest: FIXTURE_DIGEST } as Record<PropertyKey, unknown>
  symbolBearing[Symbol("x")] = true
  assert.throws(() => createSandboxOciImageSource(symbolBearing as never), /symbol/)
  assert.throws(() => createSandboxOciImageSource({ repository: "ghcr.io/acme/image", digest: FIXTURE_DIGEST, extra: true } as never), /exactly/)
})

test("H4-R3A schema is structurally closed and includes canonical confinement without pretending UTF-8 byte proof", () => {
  const schema = JSON.parse(source("../../../schema/kdo-h4-r3a-sandbox-workload.schema.json")) as Record<string, unknown>
  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema")
  assert.equal(JSON.stringify(schema).includes("maxLength"), false)
  const defs = schema.$defs as Record<string, Record<string, unknown>>
  for (const name of ["ociSource", "entrypoint", "resourcePolicy", "networkPolicy", "confinementScope", "confinementRequest", "workload", "attestationReference"]) {
    assert.equal(defs[name]?.additionalProperties, false, name)
  }
  assert.equal((defs.entrypoint.properties as Record<string, Record<string, unknown>>).args.maxItems, KDO_H4_R3A_LIMITS.maxArgs)
  const resources = defs.resourcePolicy.properties as Record<string, Record<string, unknown>>
  assert.equal(resources.cpuMillis.maximum, KDO_H4_R3A_LIMITS.maxCpuMillis)
  assert.equal(resources.memoryBytes.maximum, KDO_H4_R3A_LIMITS.maxMemoryBytes)
  assert.equal(resources.ttlMs.maximum, KDO_H4_R3A_LIMITS.maxTtlMs)
  assert.equal(resources.maxOutputBytes.maximum, KDO_H4_R3A_LIMITS.maxOutputBytes)
  assert.equal((defs.networkPolicy.properties as Record<string, Record<string, unknown>>).mode.const, "deny-all")
  const workloadProperties = defs.workload.properties as Record<string, Record<string, unknown>>
  assert.equal(workloadProperties.credentialBindingIdentity.type, "null")
  assert.equal(workloadProperties.confinement.$ref, "#/$defs/confinementRequest")
})

test("H4-R3A production is pure and index export is its only integration", () => {
  const production = source("../src/trust/sandbox-workload.ts")
  const imports = [...production.matchAll(/from\s+"([^"]+)"/g)].map((match) => match[1]).sort()
  assert.deepEqual(imports, ["./confinement.ts", "node:crypto", "node:path", "node:util"])
  for (const forbidden of [
    "node:fs", "node:child_process", "node:http", "node:https", "node:net", "node:tls",
    "process.env", "fetch(", "spawn(", "exec(", "execFile(", "RuntimeSession", "EventSink",
    "ExecutionGateway", "PolicyEngine", "ApprovalService", "RuntimeOrchestrator", "ToolRegistry",
    "ProviderRegistry", "DoneGate", "DockerClient", "KubernetesClient",
  ]) {
    assert.equal(production.includes(forbidden), false, `R3A production must not contain ${forbidden}`)
  }
  const index = source("../src/index.ts")
  assert.match(index, /export \* from "\.\/trust\/sandbox-workload\.ts"/)
  assert.equal(index.match(/sandbox-workload\.ts/g)?.length, 1)
})
