import { useCallback, useEffect } from "react";
import type { ViewMode } from "../../../shared/types";
import { useViewModeStore } from "../../../features/view-mode/model/store";
import { DEFAULT_VIEW_MODE } from "../../../shared/lib/viewMode";
import {
  useWorkspaceStore,
  workspaceSelectors,
} from "../../../entities/workspace/model/workspaceStore";

export const useWorkspaceViewMode = () => {
  const viewMode = useWorkspaceStore(workspaceSelectors.viewMode);
  const setViewMode = useWorkspaceStore(workspaceSelectors.setViewMode);
  const activeDataroomId = useWorkspaceStore(
    (state) => state.data.activeDataroomId,
  );
  const setViewModeStore = useViewModeStore((state) => state.setViewMode);

  const resolveViewMode = useCallback((dataroomId: string | null) => {
    if (!dataroomId) return DEFAULT_VIEW_MODE;
    const store = useViewModeStore.getState();
    return store.datarooms[dataroomId]?.viewMode ?? DEFAULT_VIEW_MODE;
  }, []);

  useEffect(() => {
    setViewMode(resolveViewMode(activeDataroomId));
  }, [activeDataroomId, resolveViewMode, setViewMode]);

  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      setViewMode(mode);
      if (activeDataroomId) {
        setViewModeStore(activeDataroomId, mode);
      }
    },
    [activeDataroomId, setViewMode, setViewModeStore],
  );

  return {
    viewMode,
    handleViewModeChange,
    resolveViewMode,
  };
};
