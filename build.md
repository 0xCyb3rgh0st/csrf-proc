# Build Prompt: CSRForge

You are a senior software architect, product designer, frontend engineer, security-tool developer, and test engineer.

Build a polished, production-quality, local-first web application called **CSRForge**.

CSRForge is a free and open-source **CSRF proof-of-concept workbench** intended for authorized penetration testing, security research, education, internal security assessments, and bug-bounty programs.

The application converts captured HTTP requests into browser-realistic CSRF proof-of-concept files, explains whether those requests are feasible from a real browser, analyzes relevant CSRF defenses, generates professional reports, and stores all project data locally.

The application must be substantially more useful than a basic “paste request and generate HTML” website.

It must feel like a professional desktop security tool, not a childish hacker-themed interface.

---

# 1. Product principles

The application must follow these principles:

1. Local-first.
2. No login.
3. No signup.
4. No cloud database.
5. No hosted backend.
6. No user accounts.
7. No automatic upload of requests.
8. No analytics containing request data.
9. No execution when a project is opened.
10. No public exploit hosting.
11. No phishing or victim-delivery functionality.
12. No mass scanning.
13. No stealth, obfuscation, or anti-analysis features.
14. No automatic destructive testing.
15. All active testing must require an explicit user action.

Display a clear notice inside the application:

> CSRForge is intended only for systems you own or are explicitly authorized to test.

Also display:

> Request parsing, analysis, project storage, and PoC generation occur locally in your browser.

---

# 2. Core architecture

Build CSRForge as a fully static web application.

Use:

* Next.js App Router
* TypeScript with strict mode
* React
* Tailwind CSS
* shadcn/ui using Radix-based components
* Monaco Editor
* TanStack Table
* Zustand
* Dexie for IndexedDB
* Zod for runtime schema validation
* react-resizable-panels
* Lucide Icons
* Sonner
* JSZip
* Web Workers for parsing and analysis
* Vitest
* React Testing Library
* Playwright for end-to-end tests
* ESLint
* Prettier

Do not create:

* API routes
* Server Actions
* Database servers
* Authentication services
* Node.js backend services
* Cloud storage integrations

Configure Next.js for static export:

```js
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

The production build must generate an `out` directory that can be deployed to:

* GitHub Pages
* Cloudflare Pages
* Netlify
* Vercel static hosting
* Any ordinary static web server

---

# 3. Application editions

Build one static application for the MVP.

Design the architecture so that a future optional local browser runner or browser extension can be added without rewriting the core.

Do not implement the local browser runner in the first release unless all static features are complete and thoroughly tested.

The initial application must include:

* Request importing
* Request parsing
* Request inspection
* Browser-feasibility analysis
* Cookie and SameSite analysis
* CSRF-defense analysis
* PoC generation
* Safe preview
* Project saving
* Project importing and exporting
* Report generation
* ZIP evidence export

---

# 4. Monorepo or repository structure

Use a clean feature-oriented structure.

```text
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── workspace/
│   │   └── page.tsx
│   ├── projects/
│   │   └── page.tsx
│   ├── settings/
│   │   └── page.tsx
│   └── help/
│       └── page.tsx
│
├── components/
│   ├── ui/
│   ├── design-system/
│   ├── layout/
│   └── shared/
│
├── features/
│   ├── request-studio/
│   ├── request-inspector/
│   ├── analysis/
│   ├── poc-workbench/
│   ├── preview/
│   ├── projects/
│   ├── import-export/
│   ├── reports/
│   └── settings/
│
├── core/
│   ├── models/
│   ├── parsers/
│   ├── importers/
│   ├── analyzers/
│   ├── generators/
│   ├── reports/
│   ├── redaction/
│   ├── validation/
│   └── migrations/
│
├── storage/
│   ├── database.ts
│   ├── repositories/
│   ├── preferences.ts
│   └── migrations.ts
│
├── workers/
│   ├── request-parser.worker.ts
│   └── analysis.worker.ts
│
├── hooks/
├── stores/
├── lib/
├── types/
└── test-corpus/
```

Keep low-level shadcn components inside:

```text
components/ui/
```

Create application-specific components inside:

```text
components/design-system/
```

Examples:

* `ToolPanel`
* `StatusBadge`
* `FindingCard`
* `CodeToolbar`
* `PropertyRow`
* `SecurityAlert`
* `EmptyState`
* `LocalOnlyBadge`
* `SecretValue`
* `ConfidenceBadge`
* `TechniqueCard`

Do not place business logic inside React presentation components.

---

# 5. Canonical request model

Create a stable, versioned internal request representation.

Do not use plain JavaScript maps for headers or parameters because duplicate values must be preserved.

Use a model similar to:

```ts
export interface NormalizedRequest {
  schemaVersion: 1;

  id: string;

