// OmniBridge — Auth helpers for MCP requests
// Provides lightweight JWT helpers and a pure TS `requireAuth` helper.
// Heavy enterprise auth flows may be added later; this keeps the core compileable.

import { SignJWT, jwtVerify } from 'jose';

export interface AuthContext {
  tenantId: string;
  userId: string;
  scopes: string[];
  fhirToken?: string;
  authMethod: 'oauth2' | 'saml' | 'mock';
  authenticatedAt: string;
  sessionId: string;
}

export interface AuthConfig {
  provider: 'oauth2' | 'saml' | 'mock';
  issuer?: string;
  clientId?: string;
  clientSecret?: string;
  samlEntryPoint?: string;
  samlCert?: string;
  jwtSecret: string;
  mockUsers?: Array<{ tenantId: string; userId: string; scopes: string[] }>;
}

let cachedSecret: Uint8Array | null = null;

function getSecret(): Uint8Array {
  if (!cachedSecret) {
    cachedSecret = new TextEncoder().encode(process.env.AUTH_JWT_SECRET || 'dev-secret-only-change-in-production');
  }
  return cachedSecret;
}

export async function signAuthToken(payload: { sub: string; tenantId: string; scopes: string[] }, expiresInSeconds = 3600): Promise<string> {
  const jwt = new SignJWT(payload);
  jwt.setProtectedHeader({ alg: 'HS256' });
  jwt.setExpirationTime(`now + ${expiresInSeconds}s`);
  return await jwt.sign(getSecret());
}

export async function verifyAuthToken(token: string): Promise<AuthContext | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as AuthContext;
  } catch {
    return null;
  }
}

export function requireAuth(extra: any): AuthContext {
  // Used by MCP tool handlers: requires upstream gateway to inject auth context.
  const auth = extra?.authContext as AuthContext | undefined;
  if (!auth) {
    throw new Error('Missing auth context. Gateways must attach authContext to MCP requests.');
  }
  return auth;
}
