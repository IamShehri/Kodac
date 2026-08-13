import { createHash } from "node:crypto"

export const KDO_S1_SPEC_ARTIFACT_VERSION = "kodac-spec-artifact-lineage-v1" as const

export const KDO_S1_SPEC_KIT_DONOR_PROVENANCE = Object.freeze({
  repository: "github/spec-kit",
  sourceCommit: "e79fa25f3f465b1ce779f570ccacef7b379e9166",
  license: "MIT",
  intakeMode: "PORT",
  sources: Object.freeze([
    Object.freeze({ path: "templates/commands/specify.md", blob: "54151e8b423026a356e228eb04d1a6aa368c385c" }),
    Object.freeze({ path: "templates/commands/plan.md", blob: "664f4281142ada0d1e678d46976c4b36df7d68d0" }),
    Object.freeze({ path: "templates/commands/tasks.md", blob: "64146a35aacbef8f607be9dc4e376b191af8cd4e" }),
    Object.freeze({ path: "templates/commands/analyze.md", blob: "2cd83bd7c031e01af1f3e5745168982d9085a3aa" }),
    Object.freeze({ path: "templates/commands/converge.md", blob: "eadb96ee5822b70d0b5669e6d4a32134af0e2598" }),
    Object.freeze({ path: "templates/spec-template.md", blob: "ceb28776215a098e977650ac090c785dcbf53651" }),
    Object.freeze({ path: "templates/plan-template.md", blob: "36f2eab16880bac670fe43cbe7ef2b9bc8c3aa2f" }),
    Object.freeze({ path: "templates/tasks-template.md", blob: "7fff087cc5a3c51a889d865fd9126607a032d233" }),
  ]),
} as const)

export const KDO_S1_LIMITS: Readonly<{
  maxFeatureKeyBytes: number
  maxRevision: number
}> = Object.freeze({
  maxFeatureKeyBytes: 256,
  maxRevision: 1_000_000_000,
})

export type SpecArtifactKind = "SPECIFICATION" | "PLAN" | "TASK_SET" | "LINEAGE"

interface RepositoryBindingInput {
  readonly featureKey: string
  readonly repositoryHead: string
  readonly repositoryTreeIdentity?: string
}

interface RevisionInput {
  readonly artifactRevision: number
}

export interface SpecificationArtifactInput extends RepositoryBindingInput, RevisionInput {
  readonly specificationContentIdentity: string
  readonly governingPolicyIdentity?: string
  readonly predecessorSpecificationArtifactIdentity?: string
}

export interface SpecificationArtifact extends SpecificationArtifactInput {
  readonly kind: "SPECIFICATION"
  readonly version: typeof KDO_S1_SPEC_ARTIFACT_VERSION
  readonly specificationArtifactIdentity: string
}

export interface PlanArtifactInput extends RevisionInput {
  readonly specification: SpecificationArtifact
  readonly planContentIdentity: string
  readonly predecessorPlanArtifactIdentity?: string
}

export interface PlanArtifact extends RepositoryBindingInput, RevisionInput {
  readonly kind: "PLAN"
  readonly version: typeof KDO_S1_SPEC_ARTIFACT_VERSION
  readonly specificationArtifactIdentity: string
  readonly planContentIdentity: string
  readonly predecessorPlanArtifactIdentity?: string
  readonly planArtifactIdentity: string
}

export interface TaskSetArtifactInput extends RevisionInput {
  readonly specification: SpecificationArtifact
  readonly plan: PlanArtifact
  readonly taskSetContentIdentity: string
  readonly predecessorTaskSetArtifactIdentity?: string
}

export interface TaskSetArtifact extends RepositoryBindingInput, RevisionInput {
  readonly kind: "TASK_SET"
  readonly version: typeof KDO_S1_SPEC_ARTIFACT_VERSION
  readonly specificationArtifactIdentity: string
  readonly planArtifactIdentity: string
  readonly taskSetContentIdentity: string
  readonly predecessorTaskSetArtifactIdentity?: string
  readonly taskSetArtifactIdentity: string
}

