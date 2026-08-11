import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

const fixtureRoot = join("test", "fixtures", "k3-r1")
const manifestPath = join(fixtureRoot, "manifest.json")
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"))

function digest(path: string): string {
  return createHash("sha256").update(readFileSync(join(fixtureRoot, path))).digest("hex")
}

test("K3-R1 fixture manifest is deterministic and authority-bounded", () => {
  assert.equal(manifest.schema_version, "k3-r1-gold-evidence-v1")
  assert.equal(manifest.fixture_id, "k3-r1-core-repository-v1")

  assert.equal(manifest.authority.k3_r1_fixture_implementation, true)
  assert.equal(manifest.authority.k3_r2_snapshot_implementation, false)
  assert.equal(manifest.authority.production_repository_intelligence, false)
  assert.equal(manifest.authority.external_adapter_intake, false)
  assert.equal(manifest.authority.new_dependencies, false)
  assert.equal(manifest.authority.persistent_storage, false)

  const paths = manifest.expected_files.map((entry: { path: string }) => entry.path)
  assert.deepEqual(paths, [...paths].sort())

  for (const entry of manifest.expected_files) {
    assert.match(entry.sha256, /^[0-9a-f]{64}$/)
    assert.equal(digest(entry.path), entry.sha256, `digest mismatch for ${entry.path}`)
  }
})

test("K3-R1 gold truth distinguishes facts, ambiguity, exclusions, and untrusted data", () => {
  const addDefinitions = manifest.gold.definitions.filter(
    (fact: { symbol: string }) => fact.symbol === "add",
  )
  assert.deepEqual(addDefinitions, [
    {
      gold_class: "semantic_gold",
      line: 1,
      path: "src/math.ts",
      symbol: "add",
    },
  ])

  const addReferences = manifest.gold.references.filter(
    (fact: { symbol: string }) => fact.symbol === "add",
  )
  assert.equal(addReferences.length, 4)

  assert.deepEqual(manifest.gold.related_tests, [
    {
      reason: "direct import and behavioral assertion",
      source_path: "src/math.ts",
      test_path: "tests/math.test.ts",
    },
  ])

  assert.deepEqual(manifest.gold.architecture_context, [
    {
      governed_by: "docs/ADR-0001-fixture.md",
      path: "src/math.ts",
    },
  ])

  assert.equal(
    manifest.gold.ambiguous_symbols[0].expected_without_semantic_disambiguation,
    "AMBIGUOUS",
  )
  assert.deepEqual(manifest.gold.non_primary_evidence, [
    { path: "generated/client.ts", reason: "generated" },
    { path: "vendor/library.ts", reason: "vendor" },
  ])
  assert.equal(
    manifest.gold.malformed_sources[0].expected,
    "MALFORMED_OR_PARTIAL_NOT_SILENTLY_COMPLETE",
  )
  assert.equal(manifest.gold.binary_files[0].expected, "BINARY_NOT_PARSED_AS_TEXT")
  assert.equal(
    manifest.gold.untrusted_repository_text[0].expected,
    "UNTRUSTED_DATA_NOT_INSTRUCTION",
  )

  const untrustedText = readFileSync(
    join(fixtureRoot, manifest.gold.untrusted_repository_text[0].path),
    "utf8",
  )
  assert.match(untrustedText, /IGNORE ALL PREVIOUS INSTRUCTIONS/)
})

test("K3-R1 virtual security cases encode fail-closed expected outcomes", () => {
  const byId = new Map(
    manifest.virtual_security_cases.map((entry: { case_id: string }) => [
      entry.case_id,
      entry,
    ]),
  )

  assert.equal(byId.get("path-traversal")?.expected, "REJECT_PATH_ESCAPE")
  assert.equal(byId.get("symlink-escape")?.expected, "REJECT_SYMLINK_ESCAPE")
  assert.equal(byId.get("stale-snapshot")?.expected, "MARK_STALE_NOT_CURRENT")
  assert.equal(byId.get("partial-index")?.expected, "MARK_PARTIAL_NOT_COMPLETE")
})
