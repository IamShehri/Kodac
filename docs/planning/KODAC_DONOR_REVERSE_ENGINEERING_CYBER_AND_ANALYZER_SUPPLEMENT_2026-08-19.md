# Kodac Donor Reverse Engineering — Cyber and Analyzer Supplement

Status: **RESEARCH CANDIDATE / PLANNING ONLY / NO IMPLEMENTATION OR DONOR-INTAKE AUTHORIZATION**  
Date: 2026-08-19  
Canonical Kodac base: `04430d4e9e4d91c15ccb5f3f4dbfc9c59f7afa1e`  
Planning PR: `#121`

## 0. Purpose and authority

This supplement extends `KODAC_DONOR_REVERSE_ENGINEERING_AND_CODE_ACQUISITION_REPORT_2026-08-19.md` with a deeper source-level pass over Cyber Reasoning Systems, progressive vulnerability-analysis systems, fuzzing orchestration, and deterministic analyzer/supply-chain providers.

It does not authorize implementation, dependency addition, donor-code copy, H6, the Cyber Mesh, H4-R3G-F, or any blocking review gate. Repository truth and accepted Kodac trust contracts remain authoritative.

The founder reports permission to use donor code. Every actual intake still requires an exact-pin selected-file/symbol provenance record, dependency/third-party boundary audit, security review, tests, hostile tests, and explicit authorization.

---

# 1. Executive conclusions

The second source-level pass adds four important architectural conclusions.

## 1.1 Cyber should expose a method-provider seam, not hard-code every security engine

The strongest CRS systems do not support a “one Cyber Agent owns everything” design. The more robust shape is:

```text
Cyber Director
      │
      ├── requests method A: static/dataflow
      ├── requests method B: fuzzing
      ├── requests method C: concolic/symbolic
      ├── requests method D: semantic/LLM
      └── requests method E: exploit/reproducer
                │
                ▼
         CyberMethodProvider
                │
                ▼
          artifact exchange
                │
      ┌─────────┼──────────┐
      ▼         ▼          ▼
   seeds    candidates    PoVs
      │         │          │
      └─────────┼──────────┘
                ▼
       closed Kodac validators
                ▼
           evidence ledger
```

Atlantis-Java and OSS-CRS both reinforce this pattern from different levels: Atlantis composes several concrete discovery/proving techniques around shared state, while OSS-CRS treats a complete Cyber Reasoning System as an isolated provider with uniform artifact exchange and resource/model budgets.

## 1.2 Prover lifetime must not be owned by the requesting model worker

FuzzingBrain V2 documents concrete orchestration failures where global fuzzing and crash monitoring were tied to worker lifetime. Worker completion could shut down fuzzing before the intended stop condition, and cleanup ordering could drop a final crash sweep.

Kodac should therefore make this a hard contract:

```text
AGENT REQUESTS EXPERIMENT
        │
        ▼
Cyber Experiment Runtime OWNS experiment
        │
        ├── fuzzer
        ├── crash monitor
        ├── reproducer
        └── artifact collector

agent/session completion
!=
experiment completion
```

The experiment runtime, not the model session, determines completion from trusted stop conditions, timeout/resource policy, cancellation authority, and artifact closure.

## 1.3 Progressive context retrieval is valuable, but never substitute model memory for source evidence

Vulnhuntr demonstrates a practical context-economy loop: identify likely network-facing files, run semantic analysis, let the model request named symbols plus a reference line, retrieve definitions, and iterate only when new context is requested.

Kodac should adapt that **on-demand context loop**, but explicitly reject three donor assumptions:

- tests/docs are not globally disposable context;
- a regex-derived entry point is a routing hypothesis, not a fact;
- third-party behavior cannot be filled from model memory when technical evidence depends on it.

## 1.4 Analyzer normalization must be lossless and evidence-preserving

The deterministic analyzer ecosystem already exposes rich tool-specific semantics. Kodac must not flatten them too early into a generic severity/comment object.

Examples:

- OSV-Scanner preserves package/source grouping, vulnerability aliases/groups, exploitability signals, optional call-state analysis, and VEX-style “vulnerable code not in execute path” information;
- Grype records the vulnerability, artifact, related vulnerability metadata, plus `MatchDetails` explaining matcher type, what attributes were searched, and what was found;
- Gitleaks records rule, range, match, captured secret, source file, symlink path, commit, entropy, author/message/tags, and a fingerprint, and provides explicit redaction;
- Trivy has a native typed report and SARIF projection;
- OpenSSF Scorecard binds results to repository commit and Scorecard implementation commit, preserves check/raw/finding data, and supports JSON, SARIF, in-toto, probe and raw formats;
- Syft provides multiple SBOM encoders and attestation-related output surfaces.

