import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ViewMode } from "../../../shared/types";
import { DEFAULT_VIEW_MODE } from "../../../shared/lib/viewMode";

export type ViewModeStore = {
  datarooms: Record<string, { viewMode: ViewMode }>;
  setViewMode: (dataroomId: string, viewMode: ViewMode) => void;
};

export type DocumentsStore = ViewModeStore;

export { DEFAULT_VIEW_MODE };

export const useViewModeStore = create<ViewModeStore>()(
  persist(
    (set, get) => ({
      datarooms: {},
      setViewMode: (dataroomId, viewMode) => {
        if (!dataroomId) return;
        const { datarooms } = get();
        const current = datarooms[dataroomId] ?? {
          viewMode: DEFAULT_VIEW_MODE,
        };
        set({
          datarooms: {
            ...datarooms,
            [dataroomId]: {
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
      partialize: (state) => ({ datarooms: state.datarooms }),
    },
  ),
);

export const useDocumentsStore = useViewModeStore;
