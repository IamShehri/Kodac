import type { RuntimeSession } from "../session/session.ts"

export interface ToolContext {
  session: RuntimeSession
  signal?: AbortSignal
}

export interface RuntimeTool<TInput = unknown, TOutput = unknown> {
  readonly name: string
  readonly capability: string
  execute(input: TInput, context: ToolContext): Promise<TOutput>
}

export class ToolRegistry {
  private readonly tools = new Map<string, RuntimeTool>()

  register<TInput, TOutput>(tool: RuntimeTool<TInput, TOutput>): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool already registered: ${tool.name}`)
    }
    this.tools.set(tool.name, tool as RuntimeTool)
  }

  get<TInput, TOutput>(name: string): RuntimeTool<TInput, TOutput> {
    const tool = this.tools.get(name)
    if (!tool) throw new Error(`Unknown tool: ${name}`)
    return tool as RuntimeTool<TInput, TOutput>
  }

  list(): Array<{ name: string; capability: string }> {
    return [...this.tools.values()]
      .map((tool) => ({ name: tool.name, capability: tool.capability }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }
}
