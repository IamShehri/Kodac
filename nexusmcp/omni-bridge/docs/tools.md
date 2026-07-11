# OmniBridge Tool Reference

All FHIR tools follow the MCP tool naming convention: `fhir_{resource}_{action}`.

## Tools

### `fhir_patient_read`
Read a FHIR Patient resource by ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| patientId | string | Yes | FHIR Patient resource ID |

**Returns:** Full Patient resource JSON

**Example:**
```json
{ "patientId": "12345" }
```

---

### `fhir_patient_search`
Search FHIR Patient resources with filtered criteria.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| family | string | No | Family name — redacted in audit logs |
| given | string | No | Given name — redacted in audit logs |
| birthdate | string | No | Birth date — redacted in audit logs |
| gender | enum | No | male / female / other / unknown |
| _count | integer | No | Max results (default 20, max 100) |

**Returns:** FHIR Bundle

---

### `fhir_observation_read`
Read a FHIR Observation resource (labs, vitals, diagnostics).

**Parameters:**
| Name | Type | Required |
|------|------|----------|
| observationId | string | Yes |

---

### `fhir_condition_read`
Read a FHIR Condition/Diagnosis resource.
