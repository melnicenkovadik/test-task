import { useCallback, useMemo } from "react";
import type { WorkspaceActionsContextValue } from "../../../widgets/workspace/model/workspaceActionsContext";
import { useDataroomActions } from "../../../features/datarooms/model/useDataroomActions";
import { useFolderActions } from "../../../features/folders/model/useFolderActions";
import { useFileActions } from "../../../features/files/model/useFileActions";
import { useWorkspaceDemo } from "./useWorkspaceDemo";
import { useWorkspaceSelection } from "../../../widgets/workspace/model/useWorkspaceSelection";
import { useWorkspaceDragAndDrop } from "../../../widgets/workspace/model/useWorkspaceDragAndDrop";
import { useWorkspaceDocuments } from "../../../widgets/workspace/model/useWorkspaceDocuments";
import { useWorkspaceDialogs } from "../../../widgets/workspace/model/useWorkspaceDialogs";
import { useWorkspaceViewMode } from "../../../widgets/workspace/model/useWorkspaceViewMode";
import { useMoveItems } from "./useMoveItems";
import { useBulkDelete } from "./useBulkDelete";
import { useFirestore } from "../../../features/data/model/useFirestore";

export const useWorkspaceActionHandlers = (
  userId: string | null,
  firestore: ReturnType<typeof useFirestore>,
) => {
  const { handleCreateDemo } = useWorkspaceDemo();
  const {
    handleCreateDataroom,
    handleRenameDataroom,
    handleDeleteDataroom,
    selectDataroom,
  } = useDataroomActions(userId, firestore);
  const {
    handleSelectFolder,
    handleCreateFolder,
    handleRenameFolder,
    handleDeleteFolder,
  } = useFolderActions(userId, firestore);
  const { handleUploadFiles, handleRenameFile, handleDeleteFile } =
    useFileActions(userId, firestore);
  const { handleViewModeChange } = useWorkspaceViewMode();
  const {
    selection,
    clearSelection,
    toggleFolderSelection,
    toggleFileSelection,
    selectAll,
  } = useWorkspaceSelection();
  const {
    handleDragStartItem,
    handleDragOverFolder,
    parseDragPayload,
    setDragActive,
  } = useWorkspaceDragAndDrop();
  const { activeFolder, filteredFolders, filteredFiles } =
    useWorkspaceDocuments();
  const { openBulkMove, openBulkDeleteConfirm } = useWorkspaceDialogs();
  const { moveItemsToFolder } = useMoveItems(userId, firestore);
  const { handleBulkDelete: performBulkDelete } = useBulkDelete(
    userId,
    firestore,
  );

  const handleSelectAllVisible = useCallback(() => {
    selectAll(
      filteredFolders.map((folder) => folder.id),
      filteredFiles.map((file) => file.id),
    );
  }, [filteredFolders, filteredFiles, selectAll]);

  const handleBulkMove = useCallback(() => {
    const folderIds = Array.from(selection.folders);
    const fileIds = Array.from(selection.files);
    if (folderIds.length + fileIds.length === 0) return;
    openBulkMove(folderIds, fileIds);
  }, [openBulkMove, selection.files, selection.folders]);

  const handleBulkDeleteConfirm = useCallback(() => {
    const folderIds = Array.from(selection.folders);
    const fileIds = Array.from(selection.files);
    if (folderIds.length + fileIds.length === 0) return;
    openBulkDeleteConfirm(folderIds, fileIds);
  }, [openBulkDeleteConfirm, selection.files, selection.folders]);

  const handleDropOnFolder = useCallback(
    (event: React.DragEvent<HTMLElement>, folderId: string) => {
      event.preventDefault();
      const payload = parseDragPayload(event);
      if (!payload) return;
      moveItemsToFolder(folderId, payload.folderIds, payload.fileIds);
    },
    [moveItemsToFolder, parseDragPayload],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragActive(false);
      if (!activeFolder) return;
      const files = event.dataTransfer.files;
      if (files.length > 0) {
        handleUploadFiles(files, activeFolder.id);
      }
    },
    [activeFolder, handleUploadFiles, setDragActive],
  );

  const actions = useMemo<WorkspaceActionsContextValue>(
    () => ({
      handleCreateDemo,
      selectDataroom,
      handleCreateDataroom,
      handleSelectFolder,
      handleCreateFolder,
      handleRenameFolder,
      handleDeleteFolder,
      handleRenameDataroom,
      handleDeleteDataroom,
      handleUploadFiles,
      handleRenameFile,
      handleDeleteFile,
      handleBulkDeleteConfirm,
      handleBulkMove,
      handleViewModeChange,
      handleToggleFolderSelection: toggleFolderSelection,
      handleToggleFileSelection: toggleFileSelection,
      handleSelectAllVisible,
      clearSelection,
      handleDragStartItem,
      handleDragOverFolder,
      handleDropOnFolder,
      handleDrop,
    }),
    [
      clearSelection,
      handleBulkDeleteConfirm,
      handleBulkMove,
      handleCreateDataroom,
      handleCreateDemo,
      handleCreateFolder,
      handleDeleteDataroom,
      handleDeleteFile,
      handleDeleteFolder,
      handleDragOverFolder,
      handleDragStartItem,
      handleDrop,
      handleDropOnFolder,
      handleRenameDataroom,
      handleRenameFile,
      handleRenameFolder,
      handleSelectAllVisible,
      handleSelectFolder,
      handleUploadFiles,
      handleViewModeChange,
      selectDataroom,
      toggleFileSelection,
      toggleFolderSelection,
    ],
  );

  return {
    actions,
    moveItemsToFolder,
    performBulkDelete,
  };
};
