import Dexie, { type Table } from "dexie";
import type { AnalysisResult } from "@/core/models/analysis";
import type { GeneratedPoc } from "@/core/models/generator";
import type { NormalizedRequest } from "@/core/models/request";

export interface StoredProject {
  schemaVersion: 1;
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  requests: NormalizedRequest[];
  analyses: AnalysisResult[];
  generatedPocs: GeneratedPoc[];
  report: Record<string, unknown>;
  secretsStored: boolean;
}

class CSRForgeDatabase extends Dexie {
  projects!: Table<StoredProject, string>;

  constructor() {
    super("csrf-forge");
    this.version(1).stores({
      projects: "id, name, updatedAt, secretsStored"
    });
  }
}

export const db = new CSRForgeDatabase();
