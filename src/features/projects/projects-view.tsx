"use client";

import { useEffect, useState } from "react";
import { Download, FolderPlus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { parseProjectFile } from "@/storage/project-file";
import { createProject, deleteProject, listProjects, saveProject } from "@/storage/repositories/projects";
import type { StoredProject } from "@/storage/database";

function downloadFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ProjectsView(): React.ReactElement {
  const [projects, setProjects] = useState<StoredProject[]>([]);

  async function refresh(): Promise<void> {
    setProjects(await listProjects());
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function newProject(): Promise<void> {
    await saveProject(createProject(), false);
    await refresh();
    toast.success("Project created");
  }

  async function removeProject(project: StoredProject): Promise<void> {
    const confirmed = window.confirm(`Delete project data from this browser?\n\n${project.name}`);
    if (!confirmed) return;
    await deleteProject(project.id);
    await refresh();
    toast.success("Project deleted");
  }

  async function importProject(file: File): Promise<void> {
    const parsed = parseProjectFile(await file.text());
    const project = createProject(parsed.project.name);
    project.id = parsed.project.id;
    project.description = parsed.project.description;
    project.requests = parsed.project.requests as StoredProject["requests"];
    project.analyses = parsed.project.analyses as StoredProject["analyses"];
    project.generatedPocs = parsed.project.generatedPocs as StoredProject["generatedPocs"];
    project.report = parsed.project.report;
    await saveProject(project, parsed.security.secretsIncluded);
    await refresh();
    toast.success("Project imported");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">Stored locally in this browser through IndexedDB.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={newProject}>
            <FolderPlus className="h-4 w-4" aria-hidden="true" />
            New project
          </Button>
          <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-muted px-3 text-sm font-medium">
            <Upload className="h-4 w-4" aria-hidden="true" />
            Import
            <input
              className="sr-only"
              type="file"
              accept=".csrfproj,application/json"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (file) void importProject(file);
                event.currentTarget.value = "";
              }}
            />
          </label>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Local Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length ? (
            <div className="overflow-hidden rounded-md border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Last modified</th>
                    <th className="px-3 py-2">Requests</th>
                    <th className="px-3 py-2">Secrets</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id} className="border-t">
                      <td className="px-3 py-2 font-medium">{project.name}</td>
                      <td className="px-3 py-2">{new Date(project.updatedAt).toLocaleString()}</td>
                      <td className="px-3 py-2">{project.requests.length}</td>
                      <td className="px-3 py-2">
                        <Badge tone={project.secretsStored ? "warning" : "compatible"}>
                          {project.secretsStored ? "Stored" : "Redacted"}
                        </Badge>
                      </td>
                      <td className="flex flex-wrap gap-2 px-3 py-2">
                        <Button
                          onClick={() =>
                            downloadFile(`${project.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.csrfproj`, JSON.stringify(project, null, 2))
                          }
                          variant="ghost"
                        >
                          <Download className="h-4 w-4" aria-hidden="true" />
                          Backup
                        </Button>
                        <Button onClick={() => void removeProject(project)} variant="ghost">
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-8 text-center">
              <p className="font-medium">No local projects yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Create a project from the workspace or import a `.csrfproj` file.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
