import type { AnalysisResult } from "./analysis";
import type { NormalizedRequest } from "./request";

export interface GeneratorSupport {
  supported: boolean;
  confidence: "high" | "medium" | "low";
  changesOriginalRepresentation: boolean;
  reasons: string[];
  limitations: string[];
}

export interface GenerationOptions {
  autoSubmit: boolean;
  hiddenIframe: boolean;
  targetPlaceholder: boolean;
  includeComments: boolean;
}

export interface GeneratedPoc {
  id: string;
  technique: string;
  source: string;
  expectedRequest: {
    method: string;
    targetUrl: string;
    contentType?: string;
    bodyDescription?: string;
    browserControlledHeaders: string[];
  };
  assumptions: string[];
  limitations: string[];
  warnings: string[];
  classification: "recommended" | "alternative" | "diagnostic-only";
  executionRisk: "non-destructive" | "state-changing" | "sensitive" | "unknown";
}

export interface PocGenerator {
  id: string;
  displayName: string;
  description: string;
  supports(request: NormalizedRequest, analysis: AnalysisResult): GeneratorSupport;
  generate(request: NormalizedRequest, options: GenerationOptions): GeneratedPoc;
}
