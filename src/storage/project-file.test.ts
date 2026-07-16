import { describe, expect, it } from "vitest";
import { parseRawHttpRequest } from "@/core/parsers/http";
import { createProject } from "@/storage/repositories/projects";
import { exportProjectFile, parseProjectFile } from "./project-file";

describe("project files", () => {
  it("exports valid redacted .csrfproj data", () => {
    const parsed = parseRawHttpRequest(`GET /?session=secret HTTP/1.1
Host: target.example.test
Cookie: session=secret

`);
    const project = createProject("Example");
    project.requests = parsed.request ? [parsed.request] : [];

    const file = exportProjectFile(project, false);
    const reparsed = parseProjectFile(JSON.stringify(file));

    expect(reparsed.format).toBe("csrf-forge-project");
    expect(reparsed.security.secretsIncluded).toBe(false);
    expect(JSON.stringify(reparsed)).toContain("[REDACTED]");
  });
});
