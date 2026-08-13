import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import test from "node:test"

import {
  KDO_S1_SPEC_ARTIFACT_VERSION,
  KDO_S1_SPEC_KIT_DONOR_PROVENANCE,
  createFeatureArtifactLineage,
  createPlanArtifact,
  createSpecificationArtifact,
  createTaskSetArtifact,
  validateSpecificationArtifact,
  verifyFeatureArtifactLineage,
  verifySpecificationArtifactPredecessor,
} from "../src/specification/contracts.ts"

const sha = (value: string) => createHash("sha256").update(value, "utf8").digest("hex")
const head = "0123456789abcdef0123456789abcdef01234567"

function spec(overrides: Partial<Parameters<typeof createSpecificationArtifact>[0]> = {}) {
  return createSpecificationArtifact({
    featureKey: "feature/demo",
    repositoryHead: head,
    artifactRevision: 1,
    specificationContentIdentity: sha("spec-v1"),
    ...overrides,
  })
}

test("S1 donor pin and deterministic specification identity", () => {
  assert.equal(KDO_S1_SPEC_ARTIFACT_VERSION, "kodac-spec-artifact-lineage-v1")
  assert.equal(KDO_S1_SPEC_KIT_DONOR_PROVENANCE.repository, "github/spec-kit")
  assert.equal(KDO_S1_SPEC_KIT_DONOR_PROVENANCE.sourceCommit, "e79fa25f3f465b1ce779f570ccacef7b379e9166")
  assert.equal(KDO_S1_SPEC_KIT_DONOR_PROVENANCE.license, "MIT")
  assert.equal(KDO_S1_SPEC_KIT_DONOR_PROVENANCE.intakeMode, "PORT")
  assert.deepEqual(spec(), spec())
})

test("specification to plan to task-set lineage remains exact", () => {
  const specification = spec()
  const plan = createPlanArtifact({ specification, planContentIdentity: sha("plan-v1"), artifactRevision: 1 })
  const taskSet = createTaskSetArtifact({ specification, plan, taskSetContentIdentity: sha("tasks-v1"), artifactRevision: 1 })
  const lineage = createFeatureArtifactLineage({ specification, plan, taskSet, artifactRevision: 1 })
  const verified = verifyFeatureArtifactLineage({ specification, plan, taskSet, lineage })

  assert.equal(verified.plan?.specificationArtifactIdentity, specification.specificationArtifactIdentity)
  assert.equal(verified.taskSet?.planArtifactIdentity, plan.planArtifactIdentity)
  assert.equal(verified.lineage.taskSetArtifactIdentity, taskSet.taskSetArtifactIdentity)
})

test("cross-repository artifact binding fails closed", () => {
  const specification = spec()
  const otherSpecification = spec({ repositoryHead: "fedcba9876543210fedcba9876543210fedcba98" })
  const otherPlan = createPlanArtifact({ specification: otherSpecification, planContentIdentity: sha("other-plan"), artifactRevision: 1 })
  assert.throws(
    () => createTaskSetArtifact({ specification, plan: otherPlan, taskSetContentIdentity: sha("tasks"), artifactRevision: 1 }),
    /repository binding mismatch/,
  )
})

test("serialized specification rejects unknown fields and tampering", () => {
  const specification = spec()
  assert.throws(() => validateSpecificationArtifact({ ...specification, unexpected: true }), /unknown field/)
  assert.throws(
    () => validateSpecificationArtifact({ ...specification, specificationArtifactIdentity: "0".repeat(64) }),
    /derived fields mismatch/,
  )
})

test("malformed identities and revision bounds fail closed", () => {
  assert.throws(() => spec({ specificationContentIdentity: "not-a-sha" }), /SHA-256 identity/)
  assert.throws(() => spec({ artifactRevision: 1_000_000_001 }), /must be an integer/)
})

test("predecessor verification requires the actual immediate predecessor", () => {
  const first = spec()
  const second = spec({
    artifactRevision: 2,
    specificationContentIdentity: sha("spec-v2"),
    predecessorSpecificationArtifactIdentity: first.specificationArtifactIdentity,
  })

  assert.equal(
    verifySpecificationArtifactPredecessor(second, first).predecessor.specificationArtifactIdentity,
    first.specificationArtifactIdentity,
  )
  assert.throws(
    () => verifySpecificationArtifactPredecessor(second, spec({ featureKey: "feature/other" })),
    /feature lineage mismatch/,
  )
})

test("published schema mirrors the bounded structural contract", () => {
  const schemaPath = new URL("../../../schema/kdo-spec-artifact-lineage.schema.json", import.meta.url)
  const schema = JSON.parse(readFileSync(schemaPath, "utf8")) as Record<string, any>
  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema")
  assert.equal(schema.$defs.spec.additionalProperties, false)
  assert.equal(schema.$defs.plan.additionalProperties, false)
  assert.equal(schema.$defs.tasks.additionalProperties, false)
  assert.equal(schema.$defs.lineage.additionalProperties, false)
  assert.equal(schema.$defs.rev.minimum, 1)
  assert.equal(schema.$defs.rev.maximum, 1_000_000_000)
  assert.equal(schema.$defs.spec.properties.version.const, KDO_S1_SPEC_ARTIFACT_VERSION)
  assert.deepEqual(schema.oneOf.map((entry: { $ref: string }) => entry.$ref), [
    "#/$defs/spec",
    "#/$defs/plan",
    "#/$defs/tasks",
    "#/$defs/lineage",
  ])
})

test("S1 production module imports only deterministic crypto support", () => {
  const sourcePath = new URL("../src/specification/contracts.ts", import.meta.url)
  const source = readFileSync(sourcePath, "utf8")
  const imports = source.match(/^import .*$/gm) ?? []
  assert.deepEqual(imports, ['import { createHash } from "node:crypto"'])
})
