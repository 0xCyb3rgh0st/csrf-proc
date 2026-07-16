"use client";

import { useMemo, useState } from "react";
import { Copy, Download, Eraser, Eye, Play, Save, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PropertyRow } from "@/components/design-system/property-row";
import { SecurityAlert } from "@/components/design-system/security-alert";
import type { GeneratedPoc } from "@/core/models/generator";
import type { NormalizedRequest } from "@/core/models/request";
import { generateCsrfPoc, safePreviewSource, type CsrfTechnique } from "@/core/generators/csrf-poc";
import { parseRawHttpRequest } from "@/core/parsers/http";
import { exportProjectFile } from "@/storage/project-file";
import { createProject, saveProject } from "@/storage/repositories/projects";
import { useWorkspaceStore } from "@/stores/workspace-store";

const exampleRequest = `POST /account/preferences?source=profile&source=dashboard HTTP/1.1
Host: target.example.test
Content-Type: application/x-www-form-urlencoded
Cookie: session=example-session

email_notifications=false&display_name=Researcher&csrf_token=example-token`;

const techniqueOptions: Array<{ value: CsrfTechnique; label: string }> = [
  { value: "auto", label: "Auto-select based on request features" },
  { value: "urlencoded", label: "URL-encoded form" },
  { value: "multipart", label: "Multipart form" },
  { value: "text", label: "Plain text form" },
  { value: "xhr", label: "Cross-domain XHR (modern browsers only)" }
];

type ProtocolOption = "original" | "https" | "http";

