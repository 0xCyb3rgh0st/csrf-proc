import { z } from "zod";

export const csrfProjectSchema = z.object({
  format: z.literal("csrf-forge-project"),
  version: z.literal(1),
  createdAt: z.string(),
  applicationVersion: z.string(),
  project: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    requests: z.array(z.unknown()),
    analyses: z.array(z.unknown()),
    generatedPocs: z.array(z.unknown()),
    report: z.record(z.unknown())
  }),
  security: z.object({
    secretsIncluded: z.boolean(),
    redactedFields: z.array(z.string())
  })
});

export type CsrfProjectFile = z.infer<typeof csrfProjectSchema>;
