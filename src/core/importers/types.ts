import type { ImportResult } from "@/core/models/request";

export interface RequestImporter {
  id: string;
  displayName: string;
  canImport(input: unknown): boolean;
  import(input: unknown): Promise<ImportResult>;
}