Therefore the future contract should be:

```text
Analyzer native result
        │
        ▼
BoundedAnalyzerProcess / Provider
        │
        ├── raw artifact digest
        ├── tool identity/version
        ├── exact reviewed head
        ├── invocation/config digest
        └── resource/exit receipt
        │
        ▼
AnalyzerResultNormalizer
        │
        ├── normalized candidate facts
        └── native evidence attachment retained
        │
        ▼
Candidate Finding Bus
```

Normalization is never evidence promotion by itself.

---

# 2. Exact research pins added by this supplement

| Source | Exact research pin | Role | Acquisition disposition |
|---|---|---|---|
| `Team-Atlanta/aixcc-afc-atlantis` | `8a2b41329515dcdbd201a106cd4f25a7569c1969` | AIxCC repository/deployment architecture lineage | `REFERENCE / LOCATOR` |
| `Team-Atlanta/atlantis-java` | `943c07bd08db5b3eeed6dace3a7c0ee1659ceab7` | multi-method Java vulnerability discovery/exploitation CRS | `HIGH_VALUE_METHOD_REFERENCE + SELECTIVE_ADAPT` |
| `o2lab/FuzzingBrain-V2` | `0281e0bc5348dddb6e4cdb4824f79ae5a60d1de3` | LLM + fuzzing orchestration and lifecycle lessons | `ALGORITHM / FAILURE-MODE ADAPT` |
| `protectai/vulnhuntr` | `ead88c5adba4279dae5c56d65124c530a9a1c5ae` | progressive semantic context retrieval | `ALGORITHM_ONLY / CONTEXT_PROVIDER_REFERENCE` |
| `ossf/oss-crs` | `0061473c1afd37c93a00483e0aebc704b4897609` | isolated CRS composition/artifact exchange/resource budget | `PROTOCOL + ORCHESTRATION ADAPT` |
| `github/codeql` | `05c40eafe6fb4cc88c764703a855714c281bf1e1` | dataflow/taint/path analyzer/query source | `OUT_OF_PROCESS_ADAPTER` |
| `semgrep/semgrep` | `3f58c662ec05a8dbb67d4779cfbca1be8396d738` (`develop`) | pattern/taint/diff analyzer | `OUT_OF_PROCESS_ADAPTER` |
| `google/osv-scanner` | `c84fa4568f2526d0333e9a914ea8a0a5f74ad68b` | dependency/vulnerability/VEX/call-state provider | `LIBRARY_OR_PROCESS_PROVIDER` |
| `aquasecurity/trivy` | `dcbadb7b15076c405ce7d59f04cde9991b90da22` | vulnerability/misconfiguration/secret/SBOM scanning | `OUT_OF_PROCESS_ADAPTER` |
| `anchore/syft` | `360dbc04aa20b74a3f3ac19d30ee85bda0c076cc` | SBOM provider | `LIBRARY_OR_PROCESS_PROVIDER` |
| `anchore/grype` | `ffbca561d576c584b621f5421616337cad013d90` | package vulnerability matcher | `LIBRARY_OR_PROCESS_PROVIDER` |
| `gitleaks/gitleaks` | `b58d3f102cf3a2c84cb7f923d05c25c9b1aed84b` | secret-candidate detector | `OUT_OF_PROCESS_ADAPTER` |
| `ossf/scorecard` | `d1fab88f54636ff366076edfc5c239f97b3c8e66` | repository supply-chain posture | `OUT_OF_PROCESS_ADAPTER / CONTEXT` |
| `facebook/infer` | `e327d4468c5d5e0984043096ee844944320e9ca1` | compositional static analysis | `OUT_OF_PROCESS_ADAPTER` |

These are research pins, not future intake pins. Every code intake must re-pin at authorization time.

---

# 3. Atlantis-Java — shared sinkpoint state and multi-method escalation

## 3.1 Correct repository targeting

`Team-Atlanta/aixcc-afc-atlantis` is useful for AIxCC lineage and deployment context, but the source-level implementation of interest is split into dedicated repositories. For Java, `Team-Atlanta/atlantis-java` is the relevant implementation target.

