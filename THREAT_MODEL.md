# Threat Model

CSRForge assumes imported requests and project files may be malformed or sensitive.

Primary risks:

- Accidental disclosure of secrets
- Unsafe rendering of generated HTML
- Prototype pollution through imported JSON
- Parser crashes on malformed input
- Accidental request execution

Current mitigations:

- Zod validation at project import boundaries
- Sensitive field detection and redaction
- Sandboxed preview design for later phases
- No backend upload path
- Parser returns structured errors instead of throwing for user input
