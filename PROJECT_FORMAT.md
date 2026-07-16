# CSRForge Project Format

CSRForge project files use the `.csrfproj` extension and JSON content.

```json
{
  "format": "csrf-forge-project",
  "version": 1,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "applicationVersion": "0.1.0",
  "project": {
    "id": "project-id",
    "name": "Example",
    "description": "",
    "requests": [],
    "analyses": [],
    "generatedPocs": [],
    "report": {}
  },
  "security": {
    "secretsIncluded": false,
    "redactedFields": []
  }
}
```

All persisted objects include schema or format versions. Sensitive values are redacted by default.
