// OmniBridge — Typed FHIR client
// Thin wrapper over any FHIR R4 endpoint with built-in audit logging + PII redaction.

import { AuditLogger, AuditEvent } from '../audit/logger.js';

export interface FHIRClientConfig {
  baseUrl: string;
  tenantId: string;
  authToken?: string;
  timeoutMs?: number;
}

export class OmniBridgeFHIRClient {
  constructor(private readonly config: FHIRClientConfig, private readonly audit: AuditLogger) {}

  async read(resourceType: string, id: string): Promise<any> {
    await this.audit.log({ action: 'fhir.read', resourceType, resourceId: id, tenantId: this.config.tenantId });
    const url = `${this.config.baseUrl}/${encodeURIComponent(resourceType)}/${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      headers: this.authHeaders(),
      signal: AbortSignal.timeout(this.config.timeoutMs ?? 30000),
    });
    if (!res.ok) throw new Error(`FHIR ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async search(resourceType: string, params: Record<string, string>): Promise<any> {
    await this.audit.log({
      action: 'fhir.search',
      resourceType,
      params: sanitizeParams(params),
      tenantId: this.config.tenantId,
    });
    const qs = new URLSearchParams(params).toString();
    const url = `${this.config.baseUrl}/${encodeURIComponent(resourceType)}?${qs}`;
    const res = await fetch(url, {
      headers: this.authHeaders(),
      signal: AbortSignal.timeout(this.config.timeoutMs ?? 30000),
    });
    if (!res.ok) throw new Error(`FHIR ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async create(resourceType: string, resource: Record<string, any>): Promise<any> {
    await this.audit.log({ action: 'fhir.create', resourceType, tenantId: this.config.tenantId });
    const url = `${this.config.baseUrl}/${encodeURIComponent(resourceType)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...this.authHeaders(), 'Content-Type': 'application/fhir+json' },
      body: JSON.stringify(resource),
      signal: AbortSignal.timeout(this.config.timeoutMs ?? 30000),
    });
    if (!res.ok) throw new Error(`FHIR ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async update(resourceType: string, id: string, resource: Record<string, any>): Promise<any> {
    await this.audit.log({ action: 'fhir.update', resourceType, resourceId: id, tenantId: this.config.tenantId });
    const url = `${this.config.baseUrl}/${encodeURIComponent(resourceType)}/${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: { ...this.authHeaders(), 'Content-Type': 'application/fhir+json' },
      body: JSON.stringify(resource),
      signal: AbortSignal.timeout(this.config.timeoutMs ?? 30000),
    });
    if (!res.ok) throw new Error(`FHIR ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async patch(resourceType: string, id: string, patch: Array<{ op: string; path: string; value?: any }>): Promise<any> {
    await this.audit.log({ action: 'fhir.patch', resourceType, resourceId: id, tenantId: this.config.tenantId });
    const url = `${this.config.baseUrl}/${encodeURIComponent(resourceType)}/${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { ...this.authHeaders(), 'Content-Type': 'application/json-patch+json' },
      body: JSON.stringify(patch),
      signal: AbortSignal.timeout(this.config.timeoutMs ?? 30000),
    });
    if (!res.ok) throw new Error(`FHIR ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async deleteResource(resourceType: string, id: string): Promise<void> {
    await this.audit.log({ action: 'fhir.delete', resourceType, resourceId: id, tenantId: this.config.tenantId });
    const url = `${this.config.baseUrl}/${encodeURIComponent(resourceType)}/${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: this.authHeaders(),
      signal: AbortSignal.timeout(this.config.timeoutMs ?? 30000),
    });
    if (!res.ok && res.status !== 204) throw new Error(`FHIR ${res.status}: ${await res.text()}`);
  }

  async validate(resourceType: string, resource: Record<string, any>): Promise<any> {
    const url = `${this.config.baseUrl}/$validate`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...this.authHeaders(), 'Content-Type': 'application/fhir+json' },
      body: JSON.stringify({ resourceType, resource }),
      signal: AbortSignal.timeout(this.config.timeoutMs ?? 30000),
    });
    if (!res.ok) throw new Error(`FHIR ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async getCapabilityStatement(): Promise<any> {
    const res = await fetch(`${this.config.baseUrl}/metadata`, {
      headers: this.authHeaders(),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`FHIR ${res.status}: ${await res.text()}`);
    return res.json();
  }

  private authHeaders(): Record<string, string> {
    const headers: Record<string, string> = { Accept: 'application/fhir+json' };
    if (this.config.authToken) headers['Authorization'] = `Bearer ${this.config.authToken}`;
    return headers;
  }
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
