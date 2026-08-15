import { createHash } from "node:crypto"
import { posix } from "node:path"
import { types as utilTypes } from "node:util"

import {
  validateConfinementRequest,
  type ConfinementRequest,
} from "./confinement.ts"

export const KDO_H4_R3A_OCI_SOURCE_VERSION = "kodac-h4-r3a-oci-image-source-v1" as const
export const KDO_H4_R3A_ENTRYPOINT_VERSION = "kodac-h4-r3a-entrypoint-v1" as const
export const KDO_H4_R3A_RESOURCE_POLICY_VERSION = "kodac-h4-r3a-resource-policy-v1" as const
export const KDO_H4_R3A_NETWORK_POLICY_VERSION = "kodac-h4-r3a-network-policy-v1" as const
export const KDO_H4_R3A_WORKLOAD_VERSION = "kodac-h4-r3a-sandbox-workload-v1" as const
export const KDO_H4_R3A_ATTESTATION_REFERENCE_VERSION = "kodac-h4-r3a-workload-attestation-ref-v1" as const
export const KDO_H4_R3A_ATTESTATION_KIND = "sigstore-bundle" as const
export const KDO_H4_R3A_NETWORK_MODE = "deny-all" as const

export const KDO_H4_R3A_LIMITS = Object.freeze({
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
} as const)

export const KDO_H4_R3A_OPENSANDBOX_DONOR_PROVENANCE = Object.freeze({
  repository: "opensandbox-group/OpenSandbox",
  sourceCommit: "f8ed8734ce1fda69f0979f912160fb933b9bfa0c",
  sourceTree: "cf033b4f880b7e84b563dcf7f63722582ea48762",
  license: "Apache-2.0",
  licenseBlob: "b09cd7856d58590578ee1a4f3ad45d1310a97f87",
  intakeMode: "STUDY_REIMPLEMENT",
  sources: Object.freeze([
    Object.freeze({ path: "specs/sandbox-lifecycle.yml", blob: "8564db4f8ef50434348b27cefe49bf2d11a9a323" }),
    Object.freeze({ path: "docs/community/release-verification.md", blob: "13eaae323a8d196eb83b6f2b28a7cde863f7e31d" }),
    Object.freeze({ path: "oseps/0004-secure-container-runtime.md", blob: "65d1ec76530b01c7f530a582ba1bbc7deb5c8b35" }),
    Object.freeze({ path: "specs/egress-api.yaml", blob: "08e4885176998e854df62b999914c5eb01855308" }),
    Object.freeze({ path: "docs/guides/credential-vault.md", blob: "435b18ed410018b4fc39d7c00933dd67290b6959" }),
  ]),
} as const)

export interface SandboxOciImageSource {
  readonly version: typeof KDO_H4_R3A_OCI_SOURCE_VERSION
  readonly repository: string
  readonly digest: string
  readonly sourceIdentity: string
}

export interface SandboxEntrypoint {
  readonly version: typeof KDO_H4_R3A_ENTRYPOINT_VERSION
  readonly executable: string
  readonly args: readonly string[]
  readonly entrypointIdentity: string
}

export interface SandboxResourcePolicy {
  readonly version: typeof KDO_H4_R3A_RESOURCE_POLICY_VERSION
  readonly cpuMillis: number
  readonly memoryBytes: number
  readonly ttlMs: number
  readonly maxOutputBytes: number
  readonly resourcePolicyIdentity: string
}

export interface SandboxNetworkPolicy {
  readonly version: typeof KDO_H4_R3A_NETWORK_POLICY_VERSION
  readonly mode: typeof KDO_H4_R3A_NETWORK_MODE
  readonly networkPolicyIdentity: string
}

export interface SandboxWorkloadRequest {
  readonly version: typeof KDO_H4_R3A_WORKLOAD_VERSION
  readonly source: SandboxOciImageSource
  readonly entrypoint: SandboxEntrypoint
  readonly resourcePolicy: SandboxResourcePolicy
  readonly networkPolicy: SandboxNetworkPolicy
  readonly confinement: ConfinementRequest
  readonly executionIntentIdentity: string
  readonly workspaceIdentity: string
  readonly confinementRequestIdentity: string
  readonly credentialBindingIdentity: null
  readonly workloadIdentity: string
}