export interface FeatureArtifactLineageInput extends RevisionInput {
  readonly specification: SpecificationArtifact
  readonly plan?: PlanArtifact
  readonly taskSet?: TaskSetArtifact
  readonly predecessorLineageIdentity?: string
}

export interface FeatureArtifactLineage extends RepositoryBindingInput, RevisionInput {
  readonly kind: "LINEAGE"
  readonly version: typeof KDO_S1_SPEC_ARTIFACT_VERSION
  readonly specificationArtifactIdentity: string
  readonly planArtifactIdentity?: string
  readonly taskSetArtifactIdentity?: string
  readonly predecessorLineageIdentity?: string
  readonly lineageIdentity: string
}

export interface FeatureArtifactLineageSet {
  readonly specification: SpecificationArtifact
  readonly plan?: PlanArtifact
  readonly taskSet?: TaskSetArtifact
  readonly lineage: FeatureArtifactLineage
}

const SHA256 = /^[0-9a-f]{64}$/
const GIT_OBJECT_ID = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/
const FEATURE_KEY = /^[A-Za-z0-9][A-Za-z0-9._:/-]*$/

const SPEC_KEYS = [
  "kind", "version", "featureKey", "repositoryHead", "repositoryTreeIdentity", "artifactRevision",
  "specificationContentIdentity", "governingPolicyIdentity", "predecessorSpecificationArtifactIdentity",
  "specificationArtifactIdentity",
] as const
const PLAN_KEYS = [
  "kind", "version", "featureKey", "repositoryHead", "repositoryTreeIdentity", "artifactRevision",
  "specificationArtifactIdentity", "planContentIdentity", "predecessorPlanArtifactIdentity", "planArtifactIdentity",
] as const
const TASK_KEYS = [
  "kind", "version", "featureKey", "repositoryHead", "repositoryTreeIdentity", "artifactRevision",
  "specificationArtifactIdentity", "planArtifactIdentity", "taskSetContentIdentity",
  "predecessorTaskSetArtifactIdentity", "taskSetArtifactIdentity",
] as const
const LINEAGE_KEYS = [
  "kind", "version", "featureKey", "repositoryHead", "repositoryTreeIdentity", "artifactRevision",
  "specificationArtifactIdentity", "planArtifactIdentity", "taskSetArtifactIdentity", "predecessorLineageIdentity",
  "lineageIdentity",
] as const

function compareStrings(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0 }

function canonicalize(value: unknown): string {
  if (value === null) return "null"
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value)
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("canonical value contains a non-finite number")
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`
  if (typeof value !== "object") throw new TypeError("canonical value must be JSON-compatible")
  const record = value as Record<string, unknown>
  const keys = Object.keys(record).sort(compareStrings)
  for (const key of keys) if (record[key] === undefined) throw new TypeError(`canonical value contains undefined field: ${key}`)
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`).join(",")}}`
}

function sha256(value: unknown): string {
  return createHash("sha256").update(canonicalize(value), "utf8").digest("hex")
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`)
  return value as Record<string, unknown>
}

function exactKeys(record: Record<string, unknown>, allowed: readonly string[], label: string): void {
  const allowedSet = new Set(allowed)
  for (const key of Object.keys(record)) if (!allowedSet.has(key)) throw new TypeError(`${label} contains unknown field: ${key}`)
}

function boundedString(value: unknown, label: string, maxBytes: number): string {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(`${label} must be a non-empty string`)
  if (value.includes("\0")) throw new TypeError(`${label} must be NUL-free`)
  if (Buffer.byteLength(value, "utf8") > maxBytes) throw new RangeError(`${label} exceeds ${maxBytes} UTF-8 bytes`)
  return value
}

function featureKey(value: unknown): string {
  const text = boundedString(value, "artifact.featureKey", KDO_S1_LIMITS.maxFeatureKeyBytes)
  if (!FEATURE_KEY.test(text)) throw new TypeError("artifact.featureKey contains unsupported characters")
  return text
}

