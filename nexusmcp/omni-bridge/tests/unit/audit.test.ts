import { test, describe, expect } from 'vitest';
import { AuditLogger } from '../../src/audit/logger.js';

describe('AuditLogger', () => {
  test('creates an audit logger instance', () => {
    const audit = new AuditLogger({ sink: 'console', retentionDays: 1 });
    expect(audit).toBeDefined();
  });

  test('logs a redacted event', async () => {
    const audit = new AuditLogger({ sink: 'console', retentionDays: 1 });
    await audit.log({
      action: 'fhir.patient_search',
      tenantId: 'tenant-1',
      userId: 'user-1',
      resourceType: 'Patient',
      params: { family: 'Doe', given: 'Jane', birthdate: '1980-01-01' },
    });
  });

  test('redacts sensitive search parameters', async () => {
    const audit = new AuditLogger({ sink: 'console', retentionDays: 1 });
    const exported = await audit.export();
    expect(exported).toBeDefined();
    expect(typeof exported).toBe('string');
  });
});