This matters for provenance discipline: architecture research must pin the implementation repository, not infer internal mechanics from a deployment/example repository.

## 3.2 Observed implementation architecture

The Java CRS describes sinkpoint-focused vulnerability detection using several complementary methods. Its `crs` layout exposes components including:

```text
javacrs_modules
  corpus/crash/sinkpoint/callgraph/CP metadata managers

jazzer and related fuzzing workers
static-analysis
codeql
concolic
llm-poc-gen
  Joern/path/LLM/sinkpoint input generation
expkit
deepgen
dictgen
```

The architectural value is the transition shape:

```text
sinkpoint candidate
      │
      ├── static/code query
      ├── concolic/path method
      ├── fuzzing
      └── semantic/LLM generation
              │
              ▼
      shared reachability/status
              │
              ▼
       seed reaches sink
              │
              ▼
      exploit/PoV stage
```

This is materially stronger than a scanner ensemble that merely concatenates findings. Methods share target state, and reaching a sink changes what work is worth doing next.

## 3.3 Kodac adaptation

Future Kodac Cyber should model a method artifact such as:

```text
SecurityTargetState {
  targetIdentity
  sourceSinkIdentity?
  reachabilityState
  methodObservations[]
  seedArtifacts[]
  crashArtifacts[]
  reproducerArtifacts[]
  lastUpdatedBy
}
```

But the state remains untrusted until validated. An Atlantis-style “reached” state from a method can route exploitation/reproducer work; it cannot by itself mint Kodac `REACHABLE` unless a qualified validator checks the path/artifact.

**Acquisition decision:** adapt shared method-state and escalation patterns; prefer integrating mature engines rather than transplanting an entire CRS runtime.

---

# 4. FuzzingBrain V2 — lifecycle failure modes as design requirements

## 4.1 Architecture observed

The current architecture document describes a system with MongoDB, Redis, Celery workers, a task processor, analyzer/dispatcher roles, per-worker `FuzzerManager`, global fuzzing, a crash monitor, suspicious-point agents, and PoV agents.

More important than the intended architecture are the failure modes documented in the source repository itself.

## 4.2 Failure modes

The documented system can stop global fuzzing too early because lifecycle is coupled to worker completion. A worker closing its manager can stop a global fuzzer/crash monitor even when the global fuzzing objective has not reached its intended stop condition.

Additional documented hazards include:

- per-worker manager ownership creating duplicate/incorrect global-fuzzer lifecycle;
- a final crash sweep ordered after removal of the watched directory;
- async event-loop lifetime interfering with a crash monitor.

## 4.3 Kodac invariant

Introduce a separate trusted lifecycle owner:

```text
CyberExperiment {
  experimentId
  requestedBySessionId
  reviewedHead
  methodProviderIdentity
  objective
  budget
  timeout
  terminationPolicy
  state
  artifactManifest
}
```

Rules:

1. the requesting agent may request or cancel only if policy grants it;
2. agent/session settlement does not imply experiment settlement;
3. experiment completion is decided by the experiment runtime from trusted conditions;
4. artifact finalization occurs before workspace/watch cleanup;
5. monitor lifetime is not accidentally scoped to an ephemeral event loop owned by an LLM worker;
6. restart recovery must distinguish `RUNNING`, `TERMINATING`, `FINALIZING`, `COMPLETE`, `FAILED`, and `STALE`.

This strengthens the earlier DeepSeek continuation lesson: **ownership of durable work belongs to a runtime service, not the provider that requested it.**

---

# 5. Vulnhuntr — progressive context retrieval without trusted semantics

## 5.1 Actual loop

The main process uses repository heuristics to find likely network-facing Python files, performs an initial LLM analysis, then—for each candidate vulnerability type—allows repeated secondary analysis.

The response schema includes requested context symbols with:

```text
name
reason
code_line
```

The implementation collects newly requested definitions and can iterate up to seven times, stopping when no new context is requested.

`SymbolExtractor` uses Jedi and a sequence roughly equivalent to:

```text
files containing requested code line
    ↓
file-local symbol search
    ↓
project search
    ↓
all-name/inference fallback
```

with special handling for instances, aliases, modules, and definition ranges.

## 5.2 What to adapt

This is a good algorithm for reducing initial model context:

```text
small suspicious surface
→ semantic hypothesis
→ explicit context request
→ symbol resolver
→ next reasoning turn
```

