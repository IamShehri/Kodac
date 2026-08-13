import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import test from "node:test"

import {
  KDO_S1_SPEC_ARTIFACT_VERSION,
  KDO_S1_SPEC_KIT_DONOR_PROVENANCE,
  createSpecificationArtifact,
} from "../src/specification/contracts.ts"

const sha = (value: string) => createHash("sha256").update(value, "utf8").digest("hex")

test("S1 donor pin and deterministic specification identity", () => {
  assert.equal(KDO_S1_SPEC_ARTIFACT_VERSION, "kodac-spec-artifact-lineage-v1")
  assert.equal(KDO_S1_SPEC_KIT_DONOR_PROVENANCE.repository, "github/spec-kit")
  assert.equal(KDO_S1_SPEC_KIT_DONOR_PROVENANCE.sourceCommit, "e79fa25f3f465b1ce779f570ccacef7b379e9166")

  const input = {
    featureKey: "feature/demo",
    repositoryHead: "0123456789abcdef0123456789abcdef01234567",
    artifactRevision: 1,
    specificationContentIdentity: sha("spec-v1"),
  }
  assert.deepEqual(createSpecificationArtifact(input), createSpecificationArtifact(input))
})
