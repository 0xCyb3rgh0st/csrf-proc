import { describe, expect, it } from "vitest";
import { parseParameterString, parseRawHttpRequest } from "./http";

describe("parseParameterString", () => {
  it("preserves duplicate parameters, empty values, empty names, and missing equals signs", () => {
    const params = parseParameterString("a=1&a=2&empty=&=blank-name&flag");

    expect(params.map((param) => [param.name, param.value, param.hasEquals])).toEqual([
      ["a", "1", true],
      ["a", "2", true],
      ["empty", "", true],
      ["", "blank-name", true],
      ["flag", "", false]
    ]);
  });
});

describe("parseRawHttpRequest", () => {
  it("parses a raw HTTP request and detects sensitive values", () => {
    const result = parseRawHttpRequest(`POST /account?next=%2Fhome&next=%2Fsettings HTTP/1.1
Host: target.example.test
Content-Type: application/x-www-form-urlencoded
Cookie: session=example-session

display_name=Researcher&csrf_token=example-token`);

    expect(result.errors).toEqual([]);
    expect(result.request?.method).toBe("POST");
    expect(result.request?.target.hostname).toBe("target.example.test");
    expect(result.request?.queryParameters).toHaveLength(2);
    expect(result.request?.body.kind).toBe("urlencoded");
    expect(result.sensitiveSummary).toContain("Header: Cookie");
    expect(result.sensitiveSummary).toContain("Cookie: session");
    expect(result.sensitiveSummary).toContain("Body: csrf_token");
  });

  it("returns structured partial errors for malformed headers", () => {
    const result = parseRawHttpRequest(`GET / HTTP/1.1
Host: example.test
BrokenHeader

`);

    expect(result.request).toBeDefined();
    expect(result.errors[0]).toMatchObject({
      code: "INVALID_HEADER",
      partial: true
    });
  });
});
