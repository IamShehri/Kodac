// OmniBridge — FHIR R4 MCP Server
// Exposes healthcare data operations as MCP tool calls with compliance middleware.

import { FastMCP } from './fastmcp.js';
import { z } from 'zod';
import { AuditLogger } from '../audit/logger.js';
import { AuthContext, requireAuth } from '../auth/middleware.js';
import { RateLimiter } from '../utils/rate-limiter.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

interface FHIRServerConfig {
  baseUrl: string;
  tenantId: string;
  authToken?: string;
}

interface TenantClient {
  client: OmniBridgeFHIRClient;
}

// ---------------------------------------------------------------------------
// Minimal FHIR client
// ---------------------------------------------------------------------------

class OmniBridgeFHIRClient {
  constructor(private readonly config: FHIRServerConfig, private readonly audit: AuditLogger) {}

  async read(resourceType: string, id: string): Promise<any> {
    await this.audit.log({ action: 'fhir.read', resourceType, resourceId: id, tenantId: this.config.tenantId });
    const url = `${this.config.baseUrl}/${resourceType}/${id}`;
    const res = await fetch(url, {
      headers: this.authHeaders(),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`FHIR ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async search(resourceType: string, params: Record<string, string>): Promise<any> {
    await this.audit.log({ action: 'fhir.search', resourceType, params: sanitizeParams(params), tenantId: this.config.tenantId });
    const qs = new URLSearchParams(params).toString();
    const url = `${this.config.baseUrl}/${resourceType}?${qs}`;
    const res = await fetch(url, {
      headers: this.authHeaders(),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`FHIR ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async create(resourceType: string, resource: Record<string, any>): Promise<any> {
    await this.audit.log({ action: 'fhir.create', resourceType, tenantId: this.config.tenantId });
    const url = `${this.config.baseUrl}/${resourceType}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...this.authHeaders(), 'Content-Type': 'application/fhir+json' },
      body: JSON.stringify(resource),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`FHIR ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async update(resourceType: string, id: string, resource: Record<string, any>): Promise<any> {
    await this.audit.log({ action: 'fhir.update', resourceType, resourceId: id, tenantId: this.config.tenantId });
    const url = `${this.config.baseUrl}/${resourceType}/${id}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: { ...this.authHeaders(), 'Content-Type': 'application/fhir+json' },
      body: JSON.stringify(resource),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`FHIR ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async patch(resourceType: string, id: string, patch: Array<{ op: string; path: string; value?: any }>): Promise<any> {
    await this.audit.log({ action: 'fhir.patch', resourceType, resourceId: id, tenantId: this.config.tenantId });
    const url = `${this.config.baseUrl}/${resourceType}/${id}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { ...this.authHeaders(), 'Content-Type': 'application/json-patch+json' },
      body: JSON.stringify(patch),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`FHIR ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async deleteResource(resourceType: string, id: string): Promise<void> {
    await this.audit.log({ action: 'fhir.delete', resourceType, resourceId: id, tenantId: this.config.tenantId });
    const url = `${this.config.baseUrl}/${resourceType}/${id}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: this.authHeaders(),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok && res.status !== 204) throw new Error(`FHIR ${res.status}: ${await res.text()}`);
  }

  async validate(resourceType: string, resource: Record<string, any>): Promise<any> {
    await this.audit.log({ action: 'fhir.validate', resourceType, tenantId: this.config.tenantId });
    const url = `${this.config.baseUrl}/$validate`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...this.authHeaders(), 'Content-Type': 'application/fhir+json' },
      body: JSON.stringify({ resourceType, resource }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`FHIR ${res.status}: ${await res.text()}`);
    const result = (await res.json()) as any;
    return {
      valid: (result.issue || []).every((issue: any) => issue.severity !== 'error'),
      issues: (result.issue || []).length,
      raw: result,
    };
  }

  async getCapabilityStatement(): Promise<any> {
    const result = (await fetch(`${this.config.baseUrl}/metadata`, {
      headers: this.authHeaders(),
      signal: AbortSignal.timeout(15000),
    }).then((r) => r.json())) as any;
    return {
      server: this.config.baseUrl,
      software: result.software?.name ?? 'unknown',
      version: result.software?.version ?? 'unknown',
      resources: result.rest?.[0]?.resource?.map((r: any) => r.type) ?? [],
      operations: (result.rest?.[0]?.operation || []).length,
    };
  }

  private authHeaders(): Record<string, string> {
    const headers: Record<string, string> = { Accept: 'application/fhir+json' };
    if (this.config.authToken) headers['Authorization'] = `Bearer ${this.config.authToken}`;
    return headers;
  }
}

// ---------------------------------------------------------------------------
// Server builder
// ---------------------------------------------------------------------------

export async function buildFHIRMCP(audit: AuditLogger, rateLimiter: RateLimiter): Promise<FastMCP> {
  const server = new FastMCP({ name: 'OmniBridge FHIR MCP', version: '0.1.0' });

  const tenantStore = new Map<string, TenantClient>();

  function getTenant(auth: AuthContext): TenantClient {
    const existing = tenantStore.get(auth.tenantId);
    if (existing) return existing;

    const client = new OmniBridgeFHIRClient(
      { baseUrl: process.env.FHIR_BASE_URL || 'http://localhost:8080/fhir', tenantId: auth.tenantId, authToken: auth.fhirToken },
      audit,
    );

    const entry: TenantClient = { client };
    tenantStore.set(auth.tenantId, entry);
    return entry;
  }

  // -----------------------------------------------------------------------
  // Tool: FHIR Patient Read
  // -----------------------------------------------------------------------
  server.addTool({
    name: 'fhir_patient_read',
    description: 'Read a FHIR Patient resource by ID.',
    parameters: z.object({ patientId: z.string().describe('The FHIR Patient resource ID') }),
    outputSchema: z.object({ resourceType: z.string(), id: z.string() }),
  }, async (args, extra) => {
    const auth = requireAuth(extra);
    rateLimiter.check(auth.tenantId);
    const { client } = getTenant(auth);
    const result = await client.read('Patient', String(args.patientId));
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  });

  // -----------------------------------------------------------------------
  // Tool: FHIR Patient Search
  // -----------------------------------------------------------------------
  server.addTool({
    name: 'fhir_patient_search',
    description: 'Search FHIR Patient resources.',
    parameters: z.object({
      family: z.string().optional().describe('Family name'),
      given: z.string().optional().describe('Given name'),
      birthdate: z.string().optional().describe('Birth date'),
      gender: z.enum(['male', 'female', 'other', 'unknown']).optional(),
      _count: z.number().int().max(100).default(20),
    }),
    outputSchema: z.object({ resourceType: z.string(), total: z.number(), entry: z.array(z.any()) }),
  }, async (args, extra) => {
    const auth = requireAuth(extra);
    rateLimiter.check(auth.tenantId);
    const { client } = getTenant(auth);
    const result = await client.search('Patient', {
      family: args.family ? String(args.family) : '',
      given: args.given ? String(args.given) : '',
      birthdate: args.birthdate ? String(args.birthdate) : '',
      gender: (args.gender ?? '') as string,
      _count: String(args._count ?? 20),
    });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  });

  // -----------------------------------------------------------------------
  // Tool: FHIR Observation Search
  // -----------------------------------------------------------------------
  server.addTool({
    name: 'fhir_observation_search',
    description: 'Search FHIR Observation resources.',
    parameters: z.object({
      patientId: z.string().describe('Patient ID'),
      category: z.string().optional().describe('Observation category'),
      date: z.string().optional().describe('Date filter'),
      _count: z.number().int().max(100).default(20),
    }),
    outputSchema: z.object({ resourceType: z.string(), total: z.number(), entry: z.array(z.any()) }),
  }, async (args, extra) => {
    const auth = requireAuth(extra);
    rateLimiter.check(auth.tenantId);
    const { client } = getTenant(auth);
    const result = await client.search('Observation', {
      patient: String(args.patientId),
      category: args.category ? String(args.category) : '',
      date: args.date ? String(args.date) : '',
      _count: String(args._count ?? 20),
    });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  });

  // -----------------------------------------------------------------------
  // Tool: FHIR Condition Search
  // -----------------------------------------------------------------------
  server.addTool({
    name: 'fhir_condition_search',
    description: 'Search FHIR Condition resources.',
    parameters: z.object({
      patientId: z.string().describe('Patient ID'),
      clinicalStatus: z.string().optional().describe('Clinical status'),
      _count: z.number().int().max(100).default(20),
    }),
    outputSchema: z.object({ resourceType: z.string(), total: z.number(), entry: z.array(z.any()) }),
  }, async (args, extra) => {
    const auth = requireAuth(extra);
    rateLimiter.check(auth.tenantId);
    const { client } = getTenant(auth);
    const result = await client.search('Condition', {
      patient: String(args.patientId),
      clinicalStatus: args.clinicalStatus ? String(args.clinicalStatus) : '',
      _count: String(args._count ?? 20),
    });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  });

  // -----------------------------------------------------------------------
  // Tool: FHIR MedicationRequest Search
  // -----------------------------------------------------------------------
  server.addTool({
    name: 'fhir_medication_request_search',
    description: 'Search FHIR MedicationRequest resources.',
    parameters: z.object({
      patientId: z.string().describe('Patient ID'),
      status: z.string().optional().describe('Medication request status'),
      _count: z.number().int().max(100).default(20),
    }),
    outputSchema: z.object({ resourceType: z.string(), total: z.number(), entry: z.array(z.any()) }),
  }, async (args, extra) => {
    const auth = requireAuth(extra);
    rateLimiter.check(auth.tenantId);
    const { client } = getTenant(auth);
    const result = await client.search('MedicationRequest', {
      patient: String(args.patientId),
      status: args.status ? String(args.status) : '',
      _count: String(args._count ?? 20),
    });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  });

  // -----------------------------------------------------------------------
  // Tool: FHIR Encounter Search
  // -----------------------------------------------------------------------
  server.addTool({
    name: 'fhir_encounter_search',
    description: 'Search FHIR Encounter resources.',
    parameters: z.object({
      patientId: z.string().describe('Patient ID'),
      type: z.string().optional().describe('Encounter type'),
      date: z.string().optional().describe('Date filter'),
      _count: z.number().int().max(100).default(20),
    }),
    outputSchema: z.object({ resourceType: z.string(), total: z.number(), entry: z.array(z.any()) }),
  }, async (args, extra) => {
    const auth = requireAuth(extra);
    rateLimiter.check(auth.tenantId);
    const { client } = getTenant(auth);
    const result = await client.search('Encounter', {
      patient: String(args.patientId),
      type: args.type ? String(args.type) : '',
      date: args.date ? String(args.date) : '',
      _count: String(args._count ?? 20),
    });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  });

  // -----------------------------------------------------------------------
  // Tool: FHIR Resource Validate
  // -----------------------------------------------------------------------
  server.addTool({
    name: 'fhir_resource_validate',
    description: 'Validate a FHIR resource against $validate.',
    parameters: z.object({ resourceType: z.string(), resource: z.any() }),
    outputSchema: z.object({ valid: z.boolean(), issues: z.number() }),
  }, async (args, extra) => {
    const auth = requireAuth(extra);
    rateLimiter.check(auth.tenantId);
    const { client } = getTenant(auth);
    const result = await client.validate(String(args.resourceType), args.resource as Record<string, any>);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  });

  // -----------------------------------------------------------------------
  // Tool: FHIR Capability Statement
  // -----------------------------------------------------------------------
  server.addTool({
    name: 'fhir_capability_statement',
    description: 'Retrieve the FHIR CapabilityStatement.',
    parameters: z.object({}),
  }, async (_args, extra) => {
    const auth = requireAuth(extra);
    rateLimiter.check(auth.tenantId);
    const { client } = getTenant(auth);
    const result = await client.getCapabilityStatement();
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  });

  return server;
}

function sanitizeParams(params: Record<string, string>): Record<string, string> {
  const sensitive = ['name', 'address', 'birthdate', 'birthDate', 'ssn', 'email', 'phone', 'patientName', 'mrn'];
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (sensitive.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
      out[key] = '[REDACTED]';
    } else {
      out[key] = value;
    }
  }
  return out;
}
