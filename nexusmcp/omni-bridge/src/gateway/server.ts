// OmniBridge — Fastify Gateway Server
// Wraps the MCP server with HTTP auth, audit logging, metrics, and middleware.

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { OmniBridgeFHIRClient } from '../fhir/client.js';
import { AuditLogger } from '../audit/logger.js';
import { AuthContext, verifyAuthToken } from '../auth/middleware.js';
import { RateLimiter } from '../utils/rate-limiter.js';
import { FastMCP } from '../mcp/fastmcp.js';

// @ts-ignore
const pino = (await import('pino')).default as any;

export type AsyncFastifyReply = {
  send: (payload: any) => Promise<void>;
};

export async function buildServer(): Promise<any> {
  const app = Fastify({ logger: false, genReqId: () => `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` });
  const config = getRuntimeConfig();

  const logger = pino({ level: config.logLevel || 'info' });

  await app.register(cors, { origin: true, credentials: true });

  const rateLimiter = new RateLimiter({ windowMs: 60000, max: 120 });

  const audit = new AuditLogger({ sink: 'console', retentionDays: 365 });

  const fhir = new OmniBridgeFHIRClient(
    { baseUrl: config.fhirBaseUrl, tenantId: 'default', authToken: config.fhirAuthToken, timeoutMs: 30000 },
    audit,
  );

  const mcp = new FastMCP({ name: 'OmniBridge', version: '0.1.0' });

  mcp.addTool(
    { name: 'fhir_capability', description: 'Return FHIR CapabilityStatement.', parameters: { type: 'object', properties: {} }, outputSchema: { type: 'object' } },
    async () => fhir.getCapabilityStatement(),
  );

  mcp.addTool(
    { name: 'fhir_patient_read', description: 'Read a Patient by ID.', parameters: { type: 'object', properties: { resourceType: { type: 'string', enum: ['Patient'] }, id: { type: 'string' } }, required: ['resourceType', 'id'] }, outputSchema: { type: 'object' } },
    async (args) => fhir.read(args.resourceType as string, args.id as string),
  );

  mcp.addTool(
    { name: 'fhir_observation_search', description: 'Search Observations.', parameters: { type: 'object', properties: { resourceType: { type: 'string', enum: ['Observation'] }, query: { type: 'object' } }, required: ['resourceType', 'query'] }, outputSchema: { type: 'object' } },
    async (args) => fhir.search(args.resourceType as string, args.query as Record<string, string>),
  );

  app.get('/health', async () => ({ status: 'ok', app: 'OmniBridge' }));

  app.get('/metrics', async () => ({ status: 'ok' }));

  app.all('/mcp/v1', async (req, reply) => {
    const r = req as any;
    try {
      const start = Date.now();
      const ip = String(r.ip || r.socket?.remoteAddress || 'unknown');
      let authContext: AuthContext;

      if (config.authProvider === 'mock') {
        authContext = { tenantId: 'default', userId: 'mock-user', scopes: ['*'], authMethod: 'mock', authenticatedAt: new Date().toISOString(), sessionId: 'mock-session' };
      } else {
        const header = r.headers['authorization'];
        if (!header?.startsWith('Bearer ')) return reply.status(401).send({ error: 'Missing authorization header' });
        const token = header.slice('Bearer '.length).trim();
        const context = await verifyAuthToken(token);
        if (!context) return reply.status(401).send({ error: 'Invalid token' });
        authContext = context;
      }

      const rl = await rateLimiter.check(`${authContext.tenantId}:${ip}`);
      if (!rl.allowed) return reply.status(429).send({ error: 'Rate limit exceeded', retryAfterMs: rl.resetMs });

      const body = typeof r.body === 'string' ? JSON.parse(r.body) : r.body;
      const result = await mcp.handleRequest({ ...body, authContext });

      await audit.log({
        action: 'mcp.request',
        tenantId: authContext.tenantId,
        userId: authContext.userId,
        sessionId: authContext.sessionId,
        toolName: typeof body?.params?.name === 'string' ? body.params.name : undefined,
        result: 'success',
        durationMs: Date.now() - start,
      });
      return reply.send(result);
    } catch (error: any) {
      logger.error(error);
      await audit.log({ action: 'mcp.request', tenantId: 'unknown', userId: 'unknown', result: 'error', errorMessage: error?.message ?? 'Unknown error' });
      return reply.status(500).send({ error: error?.message ?? 'Internal server error' });
    }
  });

  return app;
}

type RuntimeConfig = {
  logLevel: string;
  fhirBaseUrl: string;
  fhirAuthToken: string | undefined;
  authProvider: 'oauth2' | 'saml' | 'mock';
};

function getRuntimeConfig(): RuntimeConfig {
  return {
    logLevel: process.env.LOG_LEVEL || 'info',
    fhirBaseUrl: process.env.FHIR_BASE_URL || 'http://localhost:8080/fhir',
    fhirAuthToken: process.env.FHIR_AUTH_TOKEN,
    authProvider: (process.env.AUTH_PROVIDER as any) || 'mock',
  };
}
