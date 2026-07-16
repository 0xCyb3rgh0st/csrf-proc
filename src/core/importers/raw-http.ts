import type { RequestImporter } from "./types";
import { parseRawHttpRequest } from "@/core/parsers/http";

export const rawHttpImporter: RequestImporter = {
  id: "raw-http",
  displayName: "Raw HTTP request",
  canImport(input: unknown): boolean {
    return typeof input === "string" && /^\S+\s+\S+/m.test(input.trim());
  },
  async import(input: unknown) {
    return parseRawHttpRequest(String(input));
  }
};