function shaIdentity(value: unknown, label: string): string {
  const text = boundedString(value, label, 64)
  if (!SHA256.test(text)) throw new TypeError(`${label} must be a lowercase SHA-256 identity`)
  return text
}

function optionalShaIdentity(value: unknown, label: string): string | undefined {
  return value === undefined ? undefined : shaIdentity(value, label)
}

function gitObjectId(value: unknown, label: string): string {
  const text = boundedString(value, label, 64)
  if (!GIT_OBJECT_ID.test(text)) throw new TypeError(`${label} must be a lowercase 40- or 64-hex Git object id`)
  return text
}

function optionalGitObjectId(value: unknown, label: string): string | undefined {
  return value === undefined ? undefined : gitObjectId(value, label)
}

function revision(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 1 || (value as number) > KDO_S1_LIMITS.maxRevision) {
    throw new TypeError(`${label} must be an integer from 1 through ${KDO_S1_LIMITS.maxRevision}`)
  }
  return value as number
}

function predecessorForRevision(value: unknown, artifactRevision: number, label: string): string | undefined {
  const predecessor = optionalShaIdentity(value, label)
  if (artifactRevision === 1 && predecessor !== undefined) throw new TypeError(`${label} must be absent for revision 1`)
  if (artifactRevision > 1 && predecessor === undefined) throw new TypeError(`${label} is required after revision 1`)
  return predecessor
}

function repositoryBinding(record: Record<string, unknown>): RepositoryBindingInput {
  const tree = optionalGitObjectId(record.repositoryTreeIdentity, "artifact.repositoryTreeIdentity")
  return Object.freeze({
    featureKey: featureKey(record.featureKey),
    repositoryHead: gitObjectId(record.repositoryHead, "artifact.repositoryHead"),
    ...(tree === undefined ? {} : { repositoryTreeIdentity: tree }),
  })
}

function projectRepositoryBinding(binding: RepositoryBindingInput): RepositoryBindingInput {
  return Object.freeze({
    featureKey: binding.featureKey,
    repositoryHead: binding.repositoryHead,
    ...(binding.repositoryTreeIdentity === undefined ? {} : { repositoryTreeIdentity: binding.repositoryTreeIdentity }),
  })
}

function sameRepositoryBinding(a: RepositoryBindingInput, b: RepositoryBindingInput): boolean {
  return a.featureKey === b.featureKey && a.repositoryHead === b.repositoryHead &&
    a.repositoryTreeIdentity === b.repositoryTreeIdentity
}

function assertSameRepositoryBinding(a: RepositoryBindingInput, b: RepositoryBindingInput, label: string): void {
  if (!sameRepositoryBinding(a, b)) throw new TypeError(`${label} repository binding mismatch`)
}

function specificationPreimage(record: Omit<SpecificationArtifact, "specificationArtifactIdentity">): Record<string, unknown> {
  return { ...record }
}

export function createSpecificationArtifact(input: SpecificationArtifactInput): SpecificationArtifact {
  const record = asRecord(input, "specificationArtifact")
  exactKeys(record, [
    "featureKey", "repositoryHead", "repositoryTreeIdentity", "artifactRevision", "specificationContentIdentity",
    "governingPolicyIdentity", "predecessorSpecificationArtifactIdentity",
  ], "specificationArtifact")
  const binding = repositoryBinding(record)
  const artifactRevision = revision(record.artifactRevision, "specificationArtifact.artifactRevision")
  const predecessor = predecessorForRevision(record.predecessorSpecificationArtifactIdentity, artifactRevision, "specificationArtifact.predecessorSpecificationArtifactIdentity")
  const policy = optionalShaIdentity(record.governingPolicyIdentity, "specificationArtifact.governingPolicyIdentity")
  const base = Object.freeze({
    kind: "SPECIFICATION" as const,
    version: KDO_S1_SPEC_ARTIFACT_VERSION,
    ...binding,
    artifactRevision,
    specificationContentIdentity: shaIdentity(record.specificationContentIdentity, "specificationArtifact.specificationContentIdentity"),
    ...(policy === undefined ? {} : { governingPolicyIdentity: policy }),
    ...(predecessor === undefined ? {} : { predecessorSpecificationArtifactIdentity: predecessor }),
  })
  const identity = sha256(specificationPreimage(base))
  if (predecessor === identity) throw new TypeError("specificationArtifact cannot be its own predecessor")
  return Object.freeze({ ...base, specificationArtifactIdentity: identity })
}

