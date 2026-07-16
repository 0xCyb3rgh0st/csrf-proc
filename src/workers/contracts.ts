import type { AnalysisOptions, AnalysisResult } from "@/core/models/analysis";
import type { NormalizedRequest, ParserError, ParserWarning } from "@/core/models/request";

export type ParserWorkerRequest = {
  type: "PARSE_REQUEST";
  format: "raw-http" | "curl" | "har";
  payload: string | object;
};

export type ParserWorkerResponse = {
  type: "PARSE_RESULT";
  request?: NormalizedRequest;
  warnings: ParserWarning[];
  errors: ParserError[];
};

export type AnalysisWorkerRequest = {
  type: "ANALYZE_REQUEST";
  request: NormalizedRequest;
  options: AnalysisOptions;
};

export type AnalysisWorkerResponse = {
  type: "ANALYSIS_RESULT";
  result: AnalysisResult;
};
