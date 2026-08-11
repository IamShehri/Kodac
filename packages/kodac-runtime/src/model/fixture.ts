import type { ModelProvider, ModelProviderRequest, ModelProviderResponse } from "./provider.ts"

export class FixtureModelProvider implements ModelProvider {
  readonly name = "fixture"
  private readonly responses: ModelProviderResponse[]

  constructor(responses: ModelProviderResponse[] = []) {
    this.responses = responses.map((response) => ({
      ...response,
      toolCalls: response.toolCalls.map((call) => ({ ...call })),
    }))
  }

  async generate(request: ModelProviderRequest): Promise<ModelProviderResponse> {
    const scripted = this.responses.shift()
    if (scripted) return scripted

    const lastUser = [...request.messages].reverse().find((message) => message.role === "user")
    return {
      assistant: `[fixture:${request.model}] ${lastUser?.content ?? ""}`,
      toolCalls: [],
      finishReason: "stop",
    }
  }
}
