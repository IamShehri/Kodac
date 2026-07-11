import * as http from 'node:http';

const capability = {
  resourceType: 'CapabilityStatement',
  status: 'active',
  date: '2026-07-11',
  fhirVersion: '4.0.1',
  kind: 'capability',
  software: { name: 'mock-fhir', version: '0.0.1' },
  implementation: { description: 'Smoke-test FHIR mock' },
  rest: [
    {
      mode: 'server',
      resource: [
        { type: 'Patient', interaction: [{ code: 'read' }, { code: 'search-type' }] },
        { type: 'Observation', interaction: [{ code: 'search-type' }] },
      ],
    },
  ],
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const pathname = url.pathname === '/fhir/metadata' ? '/fhir/metadata' : url.pathname;
  if (pathname === '/metadata' || pathname === '/fhir/metadata' || pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'application/fhir+json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(capability));
    return;
  }
  res.writeHead(404, { 'Content-Type': 'application/fhir+json' });
  res.end(JSON.stringify({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'not-found', diagnostics: `No mock backend for ${url.pathname}` }] }));
});

server.listen(8080, '127.0.0.1', () => {
  // eslint-disable-next-line no-console
  console.log('mock-fhir listening on 127.0.0.1:8080');
});
