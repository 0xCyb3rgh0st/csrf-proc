import { describe, expect, it } from "vitest";
import { parseRawHttpRequest } from "@/core/parsers/http";
import { escapeHtml, generateCsrfPoc, safePreviewSource } from "./csrf-poc";

describe("generateCsrfPoc", () => {
  it("generates a Burp-style auto-submit form and preserves duplicate fields", () => {
    const result = parseRawHttpRequest(`POST /change HTTP/1.1
Host: target.example.test
Content-Type: application/x-www-form-urlencoded

role=user&role=admin&empty=`);

    const poc = generateCsrfPoc(result.request!, true);

    expect(poc.source).toContain('<form method="post" action="https://target.example.test/change">');
    expect(poc.source).toContain('name="role" value="user"');
    expect(poc.source).toContain('name="role" value="admin"');
    expect(poc.source).toContain("document.forms[0].submit()");
  });

  it("generates a forced multipart form", () => {
    const result = parseRawHttpRequest(`POST /upload HTTP/1.1
Host: target.example.test
Content-Type: application/x-www-form-urlencoded

name=report&name=backup`);

    const poc = generateCsrfPoc(result.request!, false, "multipart");

    expect(poc.source).toContain('enctype="multipart/form-data"');
    expect(poc.source).toContain('name="name" value="report"');
    expect(poc.source).toContain('name="name" value="backup"');
    expect(poc.classification).toBe("alternative");
  });

  it("generates cross-domain XHR diagnostic output", () => {
    const result = parseRawHttpRequest(`POST /api HTTP/1.1
Host: target.example.test
Content-Type: application/json

{"enabled":true}`);

    const poc = generateCsrfPoc(result.request!, true, "xhr");

    expect(poc.source).toContain("new XMLHttpRequest()");
    expect(poc.source).toContain("withCredentials = true");
    expect(poc.classification).toBe("diagnostic-only");
  });

  it("escapes generated HTML values", () => {
    expect(escapeHtml(`"><script>alert(1)</script>`)).toBe("&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("disables submission in safe preview output", () => {
    const result = parseRawHttpRequest(`GET /delete HTTP/1.1
Host: target.example.test

`);
    const poc = generateCsrfPoc(result.request!, true);
    const safe = safePreviewSource(poc);

    expect(safe).toContain("about:blank");
    expect(safe).toContain("Safe Preview");
    expect(safe).not.toContain("https://target.example.test/delete");
  });

  it("turns hidden fields into visible readonly preview fields", () => {
    const result = parseRawHttpRequest(`POST /change HTTP/1.1
Host: target.example.test
Content-Type: application/x-www-form-urlencoded

role=admin`);
    const poc = generateCsrfPoc(result.request!, true, "urlencoded");
    const safe = safePreviewSource(poc);

    expect(safe).toContain('type="text" readonly');
    expect(safe).toContain("Script removed in Safe Preview");
    expect(safe).not.toContain("document.forms[0].submit()");
  });
});
