import { describe, expect, it } from "vitest";
import { parseRawHttpRequest } from "@/core/parsers/http";
import { redactRequest } from "./secrets";

describe("redactRequest", () => {
  it("redacts sensitive headers, cookies, query parameters, and urlencoded body fields", () => {
    const result = parseRawHttpRequest(`POST /update?token=query-token HTTP/1.1
Host: target.example.test
Authorization: Bearer abc.def.ghi
Content-Type: application/x-www-form-urlencoded
Cookie: session=secret

password=hunter2&name=Researcher`);

    expect(result.request).toBeDefined();
    const redacted = redactRequest(result.request!);

    expect(redacted.headers.find((header) => header.name === "Authorization")?.value).toBe("[REDACTED]");
    expect(redacted.cookies[0].value).toBe("[REDACTED]");
    expect(redacted.queryParameters[0].value).toBe("[REDACTED]");
    expect(redacted.body.kind).toBe("urlencoded");
    if (redacted.body.kind === "urlencoded") {
      expect(redacted.body.fields[0].value).toBe("[REDACTED]");
      expect(redacted.body.fields[1].value).toBe("Researcher");
    }
  });
});