  target: {
    scheme: "http" | "https";
    hostname: string;
    port: number;
    path: string;
    rawQuery: string;
    url: string;
  };

  method: string;
  httpVersion?: string;

  headers: Array<{
    id: string;
    name: string;
    value: string;
    originalIndex: number;
    sensitive: boolean;
  }>;

  cookies: Array<{
    id: string;
    name: string;
    value: string;
    source: "cookie-header" | "manual" | "imported";
    sensitive: true;
  }>;

  queryParameters: Array<RequestParameter>;

  body:
    | { kind: "none" }
    | {
        kind: "urlencoded";
        raw: string;
        fields: RequestParameter[];
      }
    | {
        kind: "multipart";
        raw?: string;
        boundary?: string;
        parts: MultipartPart[];
      }
    | {
        kind: "json";
        raw: string;
        parsed?: unknown;
      }
    | {
        kind: "xml";
        raw: string;
      }
    | {
        kind: "text";
        raw: string;
      }
    | {
        kind: "binary";
        filename?: string;
        mimeType?: string;
      };

  provenance: {
    importer:
      | "raw-http"
      | "curl"
      | "har"
      | "manual"
      | "project-import";
    importedAt: string;
  };
}
```

Requirements:

* Preserve duplicate headers.
* Preserve duplicate parameters.
* Preserve parameter ordering.
* Preserve empty names.
* Preserve empty values.
* Preserve values without `=`.
* Preserve the original raw input.
* Never silently normalize or rewrite values.
* Maintain both raw and structured representations.
* Mark cookies and authorization information as sensitive.
* Attach schema versions to all persisted objects.

---

# 6. Request importers

Implement import support for:

## Required

* Raw HTTP request
* cURL command
* HAR file
* Manual request builder
* CSRForge project file

## Later-ready architecture

Prepare interfaces for future:

* Burp exports
* Caido exports
* ZAP exports
* Browser-extension imports

The importer interface should resemble:

```ts
interface RequestImporter {
  id: string;
  displayName: string;

  canImport(input: unknown): boolean;

  import(input: unknown): Promise<ImportResult>;
}
```

Each import result should include:

* Parsed request
* Warnings
* Unsupported fields
* Sensitive-value summary
* Original source format

---

# 7. Request parser quality requirements

The parser is one of the most important parts of the product.

Create a comprehensive parser test corpus covering:

* Duplicate headers
* Duplicate query parameters
* Duplicate body parameters
* Empty parameter names
* Empty parameter values
* Parameters without equal signs
* URL encoding
* Double encoding
* Unicode
* Invalid UTF-8 handling
* JSON arrays
* Nested JSON
* XML bodies
* Arbitrary plaintext bodies
* Multipart boundaries
* Quoted multipart boundaries
* Repeated multipart fields
* Text multipart parts
* File multipart parts
* Mixed line endings
* Missing Content-Length
* Absolute URLs
* Relative paths
* Custom ports
* IPv4
* IPv6
* Host headers containing ports
* Conflicting Host and URL values
* Requests without bodies
* Requests with unusual methods

The parser must never crash because of malformed user input.

Return structured parsing errors with:

* Error code
* Human-readable message
* Relevant line or field
* Suggested correction
* Whether partial parsing succeeded

---

# 8. Analysis engine

Implement the analysis engine as deterministic rules.

Do not use artificial intelligence for core security decisions.

Each analyzer must return independent, explainable findings.

Use a model similar to:

```ts
interface AnalysisFinding {
  id: string;

  category:
    | "browser-feasibility"
    | "authentication"
    | "cookie"
    | "content-type"
    | "csrf-token"
    | "origin"
    | "referer"
    | "fetch-metadata"
    | "custom-header"
    | "request-method"
    | "impact"
    | "general";

  status:
    | "compatible"
    | "conditional"
    | "blocked"
    | "warning"
    | "unknown"
    | "requires-verification";

  confidence: "high" | "medium" | "low";

  title: string;
  summary: string;
  explanation: string;

  evidence: Array<{
    label: string;
    value: string;
    fieldReference?: string;
  }>;

  recommendations: string[];

  references?: string[];
}
```

Do not produce one unexplained numeric “vulnerability score.”

---

# 9. Browser-feasibility engine

This is the primary differentiating feature.

For every request, determine:

* Whether a normal cross-site HTML form can initiate it
* Whether the method is form-compatible
* Whether the content type is form-compatible
* Whether custom headers are required
* Whether a CORS preflight would be triggered
* Whether JavaScript can send the request
* Whether JavaScript can read the response
* Whether authentication cookies may be included
* Whether SameSite behavior may block the session
* Whether the request can be represented accurately
* Whether the representation changes the original body or headers
* Whether only a diagnostic PoC can be produced

Possible classifications:

* Directly feasible
* Feasible with representation changes
* Conditionally feasible
* Requires CORS permission
* Authentication likely excluded
* Not reproducible through conventional CSRF
* Manual verification required
* Unknown

Show clear explanations such as:

```text
Browser feasibility: Conditional

