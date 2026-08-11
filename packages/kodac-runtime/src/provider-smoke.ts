import { randomUUID } from "node:crypto"
import { mkdir } from "node:fs/promises"
import { homedir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { OpenAICompatibleProvider } from "./model/openai-compatible.ts"
import { OpenAIResponsesProvider } from "./model/openai.ts"
import { ProviderRegistry, type ModelProvider } from "./model/provider.ts"
import { AgentTurnRunner } from "./model/turn.ts"
import { JsonlEventSink } from "./protocol/event.ts"
import { RuntimeOrchestrator } from "./runtime/orchestrator.ts"
import { RuntimeSession } from "./session/session.ts"
import { ToolRegistry } from "./tools/registry.ts"

interface SmokeArgs { provider: "openai" | "openai-compatible"; model: string; prompt: string; evidenceDir?: string; json: boolean }

function parse(argv: string[]): SmokeArgs {
  let provider: SmokeArgs["provider"] = "openai"
  let model = ""
  let prompt = "Reply with exactly KODAC_PROVIDER_OK."
  let evidenceDir: string | undefined
  let json = false
  for (let index = 0; index < argv.length; index++) {
    const token = argv[index]
    if (token === "--json") { json = true; continue }
    if (token === "--provider" || token === "--model" || token === "--prompt" || token === "--evidence-dir") {
      const value = argv[++index]
      if (!value) throw new Error(`Missing value for ${token}`)
      if (token === "--provider") {
        if (value !== "openai" && value !== "openai-compatible") throw new Error("--provider must be openai or openai-compatible")
        provider = value
      } else if (token === "--model") model = value
      else if (token === "--prompt") prompt = value
      else evidenceDir = resolve(value)
      continue
    }
    throw new Error(`Unknown provider-smoke option: ${token}`)
  }
  if (!model.trim()) throw new Error("Usage: kodac provider-smoke --model <model-id> [--provider openai|openai-compatible] [--prompt <text>] [--evidence-dir <dir>] [--json]")
  return { provider, model, prompt, evidenceDir, json }
}

function providerFromEnv(name: SmokeArgs["provider"], env: NodeJS.ProcessEnv): ModelProvider {
  if (name === "openai") return new OpenAIResponsesProvider({ apiKey: env.OPENAI_API_KEY })
  return OpenAICompatibleProvider.fromEnv(env, { stream: true })
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
  providers.register(providerFromEnv(args.provider, env))
  const runner = new AgentTurnRunner(providers, tools, orchestrator, session)
  let streamed = false

  await session.start({ workspace: process.cwd(), command: "provider-smoke", runtimeSlice: "k2-s8b" })
  try {
    const result = await runner.run({ provider: args.provider, model: args.model, messages: [{ role: "user", content: args.prompt }] }, {
      onStreamEvent(event) {
        if (!args.json && event.type === "text_delta") { streamed = true; process.stdout.write(event.text) }
      },
    })
    await session.complete({ mode: "model_turn", provider: args.provider, model: args.model })
    if (args.json) {
      process.stdout.write(`${JSON.stringify({ status: "PASS", provider: args.provider, model: args.model, assistant: result.assistant, metadata: result.metadata, evidence: { events: eventPath } })}\n`)
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
  runProviderSmoke(process.argv.slice(2)).then((code) => { process.exitCode = code }, (error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}
