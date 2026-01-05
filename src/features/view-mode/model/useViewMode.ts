import { DEFAULT_VIEW_MODE, useDocumentsStore } from "./store";
import type { ViewMode } from "../../../shared/types";

export const useViewMode = (dataroomId: string | null) => {
  const setViewModeStore = useDocumentsStore((state) => state.setViewMode);

  const resolveViewMode = (id: string | null): ViewMode => {
    if (!id) return DEFAULT_VIEW_MODE;
    return (
      useDocumentsStore.getState().cases[id]?.viewMode ?? DEFAULT_VIEW_MODE
    );
  };

  const setViewMode = (mode: ViewMode) => {
    if (dataroomId) {
      setViewModeStore(dataroomId, mode);
    }
  };

  return {
    viewMode: resolveViewMode(dataroomId),
    setViewMode,
    resolveViewMode,
  };
};
