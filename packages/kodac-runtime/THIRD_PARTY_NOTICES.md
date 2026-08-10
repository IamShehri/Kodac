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
