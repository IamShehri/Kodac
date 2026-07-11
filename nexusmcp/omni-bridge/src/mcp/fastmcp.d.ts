export class FastMCP {
  constructor(opts: { name: string; version: string });
  addTool(opts: any, handler: any): void;
  handleRequest(req: unknown): Promise<any>;
}
