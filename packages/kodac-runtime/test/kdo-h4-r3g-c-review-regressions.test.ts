import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const SOURCE = readFileSync(new URL("../src/trust/sandbox-observer-gvisor-network.ts", import.meta.url), "utf8")

test("H4-R3G-C uRPC response buffering is linear-copy bounded", () => {
  assert.doesNotMatch(SOURCE, /Buffer\.concat\(/)
  assert.match(SOURCE, /const responseBuffer = Buffer\.allocUnsafe\(KDO_H4_R3G_C_LIMITS\.maxResponseBytes\)/)
  assert.match(SOURCE, /chunk\.copy\(responseBuffer, total\)/)
  assert.match(SOURCE, /const received = responseBuffer\.subarray\(0, total\)/)
})

test("H4-R3G-C response timeout starts only after the Unix socket connects", () => {
  const connectTimerStart = SOURCE.indexOf("const connectTimer = setTimeout")
  const connectHandlerStart = SOURCE.indexOf('socket.once("connect"')
  const rpcTimerStart = SOURCE.indexOf("rpcTimer = setTimeout")
  const requestWrite = SOURCE.indexOf("socket.write(REQUEST_BYTES)")

  assert.ok(connectTimerStart >= 0)
  assert.ok(connectHandlerStart > connectTimerStart)
  assert.ok(rpcTimerStart > connectHandlerStart)
  assert.ok(requestWrite > rpcTimerStart)
  assert.doesNotMatch(SOURCE.slice(connectTimerStart, connectHandlerStart), /rpcTimeoutMs/)
})