export function validateSpecificationArtifact(value: unknown): SpecificationArtifact {
  const record = asRecord(value, "specificationArtifact"); exactKeys(record, SPEC_KEYS, "specificationArtifact")
  if (record.kind !== "SPECIFICATION" || record.version !== KDO_S1_SPEC_ARTIFACT_VERSION) throw new TypeError("unsupported specification artifact contract")
  const claimed = shaIdentity(record.specificationArtifactIdentity, "specificationArtifact.specificationArtifactIdentity")
  const rebuilt = createSpecificationArtifact({
    featureKey: record.featureKey as string,
    repositoryHead: record.repositoryHead as string,
    ...(record.repositoryTreeIdentity === undefined ? {} : { repositoryTreeIdentity: record.repositoryTreeIdentity as string }),
    artifactRevision: record.artifactRevision as number,
    specificationContentIdentity: record.specificationContentIdentity as string,
    ...(record.governingPolicyIdentity === undefined ? {} : { governingPolicyIdentity: record.governingPolicyIdentity as string }),
    ...(record.predecessorSpecificationArtifactIdentity === undefined ? {} : { predecessorSpecificationArtifactIdentity: record.predecessorSpecificationArtifactIdentity as string }),
  })
  if (claimed !== rebuilt.specificationArtifactIdentity || canonicalize(record) !== canonicalize(rebuilt)) throw new TypeError("specification artifact derived fields mismatch")
  return rebuilt
}

function buildPlanArtifact(input: {
  binding: RepositoryBindingInput
  specificationArtifactIdentity: string
  planContentIdentity: unknown
  artifactRevision: unknown
  predecessorPlanArtifactIdentity?: unknown
}): PlanArtifact {
  const artifactRevision = revision(input.artifactRevision, "planArtifact.artifactRevision")
  const predecessor = predecessorForRevision(input.predecessorPlanArtifactIdentity, artifactRevision, "planArtifact.predecessorPlanArtifactIdentity")
  const base = Object.freeze({
    kind: "PLAN" as const,
    version: KDO_S1_SPEC_ARTIFACT_VERSION,
    ...input.binding,
    artifactRevision,
    specificationArtifactIdentity: shaIdentity(input.specificationArtifactIdentity, "planArtifact.specificationArtifactIdentity"),
    planContentIdentity: shaIdentity(input.planContentIdentity, "planArtifact.planContentIdentity"),
    ...(predecessor === undefined ? {} : { predecessorPlanArtifactIdentity: predecessor }),
  })
  const identity = sha256(base)
  if (predecessor === identity) throw new TypeError("planArtifact cannot be its own predecessor")
  return Object.freeze({ ...base, planArtifactIdentity: identity })
}

export function createPlanArtifact(input: PlanArtifactInput): PlanArtifact {
  const record = asRecord(input, "planArtifactInput")
  exactKeys(record, ["specification", "planContentIdentity", "artifactRevision", "predecessorPlanArtifactIdentity"], "planArtifactInput")
  const specification = validateSpecificationArtifact(record.specification)
  return buildPlanArtifact({
    binding: projectRepositoryBinding(specification),
    specificationArtifactIdentity: specification.specificationArtifactIdentity,
    planContentIdentity: record.planContentIdentity,
    artifactRevision: record.artifactRevision,
    predecessorPlanArtifactIdentity: record.predecessorPlanArtifactIdentity,
  })
}

