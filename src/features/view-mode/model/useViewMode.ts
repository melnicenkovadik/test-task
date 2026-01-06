import { DEFAULT_VIEW_MODE, useViewModeStore } from "./store";
import type { ViewMode } from "../../../shared/types";

export const useViewMode = (dataroomId: string | null) => {
  const setViewModeStore = useViewModeStore((state) => state.setViewMode);

  const resolveViewMode = (id: string | null): ViewMode => {
    if (!id) return DEFAULT_VIEW_MODE;
    return (
      useViewModeStore.getState().datarooms[id]?.viewMode ?? DEFAULT_VIEW_MODE
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
