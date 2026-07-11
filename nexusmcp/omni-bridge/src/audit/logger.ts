// OmniBridge — Type-safe Audit Logger
// Stable public API: AuditEvent interface + AuditLogger class.

export interface AuditEvent {
  timestamp: string;
  action: string;
  tenantId: string;
  userId?: string;
  sessionId?: string;
  toolName?: string;
  resourceType?: string;
  resourceId?: string;
  params?: Record<string, any>;
  result?: 'success' | 'error';
  errorMessage?: string;
  durationMs?: number;
  ipAddress?: string;
  userAgent?: string;
  complianceFlags?: string[];
}

export interface AuditLoggerOptions {
  sink: 'console' | 's3';
  s3Bucket?: string;
  s3Prefix?: string;
  retentionDays: number;
}

export class AuditLogger {
  constructor(private readonly options: AuditLoggerOptions) {}

  async log(event: Omit<AuditEvent, 'timestamp'> & { timestamp?: string }): Promise<void> {
    const payload: AuditEvent = {
      timestamp: event.timestamp || new Date().toISOString(),
      ...event,
    };

    if (payload.params) {
      payload.params = redactPII(payload.params);
    }

    // In a real setup, route this to pino or structured logger.
    console.log(JSON.stringify(payload));

    if (this.options.sink === 's3' && this.options.s3Bucket) {
      // Best-effort async S3 persistence; never block caller on audit writes.
      writeToS3(payload).catch(() => { /* audit sink is best-effort */ });
    }
  }

  async export(): Promise<string> {
    return JSON.stringify({ message: 'Audit export placeholder', sink: this.options.sink }, null, 2);
  }
}

function redactPII(obj: Record<string, any>): Record<string, any> {
  const piiKeys = new Set([
    'name', 'address', 'birthDate', 'birthdate', 'ssn', 'email', 'phone',
    'patientName', 'mrn', 'identifier', 'value',
  ]);
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (piiKeys.has(key.toLowerCase())) {
      out[key] = '[REDACTED]';
    } else if (Array.isArray(value)) {
      out[key] = value.map((item) => (typeof item === 'object' && item !== null ? redactPII(item) : item));
    } else if (value && typeof value === 'object') {
      out[key] = redactPII(value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

async function writeToS3(event: AuditEvent): Promise<void> {
  // Placeholder for real S3 PutObject with object-lock compliance retention.
  // Use @aws-sdk/client-s3 in production.
  return;
}
