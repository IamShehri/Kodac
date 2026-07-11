// OmniBridge configuration loader
// Reads from environment variables and validates against config/schema.json

import { readFileSync } from 'node:fs';

const raw = readFileSync(new URL('../schema.json', import.meta.url), 'utf-8');

export interface Config {
  environment: 'development' | 'staging' | 'production';
  compliance: {
    mode: 'strict' | 'lenient' | 'off';
    auditSink: { type: 'console' | 's3'; s3Bucket?: string; s3Prefix?: string };
    piiRedaction: boolean;
    immutableRetentionDays: number;
  };
  auth: {
    provider: 'oauth2' | 'saml' | 'mock';
    issuer?: string;
    clientId?: string;
    clientSecret?: string;
    samlEntryPoint?: string;
    samlCert?: string;
    jwtSecret: string;
    mockUsers: Array<{ tenantId: string; userId: string; scopes: string[] }>;
  };
  fhir: { baseUrl: string; tenantId?: string; authToken?: string; timeoutMs: number };
  rateLimit: { windowMs: number; max: number };
}

function envOr(key: string, fallback?: string): string | undefined {
  return process.env[key] || fallback;
}

function boolEnv(key: string, fallback = false): boolean {
  const v = process.env[key];
  if (v === undefined) return fallback;
  return v === 'true' || v === '1';
}

export const config: Config = {
  environment: (envOr('NODE_ENV', 'development') as Config['environment']) || 'development',
  compliance: {
    mode: (envOr('COMPLIANCE_MODE', 'strict') as Config['compliance']['mode']) || 'strict',
    auditSink: {
      type: (envOr('AUDIT_SINK', 'console') as Config['compliance']['auditSink']['type']) || 'console',
      s3Bucket: envOr('AUDIT_S3_BUCKET'),
      s3Prefix: envOr('AUDIT_S3_PREFIX', 'omni-bridge/audit-logs'),
    },
    piiRedaction: boolEnv('PII_REDACTION', true),
    immutableRetentionDays: parseInt(envOr('RETENTION_DAYS', '2555') || '2555', 10),
  },
  auth: {
    provider: (envOr('AUTH_PROVIDER', 'mock') as Config['auth']['provider']) || 'mock',
    issuer: envOr('AUTH_ISSUER'),
    clientId: envOr('AUTH_CLIENT_ID'),
    clientSecret: envOr('AUTH_CLIENT_SECRET'),
    samlEntryPoint: envOr('SAML_ENTRY_POINT'),
    samlCert: envOr('SAML_CERT'),
    jwtSecret: envOr('AUTH_JWT_SECRET', 'dev-secret-only-change-in-production'),
    mockUsers: [
      { tenantId: 'default', userId: 'dev_user', scopes: ['fhir:read', 'fhir:write'] },
    ],
  },
  fhir: {
    baseUrl: envOr('FHIR_BASE_URL', 'http://localhost:8080/fhir') || 'http://localhost:8080/fhir',
    tenantId: envOr('TENANT_ID', 'default'),
    authToken: envOr('FHIR_AUTH_TOKEN'),
    timeoutMs: parseInt(envOr('FHIR_TIMEOUT_MS', '30000') || '30000', 10),
  },
  rateLimit: {
    windowMs: parseInt(envOr('RATE_LIMIT_WINDOW_MS', '60000') || '60000', 10),
    max: parseInt(envOr('RATE_LIMIT_MAX', '120') || '120', 10),
  },
};

// Warn if running production-like with unsafe defaults
if (config.environment !== 'development') {
  if (config.auth.jwtSecret.includes('dev-secret') || !config.auth.jwtSecret || config.auth.jwtSecret.length < 32) {
    console.warn('[OmniBridge] WARNING: AUTH_JWT_SECRET is short or default. Set a strong secret in production.');
  }
  if (config.compliance.mode !== 'strict') {
    console.warn('[OmniBridge] WARNING: COMPLIANCE_MODE is not "strict" in production environment.');
  }
}
