# Testing

Phase 1 tests focus on deterministic parser and redaction behavior.

Required command sequence:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Later phases should add integration and Playwright tests for safe preview, project import/export, and no automatic execution.