Kodac should expose that as a context service rather than baking it into one model prompt.

## 5.3 What to reject or strengthen

The donor implementation excludes tests/docs from its ordinary “relevant Python files” selection. Kodac cannot make that a global security rule: tests, examples, configuration and documentation may establish intended behavior, reveal attack paths, or contain malicious instructions that matter to the threat model.

The entry-point discovery uses regex/framework heuristics. Kodac should treat that as one router signal alongside language-native indexers, repository graph facts, framework adapters, and runtime evidence.

Most importantly, the symbol extractor substitutes a natural-language statement for third-party definitions telling the model to rely on prior knowledge of the external library. Kodac must reject this whenever the behavior is material to a finding. Required third-party semantics must come from pinned source, trusted documentation, modeled analyzer libraries, or a validator-backed contract.

The repository also does not expose a comparable deterministic validation/proof layer in this analysis loop. Model confidence and generated PoC text are therefore candidate material, not technical evidence.

**Acquisition decision:** `ALGORITHM_ONLY / CONTEXT_PROVIDER_REFERENCE`.

---

# 6. OSS-CRS — the strongest current CyberMethodProvider reference

## 6.1 Provider isolation model

OSS-CRS defines a standard orchestration framework for isolated Cyber Reasoning Systems. Its architecture separates:

```text
CRS Compose orchestrator
    prepare → build-target → run

individual CRS environments
    one or more containers per CRS

shared infrastructure
    model budget / storage / exchange services
```

Each CRS receives resource boundaries including CPU, memory and optional model budget. Each CRS has a private network plus controlled shared-infrastructure access.

## 6.2 Uniform artifact exchange

`libCRS` defines provider-neutral submission/fetch concepts for artifacts including:

```text
seed
PoV
bug-candidate
report
patch
diff
```

A useful authority detail is that CRS containers do not directly write to the shared exchange directory; a sidecar copies submitted artifacts into the exchange surface. Builder-side helpers cover operations such as patch build/test and PoV execution.

This is an important pattern for Kodac:

```text
method provider MAY submit artifact
method provider MAY NOT directly modify trusted evidence state
```

## 6.3 Budgets and model routing

OSS-CRS can issue per-CRS model credentials/budgets through a proxy, giving each isolated provider an independent dollar budget and logical-model routing.

Kodac should adapt the budget abstraction, but not require a single hosted proxy. A future `CyberMethodBudget` should support local and hosted providers uniformly.

## 6.4 Verification placement

The OSS-CRS architecture currently describes seed/PoV verification and deduplication as planned shared services. Kodac should place this boundary more strictly from the beginning:

```text
CyberMethodProvider
  submits PoV
       │
       ▼
UNTRUSTED artifact store
       │
       ▼
Kodac closed PoV/Reproducer Validator
       │
       ▼
validated evidence
```

A provider cannot validate its own proof.

## 6.5 Proposed contract

```text
CyberMethodProviderDescriptor {
  providerId
  version
  methods[]
  supportedLanguages[]
  supportedSanitizers[]
  requiredInputs[]
  requestedResources
  requestedNetwork
  requestedModels[]
  outputArtifactTypes[]
}
```

and:

```text
CyberArtifactEnvelope {
  artifactId
  reviewRunId
  experimentId
  reviewedHead
  providerIdentity
  type: seed | candidate | path | crash | pov | patch | report
  digest
  nativeMetadataDigest
  createdAt
  trust: UNTRUSTED_PROVIDER_OUTPUT
}
```

**Acquisition decision:** `PROTOCOL + ORCHESTRATION ADAPT`; evaluate CRS compatibility as an optional future provider interface rather than importing the whole framework into the trust kernel.

---

# 7. Analyzer fabric — common trust contract

## 7.1 BoundedAnalyzerProcess

External analyzers should run behind a narrow execution boundary, conceptually extending the hardened subprocess patterns observed in Zoo's DCG runner:

```text
BoundedAnalyzerRequest {
  analyzerIdentity
  analyzerVersionOrDigest
  reviewedHead
  workingSetManifestDigest
  configDigest
  requestedFilesystemScope
  requestedNetworkPolicy
  timeout
  maxOutputBytes
  maxMemory?
  maxCpu?
}
```

The trusted runner records:

```text
executable identity
arguments
cwd/materialization identity
environment allowlist
start/end
exit status
signal/timeout/overflow
stdout digest
stderr digest
native result artifact digest
resource observations
```

