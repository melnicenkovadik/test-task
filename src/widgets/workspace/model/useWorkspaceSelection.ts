import {
  useWorkspaceStore,
  workspaceSelectors,
} from "../../../entities/workspace/model/workspaceStore";

export const useWorkspaceSelection = () => {
  const selection = useWorkspaceStore(workspaceSelectors.selection);
  const clearSelection = useWorkspaceStore(workspaceSelectors.clearSelection);
  const toggleFolderSelection = useWorkspaceStore(
    workspaceSelectors.toggleFolderSelection,
  );
  const toggleFileSelection = useWorkspaceStore(
    workspaceSelectors.toggleFileSelection,
  );
  const selectAll = useWorkspaceStore(workspaceSelectors.selectAll);
  const setSelection = useWorkspaceStore(workspaceSelectors.setSelection);

  return {
    selection,
    clearSelection,
    toggleFolderSelection,
    toggleFileSelection,
    selectAll,
    setSelection,
  };
};
