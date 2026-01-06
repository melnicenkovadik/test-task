import { toast } from "sonner";
import { createDemoState } from "../../../entities/workspace/lib/demo";
import { useUIStore } from "../../../shared/model/uiStore";
import { useViewModeStore } from "../../../features/view-mode/model/store";
import { DEFAULT_VIEW_MODE } from "../../../shared/lib/viewMode";
import {
  useWorkspaceStore,
  workspaceSelectors,
} from "../../../entities/workspace/model/workspaceStore";

export const useWorkspaceDemo = () => {
  const setData = useWorkspaceStore(workspaceSelectors.setData);
  const setSearchQuery = useWorkspaceStore(workspaceSelectors.setSearchQuery);
  const setPreviewFileId = useWorkspaceStore(
    workspaceSelectors.setPreviewFileId,
  );
  const clearSelection = useWorkspaceStore(workspaceSelectors.clearSelection);
  const { setExpandedFolders } = useUIStore();
  const setViewModeStore = useViewModeStore((state) => state.setViewMode);

  const handleCreateDemo = () => {
    const demoState = createDemoState();
    setData(demoState);
    const demoRoot = Object.values(demoState.folders).find(
      (folder) => folder.parentId === null,
    );
    if (demoRoot && demoState.activeDataroomId) {
      setExpandedFolders(demoState.activeDataroomId, [demoRoot.id]);
    }
    if (demoState.activeDataroomId) {
      setViewModeStore(demoState.activeDataroomId, DEFAULT_VIEW_MODE);
    }
    setSearchQuery("");
    setPreviewFileId(null);
    clearSelection();
    toast.success("Demo data room is ready.");
  };

  return { handleCreateDemo };
};
