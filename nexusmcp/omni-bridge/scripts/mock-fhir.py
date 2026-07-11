from http.server import HTTPServer, BaseHTTPRequestHandler
import json

CAPABILITY = {
  "resourceType": "CapabilityStatement",
  "status": "active",
  "date": "2026-07-11",
  "fhirVersion": "4.0.1",
  "kind": "capability",
  "software": {"name": "mock-fhir", "version": "0.0.1"},
  "implementation": {"description": "Smoke-test FHIR mock"},
  "rest": [
    {
      "mode": "server",
      "resource": [
        {
          "type": "Patient",
          "interaction": [{"code": "read"}, {"code": "search-type"}]
        },
        {
          "type": "Observation",
          "interaction": [{"code": "search-type"}]
        }
      ]
    }
  ]
}

class Handler(BaseHTTPRequestHandler):
  def do_GET(self):
    self.send_response(200)
    self.send_header('Content-Type', 'application/fhir+json; charset=utf-8')
    self.send_header('Access-Control-Allow-Origin', '*')
    self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
    self.send_header('Access-Control-Allow-Headers', 'authorization, content-type')
    self.end_headers()
    self.wfile.write(json.dumps(CAPABILITY).encode('utf-8'))

  def do_OPTIONS(self):
    self.send_response(204)
    self.send_header('Access-Control-Allow-Origin', '*')
    self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
    self.send_header('Access-Control-Allow-Headers', 'authorization, content-type')
    self.end_headers()

  def log_message(self, format, *args):
    pass

if __name__ == '__main__':
  HTTPServer(('127.0.0.1', 8080), Handler).serve_forever()
