import { createContext, useContext } from "react";
import type { ViewMode } from "../../../shared/types";

export type WorkspaceActionsContextValue = {
  handleCreateDemo: () => void;
  selectDataroom: (id: string) => Promise<void> | void;
  handleCreateDataroom: (name: string) => Promise<void> | void;
  handleSelectFolder: (folderId: string) => Promise<void> | void;
  handleCreateFolder: (parentId: string, name: string) => Promise<void> | void;
  handleRenameFolder: (id: string, name: string) => Promise<void> | void;
  handleDeleteFolder: (id: string) => Promise<void> | void;
  handleRenameDataroom: (id: string, name: string) => Promise<void> | void;
  handleDeleteDataroom: (id: string) => Promise<void> | void;
  handleUploadFiles: (files: FileList | File[], folderId: string) => void;
  handleRenameFile: (id: string, name: string) => Promise<void> | void;
  handleDeleteFile: (id: string) => Promise<void> | void;
  handleBulkDeleteConfirm: () => void;
  handleBulkMove: () => void;
  handleViewModeChange: (mode: ViewMode) => void;
  handleToggleFolderSelection: (folderId: string) => void;
  handleToggleFileSelection: (fileId: string) => void;
  handleSelectAllVisible: () => void;
  clearSelection: () => void;
  handleDragStartItem: (
    event: React.DragEvent<HTMLDivElement>,
    type: "folder" | "file",
    id: string,
  ) => void;
  handleDragOverFolder: (event: React.DragEvent<HTMLElement>) => void;
  handleDropOnFolder: (
    event: React.DragEvent<HTMLElement>,
    folderId: string,
  ) => void;
  handleDrop: (event: React.DragEvent<HTMLDivElement>) => void;
};

const WorkspaceActionsContext =
  createContext<WorkspaceActionsContextValue | null>(null);

type ProviderProps = {
  value: WorkspaceActionsContextValue;
  children: React.ReactNode;
};

export const WorkspaceActionsProvider = ({
  value,
  children,
}: ProviderProps) => (
  <WorkspaceActionsContext.Provider value={value}>
    {children}
  </WorkspaceActionsContext.Provider>
);

/* eslint-disable react-refresh/only-export-components */
export const useWorkspaceActions = () => {
  const context = useContext(WorkspaceActionsContext);
  if (!context) {
    throw new Error("useWorkspaceActions must be used within provider");
  }
  return context;
};