Compatible:
- POST request
- Standard form submission is available

Limitations:
- The original application/json content type cannot be produced by a normal HTML form
- A text/plain alternative changes the original Content-Type
- The target must accept the modified representation

Authentication:
- Session-cookie behavior cannot be confirmed without cookie attributes
```

The analysis must distinguish:

* Navigation
* Form submission
* Image or resource load
* Fetch
* XMLHttpRequest
* Iframe submission

Model browser-controlled headers appropriately.

Do not suggest that the user can manually set forbidden browser headers.

---

# 10. Cookie and SameSite analyzer

Parse and analyze known cookie information.

The tool may receive cookies through:

* A Cookie request header
* Optional manually entered Set-Cookie values
* Imported project metadata

Analyze:

* Cookie name
* Domain
* Path
* Secure
* HttpOnly
* SameSite
* Host-only versus domain cookie
* Possible cross-site inclusion
* Top-level navigation behavior
* Cross-site POST behavior
* Unknown attributes

Display a table with columns such as:

* Name
* SameSite
* Secure
* Domain
* Path
* Expected behavior
* Confidence

Do not declare an endpoint safe solely because `SameSite=Lax` or `SameSite=Strict` is present.

Use language such as:

> This cookie may reduce conventional CSRF exposure in the selected browser context. It does not independently prove the endpoint is protected.

---

# 11. CSRF-defense analyzer

Detect and explain possible defenses.

Analyze:

* CSRF token candidates
* Synchronizer-token patterns
* Double-submit cookie patterns
* Tokens in headers
* Tokens in bodies
* Tokens in query parameters
* Origin checking
* Referer checking
* Fetch Metadata
* Required custom headers
* SameSite cookies
* Reauthentication requirements
* User-confirmation steps
* Cookie-authenticated versus bearer-token-authenticated requests

Token detection must use configurable heuristics.

Examples of likely token names:

* csrf
* csrf_token
* csrftoken
* xsrf
* xsrf_token
* authenticity_token
* request_verification_token
* _token

Do not assume that the presence of a token proves that the server validates it correctly.

Use statuses such as:

* Token candidate detected
* Token validation unknown
* Origin validation unknown
* Custom header may prevent form-based CSRF
* Cookie authentication detected
* Bearer-token authentication detected
* Manual verification required

---

# 12. PoC generator architecture

Implement a plugin-style generator interface.

```ts
interface PocGenerator {
  id: string;
  displayName: string;
  description: string;

  supports(
    request: NormalizedRequest,
    analysis: AnalysisResult
  ): GeneratorSupport;

  generate(
    request: NormalizedRequest,
    options: GenerationOptions
  ): GeneratedPoc;
}
```

Use:

```ts
interface GeneratorSupport {
  supported: boolean;
  confidence: "high" | "medium" | "low";
  changesOriginalRepresentation: boolean;
  reasons: string[];
  limitations: string[];
}
```

Each generated result should contain:

```ts
interface GeneratedPoc {
  id: string;
  technique: string;
  source: string;

  expectedRequest: {
    method: string;
    targetUrl: string;
    contentType?: string;
    bodyDescription?: string;
    browserControlledHeaders: string[];
  };

  assumptions: string[];
  limitations: string[];
  warnings: string[];

  classification:
    | "recommended"
    | "alternative"
    | "diagnostic-only";

