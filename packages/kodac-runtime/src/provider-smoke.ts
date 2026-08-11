import { randomUUID } from "node:crypto"
import { homedir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { mkdir } from "node:fs/promises"
import { OpenAICompatibleProvider } from "./model/openai-compatible.ts"
import { ProviderRegistry } from "./model/provider.ts"
import { AgentTurnRunner } from "./model/turn.ts"
import { JsonlEventSink } from "./protocol/event.ts"
import { RuntimeOrchestrator } from "./runtime/orchestrator.ts"
import { RuntimeSession } from "./session/session.ts"
import { ToolRegistry } from "./tools/registry.ts"

interface SmokeArgs {
  model: string
  prompt: string
  evidenceDir?: string
  json: boolean
}

function parse(argv: string[]): SmokeArgs {
  let model = ""
  let prompt = "Reply with exactly KODAC_PROVIDER_OK."
  let evidenceDir: string | undefined
  let json = false
  for (let index = 0; index < argv.length; index++) {
    const token = argv[index]
    if (token === "--json") {
      json = true
      continue
    }
    if (token === "--model" || token === "--prompt" || token === "--evidence-dir") {
      const value = argv[++index]
      if (!value) throw new Error(`Missing value for ${token}`)
      if (token === "--model") model = value
      else if (token === "--prompt") prompt = value
      else evidenceDir = resolve(value)
      continue
    }
    throw new Error(`Unknown provider-smoke option: ${token}`)
  }
  if (!model.trim()) throw new Error("Usage: kodac provider-smoke --model <model-id> [--prompt <text>] [--evidence-dir <dir>] [--json]")
  return { model, prompt, evidenceDir, json }
}

export async function runProviderSmoke(argv: string[], env: NodeJS.ProcessEnv = process.env): Promise<number> {
  const args = parse(argv)
  const sessionId = randomUUID()
  const root = args.evidenceDir ?? join(homedir(), ".kodac", "provider-smoke")
  const eventPath = join(root, sessionId, "events.jsonl")
  await mkdir(dirname(eventPath), { recursive: true })
  const session = new RuntimeSession(new JsonlEventSink(eventPath), sessionId)
  const tools = new ToolRegistry()
  const orchestrator = new RuntimeOrchestrator(tools, session)
  const providers = new ProviderRegistry()
  providers.register(OpenAICompatibleProvider.fromEnv(env))
  const runner = new AgentTurnRunner(providers, tools, orchestrator, session)
  let streamed = false

  await session.start({ command: "provider-smoke", runtimeSlice: "k2-s8b", provider: "openai-compatible", model: args.model })
  try {
    const result = await runner.run(
      {
        provider: "openai-compatible",
        model: args.model,
        messages: [{ role: "user", content: args.prompt }],
      },
      {
        onStreamEvent(event) {
          if (!args.json && event.type === "text_delta") {
            streamed = true
            process.stdout.write(event.text)
          }
        },
      },
    )
    await session.complete({
      mode: "provider_smoke",
      provider: "openai-compatible",
      model: args.model,
      attempts: result.metadata?.attempts,
      usage: result.metadata?.usage,
    })
    if (args.json) {
      process.stdout.write(`${JSON.stringify({
        status: "PASS",
        provider: "openai-compatible",
        model: args.model,
        assistant: result.assistant,
        metadata: result.metadata,
        evidence: { events: eventPath },
      })}\n`)
    } else {
      if (streamed) process.stdout.write("\n")
      else process.stdout.write(`${result.assistant}\n`)
      process.stdout.write(`Provider smoke: PASS\nEvidence: ${eventPath}\n`)
    }
    return 0
  } catch (error) {
    await session.fail(error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runProviderSmoke(process.argv.slice(2)).then(
    (code) => { process.exitCode = code },
    (error) => {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
      process.exitCode = 1
    },
  )
}
