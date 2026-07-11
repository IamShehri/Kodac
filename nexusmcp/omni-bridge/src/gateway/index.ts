import { buildServer } from './server.js';

async function main() {
  const app = await buildServer();
  const port = parseInt(process.env.PORT || '3000');

  try {
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`[OmniBridge] Gateway running on port ${port}`);
    console.log(`[OmniBridge] MCP endpoint: /mcp/v1`);
    console.log(`[OmniBridge] Health: /health`);
    console.log(`[OmniBridge] Metrics: /metrics`);
  } catch (err) {
    console.error('[OmniBridge] Fatal startup error:', err);
    process.exit(1);
  }
}

main();
