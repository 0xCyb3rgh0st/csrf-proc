# csrf-proc

<div align="center">

**A local-first CSRF proof-of-concept workbench for authorized security testing.**

[![CI](https://github.com/0xCyb3rgh0st/csrf-proc/actions/workflows/ci.yml/badge.svg)](https://github.com/0xCyb3rgh0st/csrf-proc/actions/workflows/ci.yml)
[![Deploy GitHub Pages](https://github.com/0xCyb3rgh0st/csrf-proc/actions/workflows/pages.yml/badge.svg)](https://github.com/0xCyb3rgh0st/csrf-proc/actions/workflows/pages.yml)
![Static](https://img.shields.io/badge/runtime-static_site-2ea44f)
![Local First](https://img.shields.io/badge/privacy-local_first-0969da)
![TypeScript](https://img.shields.io/badge/types-TypeScript-3178c6)

[Live Site](https://csrf.jatinsingh.com.np) | [Privacy](./PRIVACY.md) | [Security](./SECURITY.md) | [Architecture](./ARCHITECTURE.md)

</div>

---

## What It Does

`csrf-proc` turns captured HTTP requests into browser-realistic CSRF PoC files. It is built for authorized penetration testing, internal security assessment, education, and bug-bounty workflows.

The app is intentionally local-first: request parsing, PoC generation, project storage, and export handling happen in your browser. There is no login, hosted backend, cloud database, or automatic request upload.

> CSRForge is intended only for systems you own or are explicitly authorized to test.

## Highlights

- Paste raw HTTP requests and parse them locally.
- Preserve duplicate headers and parameters.
- Generate Burp-style CSRF PoC HTML.
- Select multiple CSRF techniques at once.
- Generate URL-encoded, multipart, plain text, and XHR diagnostic templates.
- Override target protocol with Original, HTTPS, or HTTP.
- Preview PoCs safely with target submission disabled.
- Detect and mask likely sensitive values.
- Save projects locally with IndexedDB.
- Export and import `.csrfproj` project files.
- Build as a fully static site for GitHub Pages or any static host.

## Interface

The current workspace is focused on the core flow:

```text
Raw HTTP request  ->  Parsed request  ->  CSRF PoC generator
```

Screenshots can be added once the public deployment is finalized.

```text
+-------------------------------+------------------------------+
| Raw request                   | Parsed request               |
|                               |                              |
| Paste captured request        | Inspect method, URL, fields  |
| Parse locally                 | Review sensitive values      |
+-------------------------------+------------------------------+
+--------------------------------------------------------------+
| CSRF PoC Generator                                           |
| Technique checkboxes | HTTP/HTTPS override | Safe Preview    |
+--------------------------------------------------------------+
```

## CSRF Techniques

The generator supports:

| Technique | Purpose | Classification |
| --- | --- | --- |
| Auto-select | Chooses the closest representation from request features | Recommended when exact form representation is available |
| URL-encoded form | Standard `application/x-www-form-urlencoded` form PoC | Recommended for matching URL-encoded POSTs |
| Multipart form | Browser `multipart/form-data` form PoC | Alternative unless original request is multipart |
| Plain text form | `text/plain` form representation | Useful for text bodies and JSON diagnostics |
| Cross-domain XHR | Credentialed XHR diagnostic template | Diagnostic only, CORS-dependent |

The app does not claim a vulnerability is confirmed just because a PoC was generated. Server-side behavior still needs authorized verification.

## Quick Start

```bash
git clone https://github.com/0xCyb3rgh0st/csrf-proc.git
cd csrf-proc
npm ci
npm run dev
```

Open:

```text
http://127.0.0.1:3000/workspace/
```

## Quality Checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

The production build writes a static export to:

```text
out/
```

## Deployment

GitHub Actions are included:

- `.github/workflows/ci.yml` runs typecheck, lint, tests, and static build.
- `.github/workflows/pages.yml` deploys automatically on pushes to `main`.

The custom domain is configured through:

```text
public/CNAME
```

Current domain:

```text
csrf.jatinsingh.com.np
```

For DNS, point the domain to GitHub Pages using the records recommended by GitHub for your DNS provider.

## Privacy Model

- Requests are processed locally in the browser.
- Projects are stored in browser storage.
- No account is required.
- No request data is uploaded by the core application.
- Exported project files are controlled by the user.
- Sensitive values are masked and redacted by default where supported.

See [PRIVACY.md](./PRIVACY.md) for details.

## Security Boundaries

This project does not include:

- public exploit hosting
- phishing templates
- mass scanning
- automatic destructive testing
- stealth, obfuscation, or anti-analysis features
- victim delivery workflows
- cookie exfiltration or callback collection

Generated PoCs are files for authorized validation. Safe Preview disables target submission inside the app.

## Tech Stack

- Next.js App Router with static export
- TypeScript strict mode
- React
- Tailwind CSS
- Radix-style UI primitives
- Zustand
- Dexie / IndexedDB
- Zod
- Vitest
- GitHub Actions

## Repository Structure

```text
src/
├── app/                 # Next.js routes
├── components/          # UI and design-system components
├── core/                # parsers, models, generators, redaction
├── features/            # product workflows
├── storage/             # IndexedDB and project files
├── stores/              # client state
├── test-corpus/         # safe parser examples
└── workers/             # typed worker contracts
```

## Roadmap

- Browser-feasibility analysis
- Cookie and SameSite analysis
- CSRF-defense findings
- Report builder
- ZIP evidence export
- HAR and cURL importers
- Web workers for large parsing tasks
- Expanded Playwright coverage

## License

No license file has been added yet. Treat the code as all-rights-reserved until a license is published.