No analyzer gets ambient authority merely because it is deterministic.

## 7.2 AnalyzerResultNormalizer

The normalized envelope should be intentionally small and preserve the original artifact:

```text
AnalyzerObservation {
  observationId
  analyzerIdentity
  analyzerVersion
  reviewedHead
  class
  primaryLocation?
  relatedLocations[]
  nativeRuleId?
  nativeSeverity?
  nativeConfidence?
  nativeCategory?
  summary
  pathOrFlow?
  packageOrArtifactIdentity?
  fixMetadata?
  rawArtifactDigest
  invocationReceiptIdentity
  normalizationVersion
}
```

The normalizer does **not** decide `technicalEvidenceLevel`.

## 7.3 SARIF

SARIF should be one supported interoperability projection, not Kodac's internal source of truth. Tools with richer native output should retain that native artifact because normalization to SARIF can omit analyzer-specific semantics that later falsification or validation may need.

---

# 8. OSV-Scanner — dependency presence and exploitability signals must remain distinct

## 8.1 Source-level result construction

`buildVulnerabilityResults` builds package vulnerability results from scan inventory, groups results by source, preserves package metadata and vulnerability groups, computes severity information, carries exploitability signals, and can run source analysis.

The implementation can set experimental call-state information using exploitability signals such as `VulnerableCodeNotInExecutePath`.

This directly supports the Kodac evidence taxonomy:

```text
package/version match
!=
called/reachable vulnerable code
!=
reproduced vulnerability
```

## 8.2 Kodac mapping

Suggested normalized facts:

```text
DEPENDENCY_PRESENT
ADVISORY_MATCH
VEX_SIGNAL
CALL_PATH_SIGNAL
LICENSE_FINDING
```

None independently means `REPRODUCED`.

Even a call-state analyzer result should normally support `ANALYZED` or a candidate `REACHABLE` transition only through a validator qualified for that method.

**Acquisition decision:** `LIBRARY_OR_PROCESS_PROVIDER`; preserve OSV-native package/source/VEX/call-state metadata.

---

# 9. Grype + Syft — preserve inventory identity and match explanation

## 9.1 Syft

Syft should be treated primarily as an SBOM/inventory provider. Its format layer exposes multiple standardized encoder surfaces and tests around output behavior. Kodac should prefer consuming a pinned library or bounded process rather than recreating ecosystem package discovery.

SBOM output is evidence that the inventory process observed package/artifact identities under a specified materialization and configuration; it is not a vulnerability verdict.

## 9.2 Grype

Grype's JSON `Match` model includes:

```text
Vulnerability
RelatedVulnerabilities
MatchDetails[]
Artifact
```

`MatchDetails` explicitly records:

```text
Type
Matcher
SearchedBy
Found
Fix
```

This is high-value provenance for a dependency finding. Kodac should retain it rather than flattening every match to `CVE + severity`.

Suggested normalized structure:

```text
DependencyMatchObservation {
  inventoryArtifactIdentity
  packageIdentity
  vulnerabilityIdentity
  matcherIdentity
  searchedBy
  found
  suggestedFix?
  nativeArtifactDigest
}
```

Again:

```text
MATCHED VULNERABILITY
!=
REACHABLE
!=
EXPLOITABLE
```

**Acquisition decision:** Syft and Grype as library/process providers; do not clone their inventory/matcher engines.

---

# 10. Gitleaks — candidate detection, redaction, and fingerprinting

Gitleaks' `Finding` model preserves useful native information:

```text
RuleID / Description
line + column range
Match
Secret
File / SymlinkFile
Commit / Link
Entropy
Author / Email / Date / Message
Tags
Fingerprint
Fragment
```

It also includes explicit `Redact()` behavior that masks the secret in line/match/secret fields.

Kodac should adapt two principles:

1. **secret material must be redacted before model/context propagation by default**;
2. detector fingerprints are correlation hints, not trusted identity or liveness.

A Gitleaks hit should enter the Candidate Finding Bus as something like:

```text
SECRET_PATTERN_CANDIDATE
```

not `REPRODUCED_SECRET`.

Any optional credential-liveness test would be a separate, explicitly authorized network/credential operation with an independent validator and strict non-exfiltration policy; it should not be the default workflow.