function downloadFile(filename: string, content: string, type = "application/json"): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function RequestStudio(): React.ReactElement {
  const { rawInput, setRawInput, currentRequest, lastImport, setImportResult, clear } = useWorkspaceStore();
  const [generatedPocs, setGeneratedPocs] = useState<GeneratedPoc[]>([]);
  const [selectedPocIndex, setSelectedPocIndex] = useState(0);
  const [autoSubmit, setAutoSubmit] = useState(true);
  const [selectedTechniques, setSelectedTechniques] = useState<CsrfTechnique[]>(["auto"]);
  const [protocol, setProtocol] = useState<ProtocolOption>("original");
  const [showPreview, setShowPreview] = useState(false);
  const sensitiveCount = lastImport?.sensitiveSummary.length ?? 0;
  const generatedPoc = generatedPocs[selectedPocIndex];

  const requestBodySummary = useMemo(() => {
    if (!currentRequest) return "No request parsed";
    if (currentRequest.body.kind === "none") return "No body";
    if (currentRequest.body.kind === "urlencoded") return `${currentRequest.body.fields.length} URL-encoded field(s)`;
    return currentRequest.body.kind;
  }, [currentRequest]);

  function parse(): void {
    const result = parseRawHttpRequest(rawInput);
    setImportResult(result);
    setGeneratedPocs([]);
    setSelectedPocIndex(0);
    setShowPreview(false);
    if (result.request) {
      toast.success("Request parsed locally");
    } else {
      toast.error("Request could not be parsed");
    }
  }

  async function saveLocal(): Promise<void> {
    if (!currentRequest) return;
    const project = createProject(`${currentRequest.method} ${currentRequest.target.path}`);
    project.requests = [currentRequest];
    await saveProject(project, false);
    toast.success("Project saved with secrets redacted");
  }

  function exportRedacted(): void {
    if (!currentRequest) return;
    const project = createProject(`${currentRequest.method} ${currentRequest.target.path}`);
    project.requests = [currentRequest];
    const projectFile = exportProjectFile(project, false);
    downloadFile(`${project.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.csrfproj`, JSON.stringify(projectFile, null, 2));
  }

  function requestWithProtocol(request: NormalizedRequest): NormalizedRequest {
    if (protocol === "original") return request;
    const url = new URL(request.target.url);
    const port = protocol === "https" ? 443 : 80;
    url.protocol = `${protocol}:`;
    url.port = "";
    return {
      ...request,
      target: {
        ...request.target,
        scheme: protocol,
        port,
        url: url.toString()
      }
    };
  }

  function toggleTechnique(value: CsrfTechnique): void {
    setSelectedTechniques((current) => {
      if (current.includes(value)) {
        const next = current.filter((item) => item !== value);
        return next.length ? next : ["auto"];
      }
      return [...current, value];
    });
  }

  function generatePoc(): void {
    if (!currentRequest) return;
    const request = requestWithProtocol(currentRequest);
    const pocs = selectedTechniques.map((technique) => generateCsrfPoc(request, autoSubmit, technique));
    setGeneratedPocs(pocs);
    setSelectedPocIndex(0);
    setShowPreview(false);
    toast.success(`${pocs.length} CSRF PoC${pocs.length === 1 ? "" : "s"} generated`);
  }

  async function copyPoc(): Promise<void> {
    if (!generatedPoc) return;
    await navigator.clipboard.writeText(generatedPoc.source);
    toast.success("PoC copied");
  }

  function downloadPoc(): void {
    if (!generatedPoc) return;
    downloadFile("csrf-poc.html", generatedPoc.source, "text/html");
  }

  function clearAll(): void {
    clear();
    setGeneratedPocs([]);
    setSelectedPocIndex(0);
    setShowPreview(false);
  }

  return (
    <div className="space-y-4">
      <SecurityAlert title="Authorized use only" tone="warning">
        CSRForge is intended only for systems you own or are explicitly authorized to test.
      </SecurityAlert>
      <SecurityAlert title="Local processing">
        Request parsing, analysis, project storage, and PoC generation occur locally in your browser.
      </SecurityAlert>

      <div className="grid min-h-[38rem] gap-4 lg:grid-cols-2">
        <Card className="flex min-h-[32rem] flex-col">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Raw Request</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setRawInput(exampleRequest)} variant="ghost">
                <Wand2 className="h-4 w-4" aria-hidden="true" />
                Example
              </Button>
              <Button onClick={clearAll} variant="ghost">
                <Eraser className="h-4 w-4" aria-hidden="true" />
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3">
            <textarea
              aria-label="Raw HTTP request"
              className="min-h-[26rem] flex-1 resize-none rounded-md border bg-background p-3 font-mono text-sm"
              placeholder="Paste an HTTP request, cURL command, or HAR entry."
              value={rawInput}
              onChange={(event) => setRawInput(event.target.value)}
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">Processing occurs locally in this browser.</p>
              <Button onClick={parse} variant="primary">
                <Play className="h-4 w-4" aria-hidden="true" />
                Parse request
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[32rem]">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Parsed Request</CardTitle>
            {currentRequest ? <Badge tone={sensitiveCount > 0 ? "sensitive" : "compatible"}>{sensitiveCount} sensitive field(s)</Badge> : null}
          </CardHeader>
          <CardContent>
            {currentRequest ? (
              <div className="space-y-5">
                <dl>
                  <PropertyRow label="Method" value={currentRequest.method} mono />
                  <PropertyRow label="URL" value={currentRequest.target.url} mono />
                  <PropertyRow label="HTTP version" value={currentRequest.httpVersion || "Not provided"} mono />
                  <PropertyRow label="Body" value={requestBodySummary} />
                  <PropertyRow label="Import source" value={currentRequest.provenance.importer} />
                </dl>

                <div>
                  <h3 className="mb-2 text-sm font-semibold">Headers</h3>
                  <div className="overflow-hidden rounded-md border">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-muted text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2">Name</th>
                          <th className="px-3 py-2">Value</th>
                          <th className="px-3 py-2">Sensitive</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentRequest.headers.map((header) => (
                          <tr key={header.id} className="border-t">
                            <td className="px-3 py-2 font-mono">{header.name}</td>
                            <td className="max-w-[18rem] break-words px-3 py-2 font-mono">{header.sensitive ? "[masked]" : header.value}</td>
                            <td className="px-3 py-2">{header.sensitive ? "Yes" : "No"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold">Parameters</h3>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="rounded-md border p-3">
                      <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Query</p>
                      {currentRequest.queryParameters.length ? (
                        currentRequest.queryParameters.map((param) => (
                          <p key={param.id} className="break-words font-mono text-sm">
                            {param.name || "(empty)"} = {param.sensitive ? "[masked]" : param.value}
                          </p>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No query parameters</p>
                      )}
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Body</p>
                      {currentRequest.body.kind === "urlencoded" && currentRequest.body.fields.length ? (
                        currentRequest.body.fields.map((param) => (
                          <p key={param.id} className="break-words font-mono text-sm">
                            {param.name || "(empty)"} = {param.sensitive ? "[masked]" : param.value}
                          </p>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No URL-encoded body fields</p>
                      )}
                    </div>
                  </div>
                </div>

                {lastImport?.errors.length ? (
                  <SecurityAlert title="Partial parse warnings" tone="warning">
                    {lastImport.errors.map((error) => error.message).join(" ")}
                  </SecurityAlert>
                ) : null}

                <div className="flex flex-wrap justify-end gap-2">
                  <Button onClick={saveLocal}>
                    <Save className="h-4 w-4" aria-hidden="true" />
                    Save locally
                  </Button>
                  <Button onClick={exportRedacted}>
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Export redacted
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[24rem] items-center justify-center rounded-md border border-dashed text-center">
                <div>
                  <p className="font-medium">Paste an HTTP request, cURL command, or HAR entry.</p>
                  <p className="mt-1 text-sm text-muted-foreground">Phase 1 currently parses raw HTTP requests.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>CSRF PoC Generator</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Select one or more techniques and generate Burp-style PoC HTML.
            </p>
          </div>
          {generatedPoc ? <Badge tone={generatedPoc.classification === "recommended" ? "compatible" : "conditional"}>{generatedPoc.classification}</Badge> : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 rounded-md border p-3 lg:grid-cols-[1fr_auto_auto]">
            <div>
              <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">CSRF technique</p>
              <div className="grid gap-2 md:grid-cols-2">
                {techniqueOptions.map((option) => (
                  <label key={option.value} className="flex items-center gap-2 rounded-md bg-muted/60 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedTechniques.includes(option.value)}
                      onChange={() => toggleTechnique(option.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid content-start gap-2">
              <p className="text-xs font-medium uppercase text-muted-foreground">Protocol</p>
              <label className="flex items-center gap-2 rounded-md bg-muted/60 px-3 py-2 text-sm">
                <input type="radio" checked={protocol === "original"} onChange={() => setProtocol("original")} />
                Original
              </label>
              <label className="flex items-center gap-2 rounded-md bg-muted/60 px-3 py-2 text-sm">
                <input type="radio" checked={protocol === "https"} onChange={() => setProtocol("https")} />
                HTTPS
              </label>
              <label className="flex items-center gap-2 rounded-md bg-muted/60 px-3 py-2 text-sm">
                <input type="radio" checked={protocol === "http"} onChange={() => setProtocol("http")} />
                HTTP
              </label>
            </div>
            <div className="flex content-start items-start gap-2 lg:flex-col">
              <label className="inline-flex h-9 items-center gap-2 rounded-md bg-muted px-3 text-sm">
                <input
                  type="checkbox"
                  checked={autoSubmit}
                  onChange={(event) => setAutoSubmit(event.currentTarget.checked)}
                />
                Auto-submit
              </label>
              <Button onClick={generatePoc} variant="primary" disabled={!currentRequest}>
                <Wand2 className="h-4 w-4" aria-hidden="true" />
                Generate PoC
              </Button>
            </div>
          </div>

          {generatedPocs.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              {generatedPocs.map((poc, index) => (
                <Button
                  key={`${poc.technique}-${index}`}
                  variant={index === selectedPocIndex ? "primary" : "secondary"}
                  onClick={() => {
                    setSelectedPocIndex(index);
                    setShowPreview(false);
                  }}
                >
                  {poc.technique}
                </Button>
              ))}
            </div>
          ) : null}

          {generatedPoc ? (
            <div className="grid gap-4 xl:grid-cols-[1fr_24rem]">
              <div className="space-y-3">
                <textarea
                  aria-label="Generated CSRF PoC source"
                  className="min-h-[24rem] w-full resize-y rounded-md border bg-background p-3 font-mono text-sm"
                  value={generatedPoc.source}
                  onChange={(event) => {
                    const next = [...generatedPocs];
                    next[selectedPocIndex] = { ...generatedPoc, source: event.currentTarget.value };
                    setGeneratedPocs(next);
                  }}
                />
                <div className="flex flex-wrap justify-end gap-2">
                  <Button onClick={() => setShowPreview((value) => !value)}>
                    <Eye className="h-4 w-4" aria-hidden="true" />
                    Safe Preview
                  </Button>
                  <Button onClick={() => void copyPoc()}>
                    <Copy className="h-4 w-4" aria-hidden="true" />
                    Copy
                  </Button>
                  <Button onClick={downloadPoc}>
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Download HTML
                  </Button>
                </div>
                {showPreview ? (
                  <div className="rounded-md border">
                    <div className="border-b bg-muted px-3 py-2 text-sm font-medium">Safe Preview - target submission is disabled.</div>
                    <iframe
                      title="Safe preview"
                      sandbox=""
                      className="h-72 w-full bg-white"
                      srcDoc={safePreviewSource(generatedPoc)}
                    />
                  </div>
                ) : null}
              </div>
              <aside className="space-y-4 rounded-md border p-4">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Technique</p>
                  <p className="mt-1 text-sm font-medium">{generatedPoc.technique}</p>
                </div>
                <dl>
                  <PropertyRow label="Method" value={generatedPoc.expectedRequest.method} mono />
                  <PropertyRow label="Target" value={generatedPoc.expectedRequest.targetUrl} mono />
                  <PropertyRow label="Content-Type" value={generatedPoc.expectedRequest.contentType || "Browser default"} mono />
                  <PropertyRow label="Risk" value={generatedPoc.executionRisk} />
                </dl>
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Limitations</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {generatedPoc.limitations.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                {generatedPoc.warnings.length ? (
                  <SecurityAlert title="Requires verification" tone="warning">
                    {generatedPoc.warnings.join(" ")}
                  </SecurityAlert>
                ) : null}
              </aside>
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-8 text-center">
              <p className="font-medium">No PoC generated yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Parse a request, then choose Generate PoC.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