  executionRisk:
    | "non-destructive"
    | "state-changing"
    | "sensitive"
    | "unknown";
}
```

---

# 13. Initial PoC generators

Implement these generators:

## Required

1. GET top-level navigation
2. GET image or resource request
3. POST `application/x-www-form-urlencoded`
4. POST `multipart/form-data`
5. POST `text/plain`
6. Hidden iframe form submission
7. Manual-submit form
8. Auto-submit form
9. Fetch-based CORS diagnostic representation
10. XMLHttpRequest-based CORS diagnostic representation

For every generator:

* Escape HTML safely.
* Preserve duplicate form fields.
* Preserve empty values.
* Show what changes from the original request.
* Explain whether the browser can actually send it.
* Explain whether the response can be read.
* Never present a diagnostic-only template as a confirmed exploit.

Rank techniques as:

## Recommended

Closest browser-compatible representation.

## Alternatives

Browser-compatible but with meaningful differences.

## Diagnostic only

Useful for understanding the request, but not expected to execute cross-site without additional server behavior.

---

# 14. Request mutation workbench

Allow the user to create controlled variants of a request.

Support these mutations:

* Remove candidate token
* Empty candidate token
* Replace candidate token
* Remove selected header
* Remove Origin
* Remove Referer
* Change method where explicitly selected
* Change content-type representation
* Exclude selected parameters
* Exclude selected cookies
* Switch between manual and auto-submit

Do not execute mutation tests automatically.

Every mutation must display:

* What changed
* Why the test may be useful
* Whether the resulting request remains browser-feasible
* Whether the representation differs from the original

Do not implement unrestricted automated attack chains.

---

# 15. Safe preview architecture

Never insert generated PoC HTML directly into the application DOM using uncontrolled `dangerouslySetInnerHTML`.

Use sandboxed iframe previews.

Provide two modes:

## Safe preview

* Replace target URL with a harmless placeholder
* Disable real submission
* Allow visual inspection
* Show generated fields
* Never contact the target

Label it clearly:

> Safe Preview — target submission is disabled.

## Controlled execution

* Never run automatically
* Require an explicit confirmation dialog
* Show destination hostname
* Show method
* Show content type
* Show whether cookies may be included
* Show a state-change warning
* Prefer opening in a separate tab
* Do not execute on import, project load, code edit, or tab selection

The confirmation dialog must contain:

* Destination
* Method
* Request type
* Risk classification
* Scope confirmation checkbox
* Cancel button
* Open controlled test button

---

# 16. Project storage

Use:

* `localStorage` for small preferences
* IndexedDB through Dexie for projects and larger data

Use `localStorage` only for:

* Theme
* Density
* Editor font size
* Panel sizes
* Sidebar state
* Last selected generator
* Warning preferences

Use IndexedDB for:

* Projects
* Parsed requests
* Analysis results
* Generated PoCs
* Report drafts
* Imported metadata
* Optional screenshots or attachments

Do not store secrets by default.

---

# 17. Sensitive-data handling

Detect likely sensitive values:

* Cookie
* Authorization
* Proxy-Authorization
* X-API-Key
* API-Key
* X-Auth-Token
* Bearer tokens
* Session IDs
* JWTs
* CSRF tokens
* Password fields
* Secret fields

Default behavior:

* Keep sensitive values in memory.
* Redact them before saving.
* Redact them before exporting.
* Require explicit approval before including them in saved projects.
* Require explicit approval before including them in exports.
* Show exactly which fields will be included.
* Never log them to the browser console.
* Never send them to analytics.
* Never place them in error-reporting services.

Display secrets as masked values.

Example:

```text
Cookie: session=••••••••••••
Authorization: Bearer ••••••••••••
```

Provide:

* Reveal temporarily
* Copy value
* Redact
* Remove
* Include in export

Revealed secrets should automatically hide again after a short period.

---

# 18. Project format

Create a versioned file format using the extension:

```text
.csrfproj
```

Example:

```json
{
  "format": "csrf-forge-project",
  "version": 1,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "applicationVersion": "0.1.0",
  "project": {
    "id": "project-id",
    "name": "Account email change",
    "description": "",
    "requests": [],
    "analyses": [],
    "generatedPocs": [],
    "report": {}
  },
  "security": {
    "secretsIncluded": false,
    "redactedFields": [
      "headers.cookie",
      "headers.authorization"
    ]
  }
}
```

Validate imported project files using Zod.

On import:

1. Check file size.
2. Check file extension.
3. Parse JSON safely.
4. Validate schema.
5. Reject unsupported versions.
6. Reject prototype-pollution values.
7. Show project summary.
8. Show whether secrets are included.
9. Ask before importing sensitive values.
10. Migrate older supported versions.
11. Store the project in IndexedDB.

Never execute imported HTML automatically.

---

# 19. Export features

Implement these exports:

## Project export

```text
project-name.csrfproj
```

## PoC export

```text
csrf-poc.html
```

## Report export

```text
report.md
report.html
```

## Analysis export

```text
analysis.json
```

## Complete ZIP bundle

```text
finding.zip
├── README.md
├── poc.html
├── request-original.txt
├── request-normalized.json
├── analysis.json
├── report.md
└── manifest.json
```

Use JSZip client-side.

Generate checksums for important exported files where practical.

Allow:

* Redacted export
* Unredacted export
* Custom file selection
* Include/exclude source request
* Include/exclude analysis
* Include/exclude generated PoCs
* Include/exclude report

Unredacted exports must show a strong warning.

---

# 20. Report generator

Build a professional bug-bounty report editor.

Include:

* Finding title
* Program or application
* Affected endpoint
* Request method
* Preconditions
* Authentication requirements
* Vulnerability summary
* Technical explanation
* Browser-feasibility explanation
* Reproduction steps
* Generated PoC
* Observed result
* Business impact
* Evidence
* Limitations
* Suggested remediation
* CWE mapping
* Researcher notes
* Verification status

Report status must distinguish:

* PoC generated
* Browser feasibility confirmed
* Request transmitted
* Authentication included
* Server accepted request
* State change manually verified
* State change not verified

Never automatically state that a vulnerability is confirmed solely because HTML was generated.

Support export styles:

* Generic Markdown
* Generic HTML
* HackerOne-style text
* Bugcrowd-style text
* JSON

Use editable templates.

---

# 21. User interface foundation

Use shadcn/ui with Radix primitives as the primary component system.

Do not mix multiple component frameworks.

Use:

* shadcn/ui
* Radix-based dialogs, menus, tooltips, tabs, popovers, dropdowns, accordions, scroll areas, and form controls
* Monaco Editor
* TanStack Table
* Lucide Icons
* Sonner
* react-resizable-panels

Do not use stock shadcn styles unchanged.

Create a custom CSRForge design system.

The interface should feel like:

* VS Code
* Browser DevTools
* Linear
* A professional desktop workbench

It must not feel like:

* A generic admin dashboard
* A cryptocurrency dashboard
* A game
* A neon hacker website
* A marketing landing page
* A “Matrix rain” theme

Avoid:

* Skulls
* Excessive neon green
* Glowing borders
* Fake terminal animations
* “Hack now” language
* Constant red backgrounds
* Sound effects
* Excessive gradients

---

# 22. Main application layout

Create a desktop-style application shell.

```text
┌───────────────────────────────────────────────────────────────┐
│ Logo  Project name           Import  Export  Theme  Settings  │
├────────────┬──────────────────────────────────┬───────────────┤
│ Navigation │ Main workspace                   │ Inspector     │
│            │                                  │               │
│ Request    │ Editors, tables, previews        │ Findings      │
│ Analysis   │                                  │ Properties    │
│ PoC        │                                  │ Warnings      │
│ Preview    │                                  │               │
│ Report     │                                  │               │
├────────────┴──────────────────────────────────┴───────────────┤
│ Parse status | Feasibility | Secrets redacted | Local-only    │
└───────────────────────────────────────────────────────────────┘
```

Navigation:

* Request
* Analysis
* PoC
* Preview
* Report
* Projects
* Settings
* Help

Allow the sidebar and inspector to collapse.

Persist panel sizes in `localStorage`.

Support:

* Dark mode
* Light mode
* System mode
* Comfortable density
* Compact density

---

# 23. Request Studio

The Request Studio is the primary screen.

Layout:

```text
┌───────────────────────────────┬──────────────────────────────┐
│ Raw request                   │ Parsed request               │
│                               │                              │
│ Monaco Editor                 │ Method                       │
│                               │ URL                          │
│                               │ Headers                      │
│                               │ Cookies                      │
│                               │ Query                        │
│                               │ Body                         │
├───────────────────────────────┴──────────────────────────────┤
│ Parse result • Secret warning • Import source               │
└──────────────────────────────────────────────────────────────┘
```

Include:

* Paste request
* Import raw request
* Import cURL
* Import HAR
* Clear
* Format
* Parse
* Copy
* Redact secrets
* Toggle raw/structured view

Empty state:

> Paste an HTTP request, cURL command, or HAR entry.

Buttons:

* Paste example request
* Import file

Privacy note:

> Processing occurs locally in this browser.

---

# 24. Structured request inspector

Display sections for:

* Target
* Method
* Headers
* Cookies
* Query parameters
* Body
* Sensitive values
* Import information

Each field should support:

* Edit
* Copy
* Redact
* Include or exclude from generation
* Show source position
* Show duplicate values
* Show decoding preview

Use TanStack Table for headers, cookies, and parameters.

Do not merge duplicate values.

---

# 25. Analysis screen

Group findings by category.

Suggested groups:

* Browser feasibility
* Authentication
* Request method
* Content type
* Cookies and SameSite
* CSRF token
* Origin
* Referer
* Fetch Metadata
* Custom headers
* Manual verification

Each finding card must include:

* Status
* Title
* Summary
* Explanation
* Evidence
* Confidence
* Recommended next step

Status labels:

* Compatible
* Conditional
* Blocked
* Warning
* Unknown
* Requires verification

Avoid using the label “Vulnerable” unless the user manually confirms the state change.

---

# 26. PoC Workbench

Use a split layout:

```text
┌────────────────────────────────────┬─────────────────────────┐
│ Generated source                   │ Technique details       │
│                                    │                         │
│ Monaco Editor                      │ Classification          │
│                                    │ Assumptions             │
│                                    │ Limitations             │
│                                    │ Expected browser action │
├────────────────────────────────────┴─────────────────────────┤
│ Copy | Download | Safe Preview | Controlled Test            │
└──────────────────────────────────────────────────────────────┘
```

Show:

* Recommended technique
* Alternative techniques
* Diagnostic-only representations

Allow:

* Manual submit versus auto-submit
* Hidden iframe option
* Field inclusion and exclusion
* HTML formatting
* Minified export
* Target placeholder mode
* Comment inclusion
* Generated-request summary

Always show differences from the original request.

---

# 27. Preview screen

Build separate visual states.

## Safe preview

* Green or neutral indicator
* Submission disabled
* Target replaced
* No outbound request
* Shows rendered structure

## Controlled test

* Amber warning
* Destination hostname
* Method
* Content type
* Risk level
* Confirmation checkbox
* Cancel
* Open in new tab

Never automatically submit when:

* A project is imported
* A project is opened
* A generator changes
* A request is edited
* The preview tab is selected
* The application reloads

---

# 28. Project management

No accounts are required.

Create a local Projects screen showing:

* Project name
* Last modified
* Number of requests
* Number of generated PoCs
* Report status
* Whether secrets are stored
* Project format version

Actions:

* New project
* Rename
* Duplicate
* Export
* Import
* Delete
* Clear secrets
* Open
* Download backup

Deletion must require confirmation.

Provide:

> Delete project data from this browser.

Do not claim that browser deletion is cryptographic secure erasure.

---

# 29. Command palette and keyboard shortcuts

Add a keyboard-accessible command palette using:

```text
Ctrl/Cmd + K
```

Commands:

* New project
* Open project
* Import request
* Import project
* Export project
* Parse request
* Generate recommended PoC
* Open safe preview
* Toggle inspector
* Toggle sidebar
* Toggle theme
* Toggle density
* Clear sensitive values
* Open keyboard shortcuts
* Open help

Suggested shortcuts:

* `Ctrl/Cmd + Enter`: parse request
* `Ctrl/Cmd + Shift + G`: generate PoC
* `Ctrl/Cmd + S`: save locally
* `Ctrl/Cmd + Shift + E`: export project
* `Ctrl/Cmd + B`: toggle sidebar
* `Ctrl/Cmd + J`: toggle inspector

Do not override browser shortcuts unnecessarily.

---

# 30. Visual system

Use a restrained professional palette.

## Dark theme

* Near-black neutral background
* Slightly lighter panels
* Subtle gray borders
* Off-white primary text
* Muted secondary text
* Restrained blue accent
* Green for compatible
* Amber for conditional
* Red for blocked or destructive
* Cyan for information

## Light theme

* Warm or cool neutral page
* White or near-white panels
* Subtle borders
* Dark gray text
* Same restrained blue accent
* Accessible status colors

Use semantic design tokens.

Example:

```css
:root {
  --radius: 0.45rem;
}
```

Do not hard-code status colors throughout components.

Create tokens for:

* Compatible
* Conditional
* Blocked
* Warning
* Unknown
* Information
* Sensitive
* Local-only

Use status colors sparingly.

Do not make entire panels red or green.

Use:

* Small status icon
* Badge
* Left-border indicator
* Clear text

---

# 31. Typography

Use:

* Geist Sans for interface text
* Geist Mono for technical values

Acceptable alternatives:

* Inter
* JetBrains Mono

Use monospace only for:

* Requests
* Code
* Headers
* Parameters
* URLs
* IDs
* Technical values

Do not use monospace for ordinary descriptions or navigation.

---

# 32. Responsive behavior

Optimize primarily for desktop.

Desktop:

* Resizable multi-pane layout
* Persistent navigation
* Optional inspector

Tablet:

* Collapsible navigation
* Two-pane views
* Tabs where necessary

Mobile:

* Single-column tabs
* Simplified editor
* Read and copy generated content
* Import and export
* Clear message recommending desktop for advanced analysis

Do not try to force the full desktop layout onto a narrow phone screen.

---

# 33. Accessibility

Meet WCAG 2.2 AA where practical.

Requirements:

* Keyboard-accessible navigation
* Visible focus indicators
* Accessible labels
* Proper dialog focus trapping
* Screen-reader-friendly status text
* Sufficient contrast
* No color-only status communication
* Reduced-motion support
* Accessible tables
* Accessible Monaco alternatives where necessary
* Proper error summaries
* Tooltip content must not contain critical information exclusively

---

# 34. Performance

Requirements:

* Initial interface should load quickly.
* Large parsing tasks must not block the main thread.
* Use Web Workers for large HAR imports and heavy analysis.
* Lazy-load Monaco Editor.
* Lazy-load report preview.
* Avoid loading all project data at startup.
* Paginate or virtualize very large tables.
* Avoid excessive React rerenders.
* Keep generated bundles reasonable.

Use React error boundaries around:

* Monaco
* File imports
* Preview iframe
* IndexedDB operations
* Report renderer

---

# 35. Web Worker design

Implement workers for:

## Request parser worker

Input:

```ts
{
  type: "PARSE_REQUEST";
  format: "raw-http" | "curl" | "har";
  payload: string | object;
}
```

Output:

```ts
{
  type: "PARSE_RESULT";
  request?: NormalizedRequest;
  warnings: ParserWarning[];
  errors: ParserError[];
}
```

## Analysis worker

Input:

```ts
{
  type: "ANALYZE_REQUEST";
  request: NormalizedRequest;
  options: AnalysisOptions;
}
```

Output:

```ts
{
  type: "ANALYSIS_RESULT";
  result: AnalysisResult;
}
```

Use typed message contracts.

Handle worker timeouts and errors gracefully.

---

# 36. Security of the application itself

CSRForge processes potentially sensitive security data.

Implement:

* Strict Content Security Policy where compatible
* No unsafe remote scripts
* No third-party analytics by default
* No request content in logs
* No secret content in error messages
* HTML escaping in generated output
* Safe file parsing
* Imported-project validation
* File-size limits
* ZIP-bomb protections
* Prototype-pollution protections
* No automatic execution of imported HTML
* No `eval`
* No Function constructor
* No uncontrolled dynamic script injection
* No unrestricted `dangerouslySetInnerHTML`

Generated PoCs may contain scripts, but they must only be rendered inside controlled sandboxed previews or exported as files.

---

# 37. Service worker and offline support

Make the app installable as a PWA after the core functionality is stable.

Requirements:

* Offline shell
* Local project access
* Offline parsing
* Offline analysis
* Offline PoC generation
* Clear update notification
* No silent destructive migration
* Versioned cache names
* Safe handling of application updates

Do not cache imported project files outside normal project storage.

---

# 38. Help and education

Include a Help section explaining:

* What CSRF is
* What a PoC is
* Difference between same-origin and same-site
* How SameSite affects cookies
* Why custom headers matter
* Why JSON requests are different
* What a CORS preflight is
* Difference between generated and confirmed
* How to test only authorized targets
* How to produce a strong bug-bounty report
* How local storage works
* How to remove project data

Use neutral educational language.

Do not include instructions for phishing, mass exploitation, stealth delivery, or targeting unauthorized users.

---

# 39. Non-goals

Do not implement these features:

* Login
* Signup
* User accounts
* Cloud synchronization
* Public PoC hosting
* URL shorteners
* Email delivery
* Messaging delivery
* Phishing templates
* Payload obfuscation
* Anti-analysis features
* Sandbox evasion
* Internet-wide scanning
* Bulk target scanning
* Automatic endpoint discovery
* Victim-session capture
* Cookie exfiltration
* Data exfiltration callbacks
* Automatic destructive requests
* Browser exploit functionality
* Malware behavior
* Stealth or persistence
* Automatic claims of vulnerability

---

# 40. MVP scope

Build the project in phases.

## Phase 1: foundation

Implement:

* Next.js static-export project
* TypeScript strict mode
* Tailwind
* shadcn/ui
* Application shell
* Dark and light themes
* Request Studio
* Raw HTTP parser
* Canonical request model
* Structured request inspector
* Secret detection
* IndexedDB storage
* Project creation
* Project import and export

## Phase 2: analysis

Implement:

* Browser-feasibility engine
* Method analysis
* Content-type analysis
* Header analysis
* Cookie analysis
* SameSite analysis
* Token-candidate analysis
* Origin analysis
* Referer analysis
* Fetch Metadata analysis
* Explainable finding cards

## Phase 3: generation

Implement:

* URL-encoded form generator
* Multipart form generator
* Text/plain form generator
* GET navigation generator
* Image/resource generator
* Hidden iframe option
* Manual submit
* Auto-submit
* Fetch diagnostic generator
* XHR diagnostic generator
* Technique ranking
* Difference viewer
* Safe preview
* HTML download

## Phase 4: reports and evidence

Implement:

* Report builder
* Markdown export
* HTML export
* JSON export
* ZIP evidence bundle
* Report templates
* Verification-status tracking

## Phase 5: quality

Implement:

* Web Workers
* PWA
* Accessibility review
* Performance review
* Parser fuzz tests
* Import security tests
* Playwright end-to-end tests
* Documentation
* Example projects

Do not begin later phases until earlier phases are stable.

---

# 41. Testing requirements

Create comprehensive tests.

## Unit tests

Test:

* Raw HTTP parser
* cURL parser
* HAR parser
* URL parser
* Query parser
* Form parser
* Multipart parser
* Cookie parser
* Secret detector
* Redaction engine
* Browser-feasibility rules
* PoC generators
* HTML escaping
* Project migrations
* Project validation
* Report rendering

## Integration tests

Test:

* Import request to generated PoC
* Save and reopen project
* Export and reimport project
* Redacted export
* Unredacted export warning
* Safe preview behavior
* No execution on load
* Duplicate parameter preservation
* Large HAR processing
* IndexedDB migration

## End-to-end tests

Use Playwright to test:

* Create project
* Paste request
* Parse request
* Inspect structured fields
* Generate PoC
* Open safe preview
* Download HTML
* Export project
* Import project
* Generate report
* Change theme
* Use keyboard shortcuts
* Confirm no automatic request is sent

Create a test target inside the test suite that records whether a request was submitted.

The application must never contact real external targets during automated tests.

---

# 42. Example requests

Include safe example requests using reserved domains such as:

* `example.com`
* `example.test`
* `localhost`

Example:

```http
POST /account/preferences HTTP/1.1
Host: target.example.test
Content-Type: application/x-www-form-urlencoded
Cookie: session=example-session