**Acquisition decision:** `OUT_OF_PROCESS_ADAPTER`; selected redaction/fingerprint logic may be small-code adaptation candidates after audit.

---

# 11. Trivy — typed native result plus SARIF projection

Trivy exposes a native report model and a SARIF presenter with tests. It spans multiple classes such as package vulnerabilities, configuration findings and other target-specific results.

Kodac should therefore treat Trivy as one multi-capability analyzer provider, but keep the class and native-result distinctions.

Recommended use:

```text
Trivy native JSON artifact
      +
optional SARIF projection
      ↓
AnalyzerResultNormalizer
      ↓
class-specific candidate observations
```

Do not let a single scanner severity determine Kodac blocking policy.

**Acquisition decision:** `OUT_OF_PROCESS_ADAPTER`.

---

# 12. OpenSSF Scorecard — repository posture, not application vulnerability proof

The Scorecard `Result` explicitly binds:

```text
Repo name + CommitSHA
Scorecard version + CommitSHA
Checks[]
RawResults
Findings
Metadata
Config
```

Its output system supports default text, SARIF, JSON, in-toto, probe and raw forms.

This is valuable for:

- supply-chain/repository posture;
- exact-version provenance of the check implementation;
- structured policy/context signals;
- attestation/interchange design reference.

But aggregate score or a failed check is not application exploitability evidence.

Kodac should store Scorecard output as:

```text
RepositoryPostureObservation
```

and route relevant specialist review or policy requirements from it. It should not automatically become a product-code vulnerability finding.

A separate security lesson comes from the current Scorecard pin itself: its latest commit hardens archive extraction against oversized entries and ensures bounded copying/cleanup. Any Kodac analyzer/source-acquisition adapter that downloads or expands archives must treat archive contents as hostile and impose per-entry/aggregate size/path constraints.

**Acquisition decision:** `OUT_OF_PROCESS_ADAPTER / CONTEXT`.

---

# 13. CodeQL, Semgrep, and Infer — deep/static providers, not embedded authority

## 13.1 CodeQL

Kodac should integrate CodeQL as a method provider where users have the appropriate engine/tooling available. Query libraries, database construction, path/dataflow and SARIF results should feed the analyzer fabric.

Do not transplant or imply licensing for engine components merely from the `github/codeql` source repository. Preserve the established distinction between query/library source and the engine/tool distribution.

Recommended architecture:

```text
CodeQL database/query run
→ native/SARIF artifact
→ bounded invocation receipt
→ normalized dataflow/path observation
→ candidate finding / trusted validator as configured
```

## 13.2 Semgrep

The current `develop` pin demonstrates that scan mode and dependency-source-change state are meaningful semantics: the implementation distinguishes a diff scan whose dependency sources were not calculated, a diff where none changed, and a list of changed dependency sources.

Kodac should preserve scan scope/mode and dependency-change metadata in the invocation/result envelope rather than treating a Semgrep output as context-free.

OSS/proprietary capability boundaries must remain explicit per selected integration.

## 13.3 Infer

Infer is a large compositional-analysis engine and should initially be integrated out of process. Kodac gains more by preserving exact Infer version/configuration/result artifacts than by transplanting its analysis internals into TypeScript runtime code.

**Acquisition decisions:** all three `OUT_OF_PROCESS_ADAPTER` initially. Selected schemas/helpers can later be admitted only where they reduce adapter risk without importing an analyzer engine.

---

# 14. Analyzer trust and evidence ceilings

A useful initial policy matrix:

| Observation | Default ceiling before Kodac validation | Notes |
|---|---|---|
| syntax/pattern match | `UNVALIDATED` or `ANALYZED` by qualified validator | depends on rule semantics |
| package/advisory match | `ANALYZED` | presence is not reachability |
| SBOM package identity | `ANALYZED` inventory fact | exact materialization required |
| VEX “not affected” assertion | context/analysis | provenance and authority matter |
| static source→sink path | candidate `REACHABLE` | validator must establish semantics/assumptions |
| CodeQL/Joern path | candidate `REACHABLE` | path does not guarantee exploitability |
| secret regex/entropy hit | `UNVALIDATED`/`ANALYZED` candidate | never liveness by pattern |
| Scorecard check | repository posture | not application vulnerability evidence |
| fuzzer crash | strong dynamic candidate | replay/minimize/classify independently |
| sanitizer failure | strong dynamic candidate | exact build/environment identity required |
| PoV from CRS | `UNVALIDATED_PROVIDER_OUTPUT` | independent trusted replay required |
| independently replayed vulnerable behavior | `REPRODUCED` | exact Kodac definition applies |

