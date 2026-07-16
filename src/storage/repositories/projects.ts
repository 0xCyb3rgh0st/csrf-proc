import { redactRequest } from "@/core/redaction/secrets";
import { db, type StoredProject } from "@/storage/database";

export function createProject(name = "Untitled project"): StoredProject {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    id: crypto.randomUUID(),
    name,
    description: "",
    createdAt: now,
    updatedAt: now,
    requests: [],
    analyses: [],
    generatedPocs: [],
    report: {},
    secretsStored: false
  };
}

export async function saveProject(project: StoredProject, includeSecrets = false): Promise<string> {
  const safeProject: StoredProject = {
    ...project,
    updatedAt: new Date().toISOString(),
    secretsStored: includeSecrets,
    requests: includeSecrets ? project.requests : project.requests.map(redactRequest)
  };
  await db.projects.put(safeProject);
  return safeProject.id;
}

export async function listProjects(): Promise<StoredProject[]> {
  return db.projects.orderBy("updatedAt").reverse().toArray();
}

export async function deleteProject(id: string): Promise<void> {
  await db.projects.delete(id);
}
