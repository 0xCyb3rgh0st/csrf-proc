# Security

CSRForge processes sensitive security testing data locally. Do not use it against systems unless you own them or have explicit authorization.

Security design goals:

- No hosted backend dependency
- No automatic execution on project load
- No public PoC hosting
- No request content in logs
- HTML escaping for generated output
- Runtime validation at import boundaries
- Redaction before saving and exporting by default

Report security concerns through the repository's private disclosure process once one exists.