The closed validator registry, not the analyzer adapter, defines which observations can support an evidence transition.

---

# 15. Analyzer provenance and replay contract

Every analyzer execution that may affect a finding should be replayable from a recorded manifest:

```text
AnalyzerExecutionManifest {
  analyzerId
  analyzerVersion
  executableOrImageDigest
  invocationArgs
  configurationDigest
  rulesetOrDatabaseDigest?
  reviewedHead
  materializationDigest
  inputArtifactDigests[]
  environmentIdentity
  networkPolicy
  resourceBudget
  startedAt
  completedAt
  exitStatus
  stdoutDigest
  stderrDigest
  outputArtifactDigests[]
}
```

For tools whose database/rules update independently of the binary, the data/rules digest is part of identity. “Same tool version” is insufficient if the vulnerability DB changed.

---

# 16. Security requirements for analyzer adapters

External analyzers are not intrinsically safe. The adapter fabric must assume:

- analyzers may parse malicious repository files;
- language/build extractors may execute repository-controlled build logic;
- downloaded databases/rules/images may be corrupted or stale;
- archive extraction may contain traversal or resource-exhaustion payloads;
- analyzer output may contain prompt injection, terminal escapes, oversized fields, malformed JSON/SARIF, or forged file locations;
- a compromised analyzer may attempt network exfiltration or credential access;
- result files may reference paths outside the materialized repository;
- a scanner may claim success while emitting incomplete output.

Required controls include:

```text
K2-approved invocation
minimal environment
no ambient credentials
bounded stdout/stderr
bounded result artifact size
path canonicalization
schema validation
result-count/resource sanity checks
network deny by default
pinned executable/image/database/rules identity
malformed output = fail loud
```

Analyzer result text is untrusted data and never prompt authority.

---

# 17. Cyber artifact state machine

The combined Atlantis/OSS-CRS/FuzzingBrain/VulnHunter evidence suggests a useful state model that remains separate from finding disposition:

```text
DISCOVERY ARTIFACT
  candidate / suspicious point / sink / advisory
        │
        ▼
METHOD ARTIFACT
  path / seed / static flow / generated test
        │
        ▼
DYNAMIC ARTIFACT
  crash / sanitizer observation / candidate PoV
        │
        ▼
REPRODUCER ARTIFACT
  bounded replay package
        │
        ▼
VALIDATED REPRODUCER
```

Artifacts are immutable and exact-head-bound. Finding evidence levels are derived only after qualified validators inspect the appropriate artifacts.

This avoids overloading one field such as `confidence` with discovery quality, reachability, exploitability, and proof.

---

# 18. Cross-source synthesis after the second pass

```text
                          KODAC CYBER
                              │
                        Cyber Director
                              │
                 ┌────────────┴────────────┐
                 │                         │
          Semantic specialists       Method providers
                 │                         │
        Vulnhuntr-style          ┌─────────┼──────────┐
        context-on-demand        │         │          │
                 │             static    fuzz      concolic
                 │             CodeQL   Atlantis    Atlantis
                 │             Joern    OSS-CRS     etc.
                 │             Semgrep
                 │                         │
                 └─────────────┬───────────┘
                               ▼
                         Artifact Exchange
                               │
                     untrusted immutable artifacts
                               │
                  ┌────────────┴─────────────┐
                  │                          │
             Falsification              Reproducer
             VulnHunter-style           trusted runtime
                  │                          │
                  └────────────┬─────────────┘
                               ▼
                         Closed Validators
                               ▼
                           Evidence
                               ▼
                         Adjudication
                               ▼
                           Done Gate
```

The method-provider architecture gives Kodac two advantages:

1. it can adopt new security engines without changing proof authority;
2. it can benchmark method combinations independently from model brands.

---

# 19. New acquisition candidates from this supplement

Candidates only; no intake authorization.

