import { useCallback } from "react";
import { useDragAndDrop } from "../../../features/drag-and-drop/model/useDragAndDrop";
import {
  useWorkspaceStore,
  workspaceSelectors,
} from "../../../entities/workspace/model/workspaceStore";

export const useWorkspaceDragAndDrop = () => {
  const selection = useWorkspaceStore(workspaceSelectors.selection);
  const dragActive = useWorkspaceStore(workspaceSelectors.dragActive);
  const setDragActive = useWorkspaceStore(workspaceSelectors.setDragActive);
  const { handleDragStartItem, handleDragOverFolder, parseDragPayload } =
    useDragAndDrop(selection);

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragActive(true);
    },
    [setDragActive],
  );

  const handleDragLeave = useCallback(
    () => setDragActive(false),
    [setDragActive],
  );

  return {
    dragActive,
    setDragActive,
    handleDragStartItem,
    handleDragOverFolder,
    parseDragPayload,
    handleDragOver,
    handleDragLeave,
  };
};
