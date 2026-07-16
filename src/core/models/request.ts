export interface RequestParameter {
  id: string;
  name: string;
  value: string;
  raw: string;
  hasEquals: boolean;
  originalIndex: number;
  sensitive: boolean;
}

export interface MultipartPart {
  id: string;
  headers: Array<{
    id: string;
    name: string;
    value: string;
    originalIndex: number;
    sensitive: boolean;
  }>;
  name?: string;
  filename?: string;
  contentType?: string;
  value?: string;
  sensitive: boolean;
}

export interface NormalizedRequest {
  schemaVersion: 1;
  id: string;
  target: {
    scheme: "http" | "https";
    hostname: string;
    port: number;
    path: string;
    rawQuery: string;
    url: string;
  };
  method: string;
  httpVersion?: string;
  headers: Array<{
    id: string;
    name: string;
    value: string;
    originalIndex: number;
    sensitive: boolean;
  }>;
  cookies: Array<{
    id: string;
    name: string;
    value: string;
    source: "cookie-header" | "manual" | "imported";
    sensitive: true;
  }>;
  queryParameters: RequestParameter[];
  body:
    | { kind: "none" }
    | { kind: "urlencoded"; raw: string; fields: RequestParameter[] }
    | { kind: "multipart"; raw?: string; boundary?: string; parts: MultipartPart[] }
    | { kind: "json"; raw: string; parsed?: unknown }
    | { kind: "xml"; raw: string }
    | { kind: "text"; raw: string }
    | { kind: "binary"; filename?: string; mimeType?: string };
  provenance: {
    importer: "raw-http" | "curl" | "har" | "manual" | "project-import";
    importedAt: string;
    rawInput?: string;
  };
}

export interface ParserError {
  code: string;
  message: string;
  field?: string;
  line?: number;
  suggestion: string;
  partial: boolean;
}

export interface ParserWarning {
  code: string;
  message: string;
  field?: string;
  line?: number;
}

export interface ImportResult {
  request?: NormalizedRequest;
  warnings: ParserWarning[];
  errors: ParserError[];
  unsupportedFields: string[];
  sensitiveSummary: string[];
  sourceFormat: "raw-http" | "curl" | "har" | "manual" | "project-import";
}
