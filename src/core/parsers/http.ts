import type { ImportResult, NormalizedRequest, ParserError, ParserWarning, RequestParameter } from "@/core/models/request";
import { isSensitiveField, sensitiveSummary } from "@/core/redaction/secrets";

function id(prefix: string, index?: number): string {
  const suffix = index === undefined ? crypto.randomUUID() : `${index}-${crypto.randomUUID()}`;
  return `${prefix}-${suffix}`;
}

function splitLines(input: string): string[] {
  return input.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
}

export function parseParameterString(input: string): RequestParameter[] {
  if (input === "") return [];
  return input.split("&").map((raw, originalIndex) => {
    const equalsIndex = raw.indexOf("=");
    const hasEquals = equalsIndex !== -1;
    const rawName = hasEquals ? raw.slice(0, equalsIndex) : raw;
    const rawValue = hasEquals ? raw.slice(equalsIndex + 1) : "";
    let name = rawName;
    let value = rawValue;
    try {
      name = decodeURIComponent(rawName.replace(/\+/g, " "));
      value = decodeURIComponent(rawValue.replace(/\+/g, " "));
    } catch {
      name = rawName;
      value = rawValue;
    }
    return {
      id: id("param", originalIndex),
      name,
      value,
      raw,
      hasEquals,
      originalIndex,
      sensitive: isSensitiveField(name, value)
    };
  });
}

function parseCookies(cookieHeader: string): NormalizedRequest["cookies"] {
  return cookieHeader
    .split(";")
    .map((cookie, originalIndex) => {
      const trimmed = cookie.trim();
      const equalsIndex = trimmed.indexOf("=");
      const name = equalsIndex === -1 ? trimmed : trimmed.slice(0, equalsIndex);
      const value = equalsIndex === -1 ? "" : trimmed.slice(equalsIndex + 1);
      return {
        id: id("cookie", originalIndex),
        name,
        value,
        source: "cookie-header" as const,
        sensitive: true as const
      };
    })
    .filter((cookie) => cookie.name.length > 0);
}

function defaultPort(scheme: "http" | "https"): number {
  return scheme === "https" ? 443 : 80;
}

function buildTarget(rawTarget: string, hostHeader: string | undefined, warnings: ParserWarning[]): NormalizedRequest["target"] {
  const fallbackHost = hostHeader || "example.test";
  const scheme: "http" | "https" = fallbackHost.startsWith("localhost") ? "http" : "https";
  const base = `${scheme}://${fallbackHost}`;
  const url = new URL(rawTarget, base);

  if (hostHeader && url.host !== hostHeader && /^https?:\/\//i.test(rawTarget)) {
    warnings.push({
      code: "HOST_URL_CONFLICT",
      message: "The absolute request URL host differs from the Host header.",
      field: "target"
    });
  }

  const targetScheme = url.protocol === "http:" ? "http" : "https";
  return {
    scheme: targetScheme,
    hostname: url.hostname,
    port: url.port ? Number(url.port) : defaultPort(targetScheme),
    path: url.pathname || "/",
    rawQuery: url.search ? url.search.slice(1) : "",
    url: url.toString()
  };
}

function parseBody(contentType: string | undefined, rawBody: string): NormalizedRequest["body"] {
  if (!rawBody) return { kind: "none" };
  const normalizedType = contentType?.toLowerCase() || "";
  if (normalizedType.includes("application/x-www-form-urlencoded")) {
    return { kind: "urlencoded", raw: rawBody, fields: parseParameterString(rawBody) };
  }
  if (normalizedType.includes("application/json")) {
    try {
      return { kind: "json", raw: rawBody, parsed: JSON.parse(rawBody) as unknown };
    } catch {
      return { kind: "json", raw: rawBody };
    }
  }
  if (normalizedType.includes("xml")) return { kind: "xml", raw: rawBody };
  if (normalizedType.includes("multipart/form-data")) {
    const boundary = /boundary="?([^";]+)"?/i.exec(contentType || "")?.[1];
    return { kind: "multipart", raw: rawBody, boundary, parts: [] };
  }
  return { kind: "text", raw: rawBody };
}

export function parseRawHttpRequest(input: string): ImportResult {
  const errors: ParserError[] = [];
  const warnings: ParserWarning[] = [];
  const lines = splitLines(input.trim());
  const requestLine = lines[0] || "";
  const requestLineMatch = /^(\S+)\s+(\S+)(?:\s+HTTP\/([0-9.]+))?$/i.exec(requestLine);

  if (!requestLineMatch) {
    return {
      warnings,
      errors: [
        {
          code: "INVALID_REQUEST_LINE",
          message: "The first line must contain a method and request target.",
          line: 1,
          suggestion: "Use a line such as POST /path HTTP/1.1.",
          partial: false
        }
      ],
      unsupportedFields: [],
      sensitiveSummary: [],
      sourceFormat: "raw-http"
    };
  }

  const headerLines: string[] = [];
  let cursor = 1;
  for (; cursor < lines.length; cursor += 1) {
    if (lines[cursor] === "") {
      cursor += 1;
      break;
    }
    headerLines.push(lines[cursor]);
  }

  const headers = headerLines.map((line, originalIndex) => {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) {
      errors.push({
        code: "INVALID_HEADER",
        message: "A header line is missing a colon.",
        line: originalIndex + 2,
        field: line,
        suggestion: "Use the format Name: value.",
        partial: true
      });
    }
    const name = colonIndex === -1 ? line.trim() : line.slice(0, colonIndex).trim();
    const value = colonIndex === -1 ? "" : line.slice(colonIndex + 1).trimStart();
    return {
      id: id("header", originalIndex),
      name,
      value,
      originalIndex,
      sensitive: isSensitiveField(name, value)
    };
  });

  const hostHeader = headers.find((header) => header.name.toLowerCase() === "host")?.value;
  const contentType = headers.find((header) => header.name.toLowerCase() === "content-type")?.value;
  const cookieHeaders = headers.filter((header) => header.name.toLowerCase() === "cookie");
  const target = buildTarget(requestLineMatch[2], hostHeader, warnings);
  const rawBody = lines.slice(cursor).join("\n");
  const request: NormalizedRequest = {
    schemaVersion: 1,
    id: id("request"),
    target,
    method: requestLineMatch[1].toUpperCase(),
    httpVersion: requestLineMatch[3],
    headers,
    cookies: cookieHeaders.flatMap((header) => parseCookies(header.value)),
    queryParameters: parseParameterString(target.rawQuery),
    body: parseBody(contentType, rawBody),
    provenance: {
      importer: "raw-http",
      importedAt: new Date().toISOString(),
      rawInput: input
    }
  };

  return {
    request,
    warnings,
    errors,
    unsupportedFields: [],
    sensitiveSummary: sensitiveSummary(request),
    sourceFormat: "raw-http"
  };
}
