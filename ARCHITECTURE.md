# Architecture

CSRForge is a fully static Next.js App Router application. Business logic is implemented as deterministic TypeScript modules under `src/core`, while React components focus on presentation and user interaction.

## Folder Structure

- `src/app`: routes and application shell
- `src/components/ui`: low-level Radix/shadcn-style primitives
- `src/components/design-system`: CSRForge-specific UI components
- `src/features`: feature screens and workflows
- `src/core`: models, parsers, analyzers, generators, redaction, validation
- `src/storage`: Dexie database and repositories
- `src/stores`: Zustand state
- `src/workers`: typed worker contracts
- `src/test-corpus`: parser examples

## Phase 1 Design

Phase 1 establishes the static app, local storage, canonical request model, raw HTTP parsing, structured inspection, and project import/export. Analysis and PoC generation interfaces are present so later phases can be added without rewriting the core.
