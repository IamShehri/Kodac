# Third-Party Notices — Kodac Runtime K2

## OpenCode patch engine adaptation

Portions of `src/edit/patch.ts` are adapted from:

- Project: OpenCode
- Repository: https://github.com/anomalyco/opencode
- Pinned commit: `3a90639cb57619a21e59f544b3e8d23ffed56f48`
- Source path: `packages/opencode/src/patch/index.ts`
- License: MIT
- Upstream copyright: Copyright (c) 2025 opencode

Kodac modifications include removal of OpenCode Effect/FSUtil/BOM dependencies, a Kodac-owned workspace filesystem boundary, stricter malformed-patch handling, duplicate-path rejection, and integration with the Kodac ExecutionGateway/receipt path.

### MIT License

Copyright (c) 2025 opencode

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## DeepSeek Harness Landlock launcher adaptation

Portions of `native/landlock-run.c` are adapted from:

- Project: DeepSeek Harness / node-addon-landlock-run
- Repository: https://github.com/deepseek-ai/deepseek-harness
- Pinned commit: `47f943859bef60e4160492346772ded9b24f765a`
- Source path: `native/landlock-run/packages/entry/src/main.c`
- Source blob: `af0cc2a988b219a699f35aeb911dbd66f1946fd9`
- Profile reference path: `packages/sandbox/sandbox-local/src/profiles.ts`
- Profile reference blob: `5b76390319c9b0729cb64f3213e714ff2df702d7`
- License path: `native/landlock-run/LICENSE`
- License blob: `8187059c9a2f14902c3eb5ab18d207906794f3b3`
- License: BSD 3-Clause
- Upstream copyright: Copyright (c) 2026, node-addon-landlock-run contributors

Kodac modifications include an explicit `kodac-linux-landlock-fs-v1` claim-set boundary, machine-readable functional probe output with observed ABI, Kodac-specific failure prefixes, and separation between the isolated native primitive and the non-executing TypeScript adapter. H4-R2B does not wire this launcher into Kodac production execution.

### BSD 3-Clause License

Copyright (c) 2026, node-addon-landlock-run contributors

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors
   may be used to endorse or promote products derived from this software
   without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

## HKUDS DeepCode tool-result pruning adaptation

Portions of `src/agent/tool-result-pruning.ts` are behaviorally ported and adapted from:

- Project: DeepCode
- Repository: https://github.com/HKUDS/DeepCode
- Pinned commit: `287510fbf6820147a48adf79f7fd86b0ed1afe92`
- Pinned tree: `7f44b320f86d04d4315242fabc74f1b325829be8`
- Source path: `core/agent_runtime/pruner.py`
- Source blob: `dae72f4439d79a2e8a31a85de69908ef87114ec9`
- Root license blob: `b3ba37ce442298d5bdec96e2e52a8a812a25f123`
- License: MIT
- Upstream copyright: Copyright (c) 2025 Data Intelligence Lab@HKU

Kodac modifications include a TypeScript implementation, strict reuse of canonical H2 model-visible message validation, UTF-8 byte rather than character-count limits, deterministic structural SHA-256 identities for policies/changes/results, hostile structural-input rejection, and an explicit R1A boundary that leaves the agent loop and H2 session/event projection unchanged.

### MIT License

Copyright (c) 2025 Data Intelligence Lab@HKU

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## HKUDS DeepCode consecutive repeat-call signal adaptation

Portions of `src/agent/repeat-call-signal.ts` are behaviorally ported and adapted from:

- Project: DeepCode
- Repository: https://github.com/HKUDS/DeepCode
- Pinned commit: `287510fbf6820147a48adf79f7fd86b0ed1afe92`
- Pinned tree: `7f44b320f86d04d4315242fabc74f1b325829be8`
- Primary source path: `core/agent_runtime/repeat_guard.py`
- Primary source blob: `37c24894cdbe7e647bdcbe45d055a1fd48b30777`
- Runner integration reference: `core/agent_runtime/runner.py`
- Runner integration blob: `645ab82f768214cce0794984c4bc9b92b099ce5a`
- Root license blob: `b3ba37ce442298d5bdec96e2e52a8a812a25f123`
- License: MIT
- Upstream copyright: Copyright (c) 2025 Data Intelligence Lab@HKU

Kodac ports only the consecutive same-tool/same-input chain concept. The implementation replaces DeepCode's mutable tracker and permissive argument stringification with an explicit serialized state transition, strict JSON/JCS-compatible canonicalization, bounded UTF-8 inputs, domain-separated SHA-256 structural identities, and evidence-safe structural signals. DeepCode's model-visible reminder text, raw argument preview, runner integration, and hard-stop semantics are not ported.

The MIT license text and upstream copyright notice reproduced in the immediately preceding HKUDS DeepCode section apply to this adaptation as well.

## HKUDS DeepCode guarded tool-pipeline contract adaptation

Portions of `src/agent/guarded-tool-pipeline.ts` are an architectural/behavioral port of selected hook-fold and runner contract ideas from:

- Project: DeepCode
- Repository: https://github.com/HKUDS/DeepCode
- Pinned commit: `287510fbf6820147a48adf79f7fd86b0ed1afe92`
- Pinned tree: `7f44b320f86d04d4315242fabc74f1b325829be8`
- Runner reference: `core/agent_runtime/runner.py`
- Runner blob: `645ab82f768214cce0794984c4bc9b92b099ce5a`
- Lifecycle reference: `core/agent_runtime/hook.py`
- Lifecycle blob: `b0bbe5ea880f8688306a348ca72f2a29d4ffc9cc`
- Matcher reference: `core/harness/hooks/events.py`
- Matcher blob: `ed393156d9e53d543220387fa4421785a0ce0b83`
- Fold reference: `core/harness/hooks/engine.py`
- Fold blob: `26f66a1199057077372e26d831f58e7d54bf5d89`
- Root license blob: `b3ba37ce442298d5bdec96e2e52a8a812a25f123`
- License: MIT
- Upstream copyright: Copyright (c) 2025 Data Intelligence Lab@HKU

Kodac deliberately does not port DeepCode's shell-command hook execution, workspace-discovered executable callbacks, permission-hook allow authority, completion-order last-writer rewrite semantics, post-hook evidence mutation, or stop-hook continuation authority. R3A reduces inert serialized declarative decisions through a deterministic monotonic state transition: tools may only be removed, calls may only be blocked, and same-tool/same-capability input rewrites always create new structural identities and require later K2 re-evaluation before any active execution integration.

The MIT license text and upstream copyright notice reproduced in the earlier HKUDS DeepCode section apply to this adaptation as well.

## wrtnlabs/agentica validation-feedback design reference

R3A also studies the validation-feedback design described by:

- Project: Agentica
- Repository: https://github.com/wrtnlabs/agentica
- Pinned commit: `dc91f4307a3f2ee25e1ee07cf48777fcd13b6b0d`
- Reference path: `website/content/docs/concepts/function-calling.mdx`
- Reference blob: `9e5577511d65369e8439a958683b81e541dc87ee`
- License: MIT
- LICENSE blob: `886b7e88682164a5a22e609120c9f96c9ea57216`
- Copyright: Copyright (c) 2025 Wrtn Technologies
- Intake mode: STUDY_ONLY

No Agentica runtime source or dependency is copied or imported by H5-R3A. Kodac adopts only the design lesson that argument/schema validation failures can improve recovery feedback. In Kodac's authority model, validation failure may narrow/block a future tool call, while validation success never grants permission and can never bypass K2.