# csrf-proc

CSRForge application source for `csrf-proc`.

CSRForge is a local-first CSRF proof-of-concept workbench for authorized penetration testing, security research, education, internal assessments, and bug-bounty programs.

The MVP foundation implements a static Next.js app with request import, raw HTTP parsing, structured inspection, local project storage, project import/export, and sensitive-value redaction primitives. Later phases add deeper analysis, PoC generation, safe preview, reports, and evidence bundles.

## Authorized Use

CSRForge is intended only for systems you own or are explicitly authorized to test.

## Privacy Model

Request parsing, analysis, project storage, and PoC generation occur locally in your browser. The core application has no login, backend service, cloud database, analytics pipeline, or automatic upload of request content.

## Development

```bash
npm install
npm run dev
```

## Static Build

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

The production build writes a static export to `out/`.

## Current Scope

- Static Next.js App Router shell
- Dark and light theme tokens
- Request Studio
- Raw HTTP parser
- Canonical request model
- Structured request inspector
- Sensitive-value detection and redaction
- IndexedDB project repository
- `.csrfproj` import/export format

## Remaining Phases

- Browser-feasibility and CSRF-defense analysis
- PoC generators and safe preview
- Report and ZIP evidence exports
- Web workers, PWA support, accessibility and performance hardening
- Expanded unit, integration, and end-to-end tests