export function validatePlanArtifact(value: unknown): PlanArtifact {
  const record = asRecord(value, "planArtifact"); exactKeys(record, PLAN_KEYS, "planArtifact")
  if (record.kind !== "PLAN" || record.version !== KDO_S1_SPEC_ARTIFACT_VERSION) throw new TypeError("unsupported plan artifact contract")
  const binding = repositoryBinding(record)
  const claimed = shaIdentity(record.planArtifactIdentity, "planArtifact.planArtifactIdentity")
  const rebuilt = buildPlanArtifact({
    binding,
    specificationArtifactIdentity: shaIdentity(record.specificationArtifactIdentity, "planArtifact.specificationArtifactIdentity"),
    planContentIdentity: record.planContentIdentity,
    artifactRevision: record.artifactRevision,
    predecessorPlanArtifactIdentity: record.predecessorPlanArtifactIdentity,
  })
  if (claimed !== rebuilt.planArtifactIdentity || canonicalize(record) !== canonicalize(rebuilt)) throw new TypeError("plan artifact derived fields mismatch")
  return rebuilt
}

function buildTaskSetArtifact(input: {
  binding: RepositoryBindingInput
  specificationArtifactIdentity: string
  planArtifactIdentity: string
  taskSetContentIdentity: unknown
  artifactRevision: unknown
  predecessorTaskSetArtifactIdentity?: unknown
}): TaskSetArtifact {
  const artifactRevision = revision(input.artifactRevision, "taskSetArtifact.artifactRevision")
  const predecessor = predecessorForRevision(input.predecessorTaskSetArtifactIdentity, artifactRevision, "taskSetArtifact.predecessorTaskSetArtifactIdentity")
  const base = Object.freeze({
    kind: "TASK_SET" as const,
    version: KDO_S1_SPEC_ARTIFACT_VERSION,
    ...input.binding,
    artifactRevision,
    specificationArtifactIdentity: shaIdentity(input.specificationArtifactIdentity, "taskSetArtifact.specificationArtifactIdentity"),
    planArtifactIdentity: shaIdentity(input.planArtifactIdentity, "taskSetArtifact.planArtifactIdentity"),
    taskSetContentIdentity: shaIdentity(input.taskSetContentIdentity, "taskSetArtifact.taskSetContentIdentity"),
    ...(predecessor === undefined ? {} : { predecessorTaskSetArtifactIdentity: predecessor }),
  })
  const identity = sha256(base)
  if (predecessor === identity) throw new TypeError("taskSetArtifact cannot be its own predecessor")
  return Object.freeze({ ...base, taskSetArtifactIdentity: identity })
}

export function createTaskSetArtifact(input: TaskSetArtifactInput): TaskSetArtifact {
  const record = asRecord(input, "taskSetArtifactInput")
  exactKeys(record, ["specification", "plan", "taskSetContentIdentity", "artifactRevision", "predecessorTaskSetArtifactIdentity"], "taskSetArtifactInput")
  const specification = validateSpecificationArtifact(record.specification)
  const plan = validatePlanArtifact(record.plan)
  assertSameRepositoryBinding(specification, plan, "taskSetArtifact specification/plan")
  if (plan.specificationArtifactIdentity !== specification.specificationArtifactIdentity) throw new TypeError("taskSetArtifact plan does not reference the supplied specification")
  return buildTaskSetArtifact({
    binding: projectRepositoryBinding(specification),
    specificationArtifactIdentity: specification.specificationArtifactIdentity,
    planArtifactIdentity: plan.planArtifactIdentity,
    taskSetContentIdentity: record.taskSetContentIdentity,
    artifactRevision: record.artifactRevision,
    predecessorTaskSetArtifactIdentity: record.predecessorTaskSetArtifactIdentity,
  })
}

