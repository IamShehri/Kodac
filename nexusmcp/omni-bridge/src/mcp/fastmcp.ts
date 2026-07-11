// Minimal FastMCP stub for OmniBridge MCP server
// Replace with real MCP SDK once wired up.
// This stub lets the code compile and provides the basic tool dispatch surface.

export interface ToolOpts<Params = any, Result = any> {
  name: string;
  description: string;
  parameters: any;
  outputSchema?: any;
}

export class FastMCP {
  private name: string;
  private version: string;
  private tools: Map<string, { handler: (args: any, extra: any) => Promise<any>; opts: ToolOpts }> = new Map();

  constructor(opts: { name: string; version: string }) {
    this.name = opts.name;
    this.version = opts.version;
  }

  addTool(opts: ToolOpts, handler: (args: any, extra: any) => Promise<any>): void {
    this.tools.set(opts.name, { handler, opts });
  }

  async handleRequest(req: unknown): Promise<any> {
    // Parsed MCP JSON-RPC request expected: { jsonrpc, method, params, id }
    const r = req as any;
    if (!r || r.jsonrpc !== '2.0') {
      return { jsonrpc: '2.0', id: r?.id ?? null, error: { code: -32600, message: 'Invalid Request' } };
    }

    if (r.method === 'tools/call') {
      const toolName = r.params?.name;
      const tool = this.tools.get(toolName);
      if (!tool) {
        return { jsonrpc: '2.0', id: r.id, error: { code: -32601, message: `Tool not found: ${toolName}` } };
      }
      try {
        const result = await tool.handler(r.params?.arguments ?? {}, r.params);
        return { jsonrpc: '2.0', id: r.id, result };
      } catch (err: any) {
        return {
          jsonrpc: '2.0',
          id: r.id,
          error: { code: -32603, message: 'Tool error', data: { message: err?.message ?? 'Unknown error' } },
        };
      }
    }

    return { jsonrpc: '2.0', id: r.id, result: { tools: Array.from(this.tools.values()).map((t) => t.opts) } };
  }
}