| Priority | Source | Candidate | Acquisition mode |
|---|---|---|---|
| A | OSS-CRS | artifact submit/fetch and provider isolation concepts | `PROTOCOL_ADAPT` |
| A | FuzzingBrain V2 | experiment-lifetime failure tests/invariants | `TEST_AND_LIFECYCLE_ADAPT` |
| A | Atlantis-Java | shared sinkpoint/method-state + escalation design | `ALGORITHM_AND_STATE_ADAPT` |
| A | Vulnhuntr | explicit iterative context-request loop | `ALGORITHM_ADAPT` |
| A | OSV-Scanner | package/VEX/call-state result modeling | `LIBRARY_OR_PROCESS_PROVIDER` |
| A | Grype | match explanation/provenance structure | `LIBRARY_OR_PROCESS_PROVIDER` |
| A | Gitleaks | redaction + finding metadata | `PROCESS_PROVIDER / SELECTIVE_CODE_ADAPT` |
| A | Scorecard | repo/tool commit-bound result + in-toto output reference | `PROCESS_PROVIDER / CONTEXT` |
| B | Trivy | native typed report + SARIF adapter | `PROCESS_PROVIDER` |
| B | Syft | SBOM encoders/inventory | `LIBRARY_OR_PROCESS_PROVIDER` |
| B | CodeQL | path/dataflow/SARIF provider | `OUT_OF_PROCESS_ADAPTER` |
| B | Semgrep | pattern/taint/diff provider | `OUT_OF_PROCESS_ADAPTER` |
| B | Infer | compositional analysis provider | `OUT_OF_PROCESS_ADAPTER` |

The common `BoundedAnalyzerProcess` and `CyberMethodProvider` contracts should be built before importing tool-specific logic into Kodac runtime.

---

# 20. Additions to the “do not inherit” list

21. Method/provider worker lifetime controlling prover/fuzzer lifetime.
22. Cleanup that destroys watched artifacts before a final collection sweep.
23. Third-party library semantics filled from model memory when technically material.
24. Global exclusion of tests/docs/examples from security context.
25. Regex entry-point discovery treated as authoritative attack-surface fact.
26. CRS/agent directly writing trusted evidence storage.
27. Provider self-verification of its own PoV or patch.
28. Analyzer database/rules drift omitted from invocation identity.
29. Scanner severity flattened directly into Kodac blocking severity.
30. SARIF used as the sole storage format when richer native output exists.
31. SBOM presence treated as exploitability.
32. VEX assertion treated as trusted fact without provenance/authority evaluation.
33. Secret detector output propagated to models without redaction.
34. Analyzer result paths trusted without workspace canonicalization.
35. Archive/database ingestion without path and size bounds.

---

# 21. Roadmap consequences

This supplement does not authorize phases, but it refines their ordering.

## Before general Cyber methods

Kodac should have:

- `ReviewRun` / child-session identity;
- `IsolatedWorkUnit`;
- `BoundedAnalyzerProcess`;
- immutable analyzer/native artifact storage with digests;
- `AnalyzerResultNormalizer`;
- exact-head freshness across all artifacts;
- validator registry and evidence transition contracts.

## Then deterministic providers

Start with high-signal bounded providers such as:

```text
Gitleaks
OSV-Scanner
Syft/Grype
Trivy
Semgrep
```

not because they are proof, but because they exercise the adapter/evidence boundary with comparatively deterministic contracts.

## Then deeper methods

Introduce:

```text
CodeQL / Joern / Infer
CyberMethodProvider
fuzzing / sanitizers
PoV/reproducer pipeline
```

with the Cyber experiment runtime owning lifecycle independently of model sessions.

## Then ensembles

Only after individual providers are measurable should the Director route combinations. Ensemble value must be measured as marginal recall/precision/proof yield per cost, not assumed from agent count.

---

# 22. Final recommendation

The reverse-engineering evidence now supports a sharper implementation principle:

> **Kodac should not own every analysis engine. Kodac should own the trusted contract that makes heterogeneous analysis engines safe, replayable, comparable, falsifiable, and capable of contributing to proof without becoming proof authorities themselves.**

The target system is therefore not a scanner bundle. It is:

```text
untrusted specialists
+
untrusted method providers
+
lossless deterministic analyzer adapters
+
immutable exact-head artifacts
+
independent falsification
+
closed validators
+
K2-bounded dynamic execution
+
adjudication
+
machine-consumable verdict
```

The most important new invariant from this supplement is:

```text
REQUESTER LIFETIME != EXPERIMENT LIFETIME
PROVIDER OUTPUT != VALIDATED EVIDENCE
NATIVE ANALYZER DETAIL MUST SURVIVE NORMALIZATION
```

This supplement stops at research and acquisition planning. No donor code is authorized for intake by this document.
