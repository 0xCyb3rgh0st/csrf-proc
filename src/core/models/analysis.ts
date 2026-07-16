import type { NormalizedRequest } from "./request";

export interface AnalysisFinding {
  id: string;
  category:
    | "browser-feasibility"
    | "authentication"
    | "cookie"
    | "content-type"
    | "csrf-token"
    | "origin"
    | "referer"
    | "fetch-metadata"
    | "custom-header"
    | "request-method"
    | "impact"
    | "general";
  status: "compatible" | "conditional" | "blocked" | "warning" | "unknown" | "requires-verification";
  confidence: "high" | "medium" | "low";
  title: string;
  summary: string;
  explanation: string;
  evidence: Array<{
    label: string;
    value: string;
    fieldReference?: string;
  }>;
  recommendations: string[];
  references?: string[];
}

export interface AnalysisOptions {
  includeManualVerificationGuidance: boolean;
}

export interface AnalysisResult {
  schemaVersion: 1;
  requestId: string;
  analyzedAt: string;
  findings: AnalysisFinding[];
}

export interface RequestAnalyzer {
  id: string;
  displayName: string;
  analyze(request: NormalizedRequest, options: AnalysisOptions): AnalysisFinding[];
}
