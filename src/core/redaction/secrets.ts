import type { NormalizedRequest, RequestParameter } from "@/core/models/request";

const sensitiveNamePatterns = [
  /cookie/i,
  /^authorization$/i,
  /^proxy-authorization$/i,
  /^x-api-key$/i,
  /^api-key$/i,
  /^x-auth-token$/i,
  /csrf/i,
  /xsrf/i,
  /authenticity_token/i,
  /request_verification_token/i,
  /password/i,
  /secret/i,
  /session/i,
  /token/i
];

const jwtPattern = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

export function isSensitiveName(name: string): boolean {
  return sensitiveNamePatterns.some((pattern) => pattern.test(name));
}

export function isSensitiveValue(value: string): boolean {
  return /^Bearer\s+\S+/i.test(value) || jwtPattern.test(value.trim());
}

export function isSensitiveField(name: string, value: string): boolean {
  return isSensitiveName(name) || isSensitiveValue(value);
}

export function maskSecret(value: string): string {
  if (!value) return "";
  return "•".repeat(Math.min(Math.max(value.length, 8), 12));
}

export function redactValue(value: string): string {
  return value ? "[REDACTED]" : value;
}

function redactParameter(parameter: RequestParameter): RequestParameter {
  if (!parameter.sensitive) return parameter;
  return {
    ...parameter,
    value: redactValue(parameter.value),
    raw: parameter.hasEquals ? `${parameter.name}=${redactValue(parameter.value)}` : parameter.name
  };
}

export function redactRequest(request: NormalizedRequest): NormalizedRequest {
  return {
    ...request,
    headers: request.headers.map((header) =>
      header.sensitive ? { ...header, value: redactValue(header.value) } : header
    ),
    cookies: request.cookies.map((cookie) => ({ ...cookie, value: redactValue(cookie.value) })),
    queryParameters: request.queryParameters.map(redactParameter),
    body:
      request.body.kind === "urlencoded"
        ? {
            ...request.body,
            fields: request.body.fields.map(redactParameter)
          }
        : request.body
  };
}

export function sensitiveSummary(request: NormalizedRequest): string[] {
  const fields: string[] = [];
  request.headers.forEach((header) => {
    if (header.sensitive) fields.push(`Header: ${header.name}`);
  });
  request.cookies.forEach((cookie) => fields.push(`Cookie: ${cookie.name}`));
  request.queryParameters.forEach((parameter) => {
    if (parameter.sensitive) fields.push(`Query: ${parameter.name || "(empty name)"}`);
  });
  if (request.body.kind === "urlencoded") {
    request.body.fields.forEach((parameter) => {
      if (parameter.sensitive) fields.push(`Body: ${parameter.name || "(empty name)"}`);
    });
  }
  return fields;
}