export function validateTaskSetArtifact(value: unknown): TaskSetArtifact {
  const record = asRecord(value, "taskSetArtifact"); exactKeys(record, TASK_KEYS, "taskSetArtifact")
  if (record.kind !== "TASK_SET" || record.version !== KDO_S1_SPEC_ARTIFACT_VERSION) throw new TypeError("unsupported task-set artifact contract")
  const binding = repositoryBinding(record)
  const claimed = shaIdentity(record.taskSetArtifactIdentity, "taskSetArtifact.taskSetArtifactIdentity")
  const rebuilt = buildTaskSetArtifact({
    binding,
    specificationArtifactIdentity: shaIdentity(record.specificationArtifactIdentity, "taskSetArtifact.specificationArtifactIdentity"),
    planArtifactIdentity: shaIdentity(record.planArtifactIdentity, "taskSetArtifact.planArtifactIdentity"),
    taskSetContentIdentity: record.taskSetContentIdentity,
    artifactRevision: record.artifactRevision,
    predecessorTaskSetArtifactIdentity: record.predecessorTaskSetArtifactIdentity,
  })
  if (claimed !== rebuilt.taskSetArtifactIdentity || canonicalize(record) !== canonicalize(rebuilt)) throw new TypeError("task-set artifact derived fields mismatch")
  return rebuilt
}

function buildLineage(input: {
  binding: RepositoryBindingInput
  specificationArtifactIdentity: string
  planArtifactIdentity?: string
  taskSetArtifactIdentity?: string
  artifactRevision: unknown
  predecessorLineageIdentity?: unknown
}): FeatureArtifactLineage {
  const artifactRevision = revision(input.artifactRevision, "featureArtifactLineage.artifactRevision")
  const predecessor = predecessorForRevision(input.predecessorLineageIdentity, artifactRevision, "featureArtifactLineage.predecessorLineageIdentity")
  const base = Object.freeze({
    kind: "LINEAGE" as const,
    version: KDO_S1_SPEC_ARTIFACT_VERSION,
    ...input.binding,
    artifactRevision,
    specificationArtifactIdentity: shaIdentity(input.specificationArtifactIdentity, "featureArtifactLineage.specificationArtifactIdentity"),
    ...(input.planArtifactIdentity === undefined ? {} : { planArtifactIdentity: shaIdentity(input.planArtifactIdentity, "featureArtifactLineage.planArtifactIdentity") }),
    ...(input.taskSetArtifactIdentity === undefined ? {} : { taskSetArtifactIdentity: shaIdentity(input.taskSetArtifactIdentity, "featureArtifactLineage.taskSetArtifactIdentity") }),
    ...(predecessor === undefined ? {} : { predecessorLineageIdentity: predecessor }),
  })
  if (base.taskSetArtifactIdentity !== undefined && base.planArtifactIdentity === undefined) throw new TypeError("featureArtifactLineage task set requires a plan")
  const identity = sha256(base)
  if (predecessor === identity) throw new TypeError("featureArtifactLineage cannot be its own predecessor")
  return Object.freeze({ ...base, lineageIdentity: identity })
}

export function createFeatureArtifactLineage(input: FeatureArtifactLineageInput): FeatureArtifactLineage {
  const record = asRecord(input, "featureArtifactLineageInput")
  exactKeys(record, ["specification", "plan", "taskSet", "artifactRevision", "predecessorLineageIdentity"], "featureArtifactLineageInput")
  const specification = validateSpecificationArtifact(record.specification)
  const plan = record.plan === undefined ? undefined : validatePlanArtifact(record.plan)
  const taskSet = record.taskSet === undefined ? undefined : validateTaskSetArtifact(record.taskSet)
  if (plan !== undefined) {
    assertSameRepositoryBinding(specification, plan, "featureArtifactLineage specification/plan")
    if (plan.specificationArtifactIdentity !== specification.specificationArtifactIdentity) throw new TypeError("featureArtifactLineage plan does not reference specification")
  }
  if (taskSet !== undefined) {
    if (plan === undefined) throw new TypeError("featureArtifactLineage task set requires supplied plan")
    assertSameRepositoryBinding(specification, taskSet, "featureArtifactLineage specification/task set")
    if (taskSet.specificationArtifactIdentity !== specification.specificationArtifactIdentity || taskSet.planArtifactIdentity !== plan.planArtifactIdentity) {
      throw new TypeError("featureArtifactLineage task set does not reference supplied specification and plan")
    }
  }
  return buildLineage({
    binding: projectRepositoryBinding(specification),
    specificationArtifactIdentity: specification.specificationArtifactIdentity,
    planArtifactIdentity: plan?.planArtifactIdentity,
    taskSetArtifactIdentity: taskSet?.taskSetArtifactIdentity,
    artifactRevision: record.artifactRevision,
    predecessorLineageIdentity: record.predecessorLineageIdentity,
  })
}