email_notifications=false&display_name=Researcher
```

Clearly mark examples as fictional.

---

# 43. Documentation requirements

Create:

* `README.md`
* `CONTRIBUTING.md`
* `SECURITY.md`
* `PRIVACY.md`
* `ARCHITECTURE.md`
* `PROJECT_FORMAT.md`
* `THREAT_MODEL.md`
* `TESTING.md`
* `ROADMAP.md`

The README must include:

* Purpose
* Screenshots or placeholders
* Features
* Installation
* Development
* Static build
* Hosting
* Privacy model
* Authorized-use notice
* Limitations
* Roadmap

The privacy document must explicitly state:

* Requests are processed locally.
* Projects are stored in browser storage.
* No account is required.
* No request data is uploaded by the core application.
* Clearing site data removes locally stored projects.
* Exported project files are controlled by the user.
* Sensitive data may be included only when explicitly selected.

---

# 44. Code-quality rules

Use:

* TypeScript strict mode
* No implicit `any`
* Small focused modules
* Pure functions for parsers and analyzers
* Runtime validation at trust boundaries
* Typed error handling
* Exhaustive switch statements
* Named exports
* Feature-oriented folders
* Clear comments for non-obvious security logic
* No unnecessary abstractions
* No duplicated analysis rules
* No hidden side effects
* No business logic inside UI components
* No large “god components”
* No placeholder TODO implementations in completed features

Prefer deterministic outputs.

The same input and configuration should produce the same generated PoC and analysis.

---

# 45. UX language

Use professional and precise terminology.

Prefer:

* Generate PoC
* Analyze request
* Browser feasibility
* Controlled test
* Requires verification
* Representation changed
* Authentication may be excluded
* Token candidate detected
* State change not confirmed

Avoid:

* Hack
* Exploit target
* Attack victim
* Military-grade
* Unhackable
* Guaranteed vulnerability
* One-click exploit
* Weaponized
* Bypass everything

The product may use the term “exploit” only where technically necessary, but the normal UI should use “PoC” and “validation.”

---

# 46. Acceptance criteria

The MVP is complete only when all of the following are true:

1. The application builds as a static Next.js export.
2. It has no runtime backend dependency.
3. It requires no login or signup.
4. Projects are stored locally.
5. Projects can be exported and reimported.
6. Raw HTTP requests can be parsed.
7. Duplicate parameters are preserved.
8. Sensitive headers are detected and redacted.
9. Browser feasibility is explained.
10. At least five useful PoC techniques are generated.
11. Generated PoCs are classified as recommended, alternative, or diagnostic.
12. Safe preview cannot contact the original target.
13. Controlled testing requires explicit confirmation.
14. Opening an imported project never executes a PoC.
15. Reports can be exported as Markdown and HTML.
16. Complete project bundles can be exported as ZIP files.
17. The interface works in dark and light modes.
18. The interface is keyboard accessible.
19. The interface does not use childish hacker aesthetics.
20. Unit, integration, and end-to-end tests pass.
21. The README and privacy documentation are complete.
22. The application contains an authorized-use notice.
23. No sensitive request content is sent to external services.

---

# 47. First implementation task

Begin by producing:

1. A concise architecture summary.
2. The proposed folder structure.
3. The canonical TypeScript data models.
4. The IndexedDB schema.
5. The UI route map.
6. The design-token plan.
7. The parser interface.
8. The analyzer interface.
9. The generator interface.
10. The phased implementation checklist.

Then scaffold the project and implement Phase 1.

Do not attempt to build every feature inside one oversized file.

After Phase 1:

* Run type checking.
* Run linting.
* Run unit tests.
* Build the static export.
* Fix all errors.
* Summarize implemented functionality.
* List remaining phases.
* Do not claim incomplete features are finished.

---

# 48. Final product goal

CSRForge should become a polished, privacy-preserving, free CSRF proof-of-concept workbench for authorized researchers.

Its main advantage must not be the number of HTML templates.

Its advantage should be:

* Excellent request parsing
* Browser-realistic feasibility analysis
* Clear explanation of limitations
* Accurate PoC generation
* Safe local project handling
* Professional reporting
* High-quality user experience
* Transparent privacy
* Reproducible results