export interface SandboxWorkloadAttestationReference {
  readonly version: typeof KDO_H4_R3A_ATTESTATION_REFERENCE_VERSION
  readonly workloadIdentity: string
  readonly subjectDigest: string
  readonly attestationKind: typeof KDO_H4_R3A_ATTESTATION_KIND
  readonly attestationDigest: string
  readonly issuer: string
  readonly producerIdentity: string
  readonly attestationReferenceIdentity: string
}

const SHA256_IDENTITY = /^[0-9a-f]{64}$/
const SHA256_DIGEST = /^sha256:[0-9a-f]{64}$/
const OCI_REPOSITORY = /^[a-z0-9.-]+(?::[1-9][0-9]{0,4})?\/[a-z0-9._/-]+$/

function sha256Domain(kind: string, canonical: string): string {
  return createHash("sha256")
    .update(Buffer.from(`KODAC-H4-R3A\0${kind}\0V1\0`, "ascii"))
    .update(Buffer.from(canonical, "utf8"))
    .digest("hex")
}

function byteLength(value: string): number {
  return Buffer.byteLength(value, "utf8")
}

function asPlainRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value) || utilTypes.isProxy(value)) {
    throw new TypeError(`${label} must be a non-proxy plain object`)
  }
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must be a plain object`)
  if (Object.getOwnPropertySymbols(value).length !== 0) throw new TypeError(`${label} must not contain symbol fields`)
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (descriptor.get !== undefined || descriptor.set !== undefined) throw new TypeError(`${label}.${key} must be a data property`)
    if (!descriptor.enumerable) throw new TypeError(`${label}.${key} must be enumerable`)
    if (!("value" in descriptor) || descriptor.value === undefined) throw new TypeError(`${label}.${key} must be a defined data property`)
  }
  return value as Record<string, unknown>
}

function exactKeys(record: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(record).sort()
  const wanted = [...expected].sort()
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new TypeError(`${label} must contain exactly: ${wanted.join(", ")}`)
  }
}

function denseArrayValues(value: unknown, label: string, maxItems: number): unknown[] {
  if (!Array.isArray(value) || utilTypes.isProxy(value) || Object.getPrototypeOf(value) !== Array.prototype) {
    throw new TypeError(`${label} must be a non-proxy plain array`)
  }
  if (Object.getOwnPropertySymbols(value).length !== 0) throw new TypeError(`${label} must not contain symbol fields`)
  const descriptors = Object.getOwnPropertyDescriptors(value)
  const lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length")
  if (lengthDescriptor === undefined || !("value" in lengthDescriptor) || typeof lengthDescriptor.value !== "number") {
    throw new TypeError(`${label} length is invalid`)
  }
  const length = lengthDescriptor.value
  if (!Number.isInteger(length) || length < 0 || length > maxItems) throw new RangeError(`${label} exceeds ${maxItems} entries`)
  const allowed = new Set(["length", ...Array.from({ length }, (_, index) => String(index))])
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (!allowed.has(key)) throw new TypeError(`${label} contains an unexpected array field: ${key}`)
    if (key === "length") continue
    if (descriptor.get !== undefined || descriptor.set !== undefined || !("value" in descriptor)) {
      throw new TypeError(`${label}[${key}] must be a data property`)
    }
    if (!descriptor.enumerable) throw new TypeError(`${label}[${key}] must be enumerable`)
    if (descriptor.value === undefined) throw new TypeError(`${label}[${key}] must be defined`)
  }
  const output: unknown[] = []
  for (let index = 0; index < length; index += 1) {
    const descriptor = descriptors[String(index)]
    if (descriptor === undefined || !("value" in descriptor)) throw new TypeError(`${label} must be dense`)
    output.push(descriptor.value)
  }
  return output
}

function boundedString(value: unknown, label: string, maxBytes: number): string {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(`${label} must be a non-empty string`)
  if (value.includes("\0")) throw new TypeError(`${label} must not contain NUL`)
  if (byteLength(value) > maxBytes) throw new RangeError(`${label} exceeds ${maxBytes} UTF-8 bytes`)
  return value
}

function requireIdentity(value: unknown, label: string): string {
  if (typeof value !== "string" || !SHA256_IDENTITY.test(value)) {
    throw new TypeError(`${label} must be a lowercase SHA-256 identity`)
  }
  return value
}

function requireDigest(value: unknown, label: string): string {
  if (typeof value !== "string" || !SHA256_DIGEST.test(value)) {
    throw new TypeError(`${label} must be sha256:<64 lowercase hex>`)
  }
  return value
}

function positiveInteger(value: unknown, label: string, maximum: number): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0 || value > maximum) {
    throw new RangeError(`${label} must be an integer from 1 through ${maximum}`)
  }
  return value
}

function canonicalRepository(value: unknown): string {
  const repository = boundedString(value, "OCI repository", KDO_H4_R3A_LIMITS.maxRepositoryBytes)
  if (!OCI_REPOSITORY.test(repository)) throw new TypeError("OCI repository must be a canonical lowercase registry/repository locator")
  if (repository.includes("@") || repository.includes("?") || repository.includes("#") || /\s/.test(repository) || repository.includes("://")) {
    throw new TypeError("OCI repository contains forbidden locator syntax")
  }
  const slash = repository.indexOf("/")
  const path = repository.slice(slash + 1)
  const segments = path.split("/")
  if (segments.some((segment) => segment.length === 0 || segment === "." || segment === ".." || segment.includes(":"))) {
    throw new TypeError("OCI repository path must be canonical and tag-free")
  }
  return repository
}

function canonicalExecutable(value: unknown): string {
  const executable = boundedString(value, "sandbox entrypoint executable", KDO_H4_R3A_LIMITS.maxExecutableBytes)
  if (!posix.isAbsolute(executable) || posix.normalize(executable) !== executable || (executable.length > 1 && executable.endsWith("/"))) {
    throw new TypeError("sandbox entrypoint executable must be an absolute canonical POSIX path")
  }
  return executable
}

function canonicalArgs(value: unknown): readonly string[] {
  const entries = denseArrayValues(value, "sandbox entrypoint args", KDO_H4_R3A_LIMITS.maxArgs)
  let totalBytes = 0
  const args = entries.map((entry, index) => {
    if (typeof entry !== "string") throw new TypeError(`sandbox entrypoint args[${index}] must be a string`)
    if (entry.includes("\0")) throw new TypeError(`sandbox entrypoint args[${index}] must not contain NUL`)
    const bytes = byteLength(entry)
    if (bytes > KDO_H4_R3A_LIMITS.maxArgBytes) {
      throw new RangeError(`sandbox entrypoint args[${index}] exceeds ${KDO_H4_R3A_LIMITS.maxArgBytes} UTF-8 bytes`)
    }
    totalBytes += bytes
    if (totalBytes > KDO_H4_R3A_LIMITS.maxArgsBytes) {
      throw new RangeError(`sandbox entrypoint args exceed ${KDO_H4_R3A_LIMITS.maxArgsBytes} aggregate UTF-8 bytes`)
    }
    return entry
  })
  return Object.freeze([...args])
}

function sourcePreimage(input: Omit<SandboxOciImageSource, "sourceIdentity">): string {
  return JSON.stringify({ version: input.version, repository: input.repository, digest: input.digest })
}

export function createSandboxOciImageSource(input: { repository: string; digest: string }): SandboxOciImageSource {
  const record = asPlainRecord(input, "sandbox OCI image source input")
  exactKeys(record, ["repository", "digest"], "sandbox OCI image source input")
  const base = Object.freeze({
    version: KDO_H4_R3A_OCI_SOURCE_VERSION,
    repository: canonicalRepository(record.repository),
    digest: requireDigest(record.digest, "OCI image digest"),
  })
  return Object.freeze({ ...base, sourceIdentity: sha256Domain("OCI_SOURCE", sourcePreimage(base)) })
}

export function validateSandboxOciImageSource(value: unknown): SandboxOciImageSource {
  const record = asPlainRecord(value, "sandbox OCI image source")
  exactKeys(record, ["version", "repository", "digest", "sourceIdentity"], "sandbox OCI image source")
  if (record.version !== KDO_H4_R3A_OCI_SOURCE_VERSION) throw new TypeError("sandbox OCI image source version mismatch")
  const rebuilt = createSandboxOciImageSource({ repository: record.repository as string, digest: record.digest as string })
  if (requireIdentity(record.sourceIdentity, "sourceIdentity") !== rebuilt.sourceIdentity) throw new TypeError("sandbox OCI image source identity mismatch")
  return rebuilt
}

function entrypointPreimage(input: Omit<SandboxEntrypoint, "entrypointIdentity">): string {
  return JSON.stringify({ version: input.version, executable: input.executable, args: input.args })
}

export function createSandboxEntrypoint(input: { executable: string; args: readonly string[] }): SandboxEntrypoint {
  const record = asPlainRecord(input, "sandbox entrypoint input")
  exactKeys(record, ["executable", "args"], "sandbox entrypoint input")
  const base = Object.freeze({
    version: KDO_H4_R3A_ENTRYPOINT_VERSION,
    executable: canonicalExecutable(record.executable),
    args: canonicalArgs(record.args),
  })
  return Object.freeze({ ...base, entrypointIdentity: sha256Domain("ENTRYPOINT", entrypointPreimage(base)) })
}

export function validateSandboxEntrypoint(value: unknown): SandboxEntrypoint {
  const record = asPlainRecord(value, "sandbox entrypoint")
  exactKeys(record, ["version", "executable", "args", "entrypointIdentity"], "sandbox entrypoint")
  if (record.version !== KDO_H4_R3A_ENTRYPOINT_VERSION) throw new TypeError("sandbox entrypoint version mismatch")
  const rebuilt = createSandboxEntrypoint({ executable: record.executable as string, args: record.args as readonly string[] })
  if (requireIdentity(record.entrypointIdentity, "entrypointIdentity") !== rebuilt.entrypointIdentity) throw new TypeError("sandbox entrypoint identity mismatch")
  return rebuilt
}

function resourcePreimage(input: Omit<SandboxResourcePolicy, "resourcePolicyIdentity">): string {
  return JSON.stringify({
    version: input.version,
    cpuMillis: input.cpuMillis,
    memoryBytes: input.memoryBytes,
    ttlMs: input.ttlMs,
    maxOutputBytes: input.maxOutputBytes,
  })
}

export function createSandboxResourcePolicy(input: {
  cpuMillis: number
  memoryBytes: number
  ttlMs: number
  maxOutputBytes: number
}): SandboxResourcePolicy {
  const record = asPlainRecord(input, "sandbox resource policy input")
  exactKeys(record, ["cpuMillis", "memoryBytes", "ttlMs", "maxOutputBytes"], "sandbox resource policy input")
  const base = Object.freeze({
    version: KDO_H4_R3A_RESOURCE_POLICY_VERSION,
    cpuMillis: positiveInteger(record.cpuMillis, "sandbox cpuMillis", KDO_H4_R3A_LIMITS.maxCpuMillis),
    memoryBytes: positiveInteger(record.memoryBytes, "sandbox memoryBytes", KDO_H4_R3A_LIMITS.maxMemoryBytes),
    ttlMs: positiveInteger(record.ttlMs, "sandbox ttlMs", KDO_H4_R3A_LIMITS.maxTtlMs),
    maxOutputBytes: positiveInteger(record.maxOutputBytes, "sandbox maxOutputBytes", KDO_H4_R3A_LIMITS.maxOutputBytes),
  })
  return Object.freeze({ ...base, resourcePolicyIdentity: sha256Domain("RESOURCE_POLICY", resourcePreimage(base)) })
}

export function validateSandboxResourcePolicy(value: unknown): SandboxResourcePolicy {
  const record = asPlainRecord(value, "sandbox resource policy")
  exactKeys(record, ["version", "cpuMillis", "memoryBytes", "ttlMs", "maxOutputBytes", "resourcePolicyIdentity"], "sandbox resource policy")
  if (record.version !== KDO_H4_R3A_RESOURCE_POLICY_VERSION) throw new TypeError("sandbox resource policy version mismatch")
  const rebuilt = createSandboxResourcePolicy({
    cpuMillis: record.cpuMillis as number,
    memoryBytes: record.memoryBytes as number,
    ttlMs: record.ttlMs as number,
    maxOutputBytes: record.maxOutputBytes as number,
  })
  if (requireIdentity(record.resourcePolicyIdentity, "resourcePolicyIdentity") !== rebuilt.resourcePolicyIdentity) {
    throw new TypeError("sandbox resource policy identity mismatch")
  }
  return rebuilt
}

function networkPreimage(input: Omit<SandboxNetworkPolicy, "networkPolicyIdentity">): string {
  return JSON.stringify({ version: input.version, mode: input.mode })
}

export function createSandboxNetworkPolicy(input: { mode: typeof KDO_H4_R3A_NETWORK_MODE }): SandboxNetworkPolicy {
  const record = asPlainRecord(input, "sandbox network policy input")
  exactKeys(record, ["mode"], "sandbox network policy input")
  if (record.mode !== KDO_H4_R3A_NETWORK_MODE) throw new TypeError("R3A sandbox network policy must be deny-all")
  const base = Object.freeze({ version: KDO_H4_R3A_NETWORK_POLICY_VERSION, mode: KDO_H4_R3A_NETWORK_MODE })
  return Object.freeze({ ...base, networkPolicyIdentity: sha256Domain("NETWORK_POLICY", networkPreimage(base)) })
}

export function validateSandboxNetworkPolicy(value: unknown): SandboxNetworkPolicy {
  const record = asPlainRecord(value, "sandbox network policy")
  exactKeys(record, ["version", "mode", "networkPolicyIdentity"], "sandbox network policy")
  if (record.version !== KDO_H4_R3A_NETWORK_POLICY_VERSION) throw new TypeError("sandbox network policy version mismatch")
  const rebuilt = createSandboxNetworkPolicy({ mode: record.mode as typeof KDO_H4_R3A_NETWORK_MODE })
  if (requireIdentity(record.networkPolicyIdentity, "networkPolicyIdentity") !== rebuilt.networkPolicyIdentity) {
    throw new TypeError("sandbox network policy identity mismatch")
  }
  return rebuilt
}

function workloadPreimage(input: Omit<SandboxWorkloadRequest, "workloadIdentity">): string {
  return JSON.stringify({
    version: input.version,
    source: input.source,
    entrypoint: input.entrypoint,
    resourcePolicy: input.resourcePolicy,
    networkPolicy: input.networkPolicy,
    confinement: input.confinement,
    executionIntentIdentity: input.executionIntentIdentity,
    workspaceIdentity: input.workspaceIdentity,
    confinementRequestIdentity: input.confinementRequestIdentity,
    credentialBindingIdentity: input.credentialBindingIdentity,
  })
}

export function createSandboxWorkloadRequest(input: {
  source: SandboxOciImageSource
  entrypoint: SandboxEntrypoint
  resourcePolicy: SandboxResourcePolicy
  networkPolicy: SandboxNetworkPolicy
  confinement: ConfinementRequest
  credentialBindingIdentity: null
}): SandboxWorkloadRequest {
  const record = asPlainRecord(input, "sandbox workload input")
  exactKeys(record, ["source", "entrypoint", "resourcePolicy", "networkPolicy", "confinement", "credentialBindingIdentity"], "sandbox workload input")
  if (record.credentialBindingIdentity !== null) throw new TypeError("R3A sandbox workload credentialBindingIdentity must be null")
  const source = validateSandboxOciImageSource(record.source)
  const entrypoint = validateSandboxEntrypoint(record.entrypoint)
  const resourcePolicy = validateSandboxResourcePolicy(record.resourcePolicy)
  const networkPolicy = validateSandboxNetworkPolicy(record.networkPolicy)
  const confinement = validateConfinementRequest(record.confinement)
  const base = Object.freeze({
    version: KDO_H4_R3A_WORKLOAD_VERSION,
    source,
    entrypoint,
    resourcePolicy,
    networkPolicy,
    confinement,
    executionIntentIdentity: confinement.executionIntentIdentity,
    workspaceIdentity: confinement.workspaceIdentity,
    confinementRequestIdentity: confinement.requestIdentity,
    credentialBindingIdentity: null,
  })
  return Object.freeze({ ...base, workloadIdentity: sha256Domain("WORKLOAD", workloadPreimage(base)) })
}

export function validateSandboxWorkloadRequest(value: unknown): SandboxWorkloadRequest {
  const record = asPlainRecord(value, "sandbox workload request")
  exactKeys(record, [
    "version", "source", "entrypoint", "resourcePolicy", "networkPolicy", "confinement",
    "executionIntentIdentity", "workspaceIdentity", "confinementRequestIdentity",
    "credentialBindingIdentity", "workloadIdentity",
  ], "sandbox workload request")
  if (record.version !== KDO_H4_R3A_WORKLOAD_VERSION) throw new TypeError("sandbox workload version mismatch")
  if (record.credentialBindingIdentity !== null) throw new TypeError("R3A sandbox workload credentialBindingIdentity must be null")
  const confinement = validateConfinementRequest(record.confinement)
  const executionIntentIdentity = requireIdentity(record.executionIntentIdentity, "executionIntentIdentity")
  const workspaceIdentity = requireIdentity(record.workspaceIdentity, "workspaceIdentity")
  const confinementRequestIdentity = requireIdentity(record.confinementRequestIdentity, "confinementRequestIdentity")
  if (executionIntentIdentity !== confinement.executionIntentIdentity) throw new TypeError("executionIntentIdentity does not match confinement request")
  if (workspaceIdentity !== confinement.workspaceIdentity) throw new TypeError("workspaceIdentity does not match confinement request")
  if (confinementRequestIdentity !== confinement.requestIdentity) throw new TypeError("confinementRequestIdentity does not match confinement request")
  const base = Object.freeze({
    version: KDO_H4_R3A_WORKLOAD_VERSION,
    source: validateSandboxOciImageSource(record.source),
    entrypoint: validateSandboxEntrypoint(record.entrypoint),
    resourcePolicy: validateSandboxResourcePolicy(record.resourcePolicy),
    networkPolicy: validateSandboxNetworkPolicy(record.networkPolicy),
    confinement,
    executionIntentIdentity,
    workspaceIdentity,
    confinementRequestIdentity,
    credentialBindingIdentity: null,
  })
  const expected = sha256Domain("WORKLOAD", workloadPreimage(base))
  if (requireIdentity(record.workloadIdentity, "workloadIdentity") !== expected) throw new TypeError("sandbox workload identity mismatch")
  return Object.freeze({ ...base, workloadIdentity: expected })
}

function attestationPreimage(input: Omit<SandboxWorkloadAttestationReference, "attestationReferenceIdentity">): string {
  return JSON.stringify({
    version: input.version,
    workloadIdentity: input.workloadIdentity,
    subjectDigest: input.subjectDigest,
    attestationKind: input.attestationKind,
    attestationDigest: input.attestationDigest,
    issuer: input.issuer,
    producerIdentity: input.producerIdentity,
  })
}

export function createSandboxWorkloadAttestationReference(input: {
  workload: SandboxWorkloadRequest
  subjectDigest: string
  attestationKind: typeof KDO_H4_R3A_ATTESTATION_KIND
  attestationDigest: string
  issuer: string
  producerIdentity: string
}): SandboxWorkloadAttestationReference {
  const record = asPlainRecord(input, "sandbox workload attestation reference input")
  exactKeys(record, ["workload", "subjectDigest", "attestationKind", "attestationDigest", "issuer", "producerIdentity"], "sandbox workload attestation reference input")
  const workload = validateSandboxWorkloadRequest(record.workload)
  const subjectDigest = requireDigest(record.subjectDigest, "attestation subjectDigest")
  if (subjectDigest !== workload.source.digest) throw new TypeError("attestation subjectDigest must equal workload source digest")
  if (record.attestationKind !== KDO_H4_R3A_ATTESTATION_KIND) throw new TypeError("attestationKind is unsupported")
  const base = Object.freeze({
    version: KDO_H4_R3A_ATTESTATION_REFERENCE_VERSION,
    workloadIdentity: workload.workloadIdentity,
    subjectDigest,
    attestationKind: KDO_H4_R3A_ATTESTATION_KIND,
    attestationDigest: requireDigest(record.attestationDigest, "attestationDigest"),
    issuer: boundedString(record.issuer, "attestation issuer", KDO_H4_R3A_LIMITS.maxIssuerBytes),
    producerIdentity: boundedString(record.producerIdentity, "attestation producerIdentity", KDO_H4_R3A_LIMITS.maxProducerIdentityBytes),
  })
  return Object.freeze({ ...base, attestationReferenceIdentity: sha256Domain("ATTESTATION_REFERENCE", attestationPreimage(base)) })
}

export function validateSandboxWorkloadAttestationReference(value: unknown): SandboxWorkloadAttestationReference {
  const record = asPlainRecord(value, "sandbox workload attestation reference")
  exactKeys(record, [
    "version", "workloadIdentity", "subjectDigest", "attestationKind", "attestationDigest",
    "issuer", "producerIdentity", "attestationReferenceIdentity",
  ], "sandbox workload attestation reference")
  if (record.version !== KDO_H4_R3A_ATTESTATION_REFERENCE_VERSION) throw new TypeError("attestation reference version mismatch")
  if (record.attestationKind !== KDO_H4_R3A_ATTESTATION_KIND) throw new TypeError("attestationKind is unsupported")
  const base = Object.freeze({
    version: KDO_H4_R3A_ATTESTATION_REFERENCE_VERSION,
    workloadIdentity: requireIdentity(record.workloadIdentity, "attestation workloadIdentity"),
    subjectDigest: requireDigest(record.subjectDigest, "attestation subjectDigest"),
    attestationKind: KDO_H4_R3A_ATTESTATION_KIND,
    attestationDigest: requireDigest(record.attestationDigest, "attestationDigest"),
    issuer: boundedString(record.issuer, "attestation issuer", KDO_H4_R3A_LIMITS.maxIssuerBytes),
    producerIdentity: boundedString(record.producerIdentity, "attestation producerIdentity", KDO_H4_R3A_LIMITS.maxProducerIdentityBytes),
  })
  const expected = sha256Domain("ATTESTATION_REFERENCE", attestationPreimage(base))
  if (requireIdentity(record.attestationReferenceIdentity, "attestationReferenceIdentity") !== expected) {
    throw new TypeError("attestation reference identity mismatch")
  }
  return Object.freeze({ ...base, attestationReferenceIdentity: expected })
}

export function validateSandboxWorkloadAttestationReferenceForWorkload(
  referenceValue: unknown,
  workloadValue: unknown,
): SandboxWorkloadAttestationReference {
  const reference = validateSandboxWorkloadAttestationReference(referenceValue)
  const workload = validateSandboxWorkloadRequest(workloadValue)
  if (reference.workloadIdentity !== workload.workloadIdentity) throw new TypeError("attestation reference workload identity mismatch")
  if (reference.subjectDigest !== workload.source.digest) throw new TypeError("attestation reference subject digest mismatch")
  return reference
}