export function validateFeatureArtifactLineage(value: unknown): FeatureArtifactLineage {
  const record = asRecord(value, "featureArtifactLineage"); exactKeys(record, LINEAGE_KEYS, "featureArtifactLineage")
  if (record.kind !== "LINEAGE" || record.version !== KDO_S1_SPEC_ARTIFACT_VERSION) throw new TypeError("unsupported feature lineage contract")
  const binding = repositoryBinding(record)
  const claimed = shaIdentity(record.lineageIdentity, "featureArtifactLineage.lineageIdentity")
  const rebuilt = buildLineage({
    binding,
    specificationArtifactIdentity: shaIdentity(record.specificationArtifactIdentity, "featureArtifactLineage.specificationArtifactIdentity"),
    planArtifactIdentity: record.planArtifactIdentity as string | undefined,
    taskSetArtifactIdentity: record.taskSetArtifactIdentity as string | undefined,
    artifactRevision: record.artifactRevision,
    predecessorLineageIdentity: record.predecessorLineageIdentity,
  })
  if (claimed !== rebuilt.lineageIdentity || canonicalize(record) !== canonicalize(rebuilt)) throw new TypeError("feature lineage derived fields mismatch")
  return rebuilt
}

export function verifyFeatureArtifactLineage(input: FeatureArtifactLineageSet): Readonly<FeatureArtifactLineageSet> {
  const specification = validateSpecificationArtifact(input.specification)
  const plan = input.plan === undefined ? undefined : validatePlanArtifact(input.plan)
  const taskSet = input.taskSet === undefined ? undefined : validateTaskSetArtifact(input.taskSet)
  const lineage = validateFeatureArtifactLineage(input.lineage)
  assertSameRepositoryBinding(specification, lineage, "lineage/specification")
  if (lineage.specificationArtifactIdentity !== specification.specificationArtifactIdentity) throw new TypeError("lineage references a different specification")
  if (plan === undefined) {
    if (lineage.planArtifactIdentity !== undefined || taskSet !== undefined) throw new TypeError("lineage plan state does not match supplied artifacts")
  } else {
    assertSameRepositoryBinding(specification, plan, "specification/plan")
    if (plan.specificationArtifactIdentity !== specification.specificationArtifactIdentity || lineage.planArtifactIdentity !== plan.planArtifactIdentity) {
      throw new TypeError("lineage plan binding mismatch")
    }
  }
  if (taskSet === undefined) {
    if (lineage.taskSetArtifactIdentity !== undefined) throw new TypeError("lineage task-set state does not match supplied artifacts")
  } else {
    if (plan === undefined) throw new TypeError("task set requires supplied plan")
    assertSameRepositoryBinding(specification, taskSet, "specification/task set")
    if (taskSet.specificationArtifactIdentity !== specification.specificationArtifactIdentity || taskSet.planArtifactIdentity !== plan.planArtifactIdentity || lineage.taskSetArtifactIdentity !== taskSet.taskSetArtifactIdentity) {
      throw new TypeError("lineage task-set binding mismatch")
    }
  }
  return Object.freeze({ specification, ...(plan === undefined ? {} : { plan }), ...(taskSet === undefined ? {} : { taskSet }), lineage })
}

