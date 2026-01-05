import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ViewMode } from "../types";

export type DocumentsStore = {
  cases: Record<string, { viewMode: ViewMode }>;
  setViewMode: (caseId: string, viewMode: ViewMode) => void;
};

export const DEFAULT_VIEW_MODE: ViewMode = "list";

export const useDocumentsStore = create<DocumentsStore>()(
  persist(
    (set, get) => ({
      cases: {},
      setViewMode: (caseId, viewMode) => {
        if (!caseId) return;
        const { cases } = get();
        const current = cases[caseId] ?? { viewMode: DEFAULT_VIEW_MODE };
        set({
          cases: {
            ...cases,
            [caseId]: {
              ...current,
              viewMode,
            },
          },
        });
      },
    }),
    {
      name: "documents-store-v2",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ cases: state.cases }),
    },
  ),
);
