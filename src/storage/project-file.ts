import { redactRequest } from "@/core/redaction/secrets";
import { csrfProjectSchema, type CsrfProjectFile } from "@/core/validation/project";
import type { StoredProject } from "@/storage/database";

export function exportProjectFile(project: StoredProject, includeSecrets = false): CsrfProjectFile {
  return {
    format: "csrf-forge-project",
    version: 1,
    createdAt: new Date().toISOString(),
    applicationVersion: "0.1.0",
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      requests: includeSecrets ? project.requests : project.requests.map(redactRequest),
      analyses: project.analyses,
      generatedPocs: project.generatedPocs,
      report: project.report
    },
    security: {
      secretsIncluded: includeSecrets,
      redactedFields: includeSecrets ? [] : ["headers", "cookies", "queryParameters", "body.fields"]
    }
  };
}

export function parseProjectFile(input: string): CsrfProjectFile {
  const parsed = JSON.parse(input) as unknown;
  return csrfProjectSchema.parse(parsed);
}