function verifyPredecessorLink(input: {
  label: string
  currentFeatureKey: string
  predecessorFeatureKey: string
  currentRevision: number
  predecessorRevision: number
  claimedPredecessorIdentity: string | undefined
  actualPredecessorIdentity: string
}): void {
  if (input.currentFeatureKey !== input.predecessorFeatureKey) throw new TypeError(`${input.label} feature lineage mismatch`)
  if (input.currentRevision !== input.predecessorRevision + 1) throw new TypeError(`${input.label} revision must immediately follow predecessor revision`)
  if (input.claimedPredecessorIdentity !== input.actualPredecessorIdentity) throw new TypeError(`${input.label} predecessor identity mismatch`)
}

export function verifySpecificationArtifactPredecessor(
  currentValue: unknown,
  predecessorValue: unknown,
): Readonly<{ current: SpecificationArtifact; predecessor: SpecificationArtifact }> {
  const current = validateSpecificationArtifact(currentValue)
  const predecessor = validateSpecificationArtifact(predecessorValue)
  verifyPredecessorLink({
    label: "specificationArtifact",
    currentFeatureKey: current.featureKey,
    predecessorFeatureKey: predecessor.featureKey,
    currentRevision: current.artifactRevision,
    predecessorRevision: predecessor.artifactRevision,
    claimedPredecessorIdentity: current.predecessorSpecificationArtifactIdentity,
    actualPredecessorIdentity: predecessor.specificationArtifactIdentity,
  })
  return Object.freeze({ current, predecessor })
}

export function verifyPlanArtifactPredecessor(
  currentValue: unknown,
  predecessorValue: unknown,
): Readonly<{ current: PlanArtifact; predecessor: PlanArtifact }> {
  const current = validatePlanArtifact(currentValue)
  const predecessor = validatePlanArtifact(predecessorValue)
  verifyPredecessorLink({
    label: "planArtifact",
    currentFeatureKey: current.featureKey,
    predecessorFeatureKey: predecessor.featureKey,
    currentRevision: current.artifactRevision,
    predecessorRevision: predecessor.artifactRevision,
    claimedPredecessorIdentity: current.predecessorPlanArtifactIdentity,
    actualPredecessorIdentity: predecessor.planArtifactIdentity,
  })
  return Object.freeze({ current, predecessor })
}

export function verifyTaskSetArtifactPredecessor(
  currentValue: unknown,
  predecessorValue: unknown,
): Readonly<{ current: TaskSetArtifact; predecessor: TaskSetArtifact }> {
  const current = validateTaskSetArtifact(currentValue)
  const predecessor = validateTaskSetArtifact(predecessorValue)
  verifyPredecessorLink({
    label: "taskSetArtifact",
    currentFeatureKey: current.featureKey,
    predecessorFeatureKey: predecessor.featureKey,
    currentRevision: current.artifactRevision,
    predecessorRevision: predecessor.artifactRevision,
    claimedPredecessorIdentity: current.predecessorTaskSetArtifactIdentity,
    actualPredecessorIdentity: predecessor.taskSetArtifactIdentity,
  })
  return Object.freeze({ current, predecessor })
}

export function verifyFeatureArtifactLineagePredecessor(
  currentValue: unknown,
  predecessorValue: unknown,
): Readonly<{ current: FeatureArtifactLineage; predecessor: FeatureArtifactLineage }> {
  const current = validateFeatureArtifactLineage(currentValue)
  const predecessor = validateFeatureArtifactLineage(predecessorValue)
  verifyPredecessorLink({
    label: "featureArtifactLineage",
    currentFeatureKey: current.featureKey,
    predecessorFeatureKey: predecessor.featureKey,
    currentRevision: current.artifactRevision,
    predecessorRevision: predecessor.artifactRevision,
    claimedPredecessorIdentity: current.predecessorLineageIdentity,
    actualPredecessorIdentity: predecessor.lineageIdentity,
  })
  return Object.freeze({ current, predecessor })
}
