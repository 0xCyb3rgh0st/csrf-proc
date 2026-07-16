"use client";

import { create } from "zustand";
import type { ImportResult, NormalizedRequest } from "@/core/models/request";

interface WorkspaceState {
  rawInput: string;
  currentRequest?: NormalizedRequest;
  lastImport?: ImportResult;
  setRawInput: (value: string) => void;
  setImportResult: (result: ImportResult) => void;
  clear: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  rawInput: "",
  setRawInput: (value) => set({ rawInput: value }),
  setImportResult: (result) => set({ lastImport: result, currentRequest: result.request }),
  clear: () => set({ rawInput: "", currentRequest: undefined, lastImport: undefined })
}));
