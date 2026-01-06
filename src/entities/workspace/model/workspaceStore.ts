import { create } from "zustand";
import { createEmptyState } from "../lib/demo";
import type { AppState } from "./types";
import type { DialogState, ViewMode } from "../../../shared/types";
import { DEFAULT_VIEW_MODE } from "../../../shared/lib/viewMode";

export type SelectionState = {
  folders: Set<string>;
  files: Set<string>;
};

type Updater<T> = T | ((prev: T) => T);

export const emptySelection = (): SelectionState => ({
  folders: new Set<string>(),
  files: new Set<string>(),
});

type WorkspaceStore = {
  data: AppState;
  dialog: DialogState | null;
  searchQuery: string;
  previewFileId: string | null;
  dragActive: boolean;
  viewMode: ViewMode;
  selection: SelectionState;
  setData: (updater: Updater<AppState>) => void;
  setDialog: (dialog: Updater<DialogState | null>) => void;
  setSearchQuery: (value: string) => void;
  setPreviewFileId: (value: string | null) => void;
  setDragActive: (value: boolean) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelection: (updater: Updater<SelectionState>) => void;
  clearSelection: () => void;
  toggleFolderSelection: (id: string) => void;
  toggleFileSelection: (id: string) => void;
  selectAll: (folderIds: string[], fileIds: string[]) => void;
};

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  data: createEmptyState(),
  dialog: null,
  searchQuery: "",
  previewFileId: null,
  dragActive: false,
  viewMode: DEFAULT_VIEW_MODE,
  selection: emptySelection(),
  setData: (updater) =>
    set((state) => ({
      data:
        typeof updater === "function"
          ? (updater as (prev: AppState) => AppState)(state.data)
          : updater,
    })),
  setDialog: (updater) =>
    set((state) => ({
      dialog:
        typeof updater === "function"
          ? (updater as (prev: DialogState | null) => DialogState | null)(
              state.dialog,
            )
          : updater,
    })),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setPreviewFileId: (previewFileId) => set({ previewFileId }),
  setDragActive: (dragActive) => set({ dragActive }),
  setViewMode: (viewMode) => set({ viewMode }),
  setSelection: (updater) =>
    set((state) => ({
      selection:
        typeof updater === "function"
          ? (updater as (prev: SelectionState) => SelectionState)(
              state.selection,
            )
          : updater,
    })),
  clearSelection: () => set({ selection: emptySelection() }),
  toggleFolderSelection: (id) =>
    set((state) => {
      const nextFolders = new Set(state.selection.folders);
      if (nextFolders.has(id)) {
        nextFolders.delete(id);
      } else {
        nextFolders.add(id);
      }
      return { selection: { ...state.selection, folders: nextFolders } };
    }),
  toggleFileSelection: (id) =>
    set((state) => {
      const nextFiles = new Set(state.selection.files);
      if (nextFiles.has(id)) {
        nextFiles.delete(id);
      } else {
        nextFiles.add(id);
      }
      return { selection: { ...state.selection, files: nextFiles } };
    }),
  selectAll: (folderIds, fileIds) =>
    set(() => ({
      selection: {
        folders: new Set(folderIds),
        files: new Set(fileIds),
      },
    })),
}));

export const workspaceSelectors = {
  data: (state: WorkspaceStore) => state.data,
  dialog: (state: WorkspaceStore) => state.dialog,
  searchQuery: (state: WorkspaceStore) => state.searchQuery,
  previewFileId: (state: WorkspaceStore) => state.previewFileId,
  dragActive: (state: WorkspaceStore) => state.dragActive,
  viewMode: (state: WorkspaceStore) => state.viewMode,
  selection: (state: WorkspaceStore) => state.selection,
  setData: (state: WorkspaceStore) => state.setData,
  setDialog: (state: WorkspaceStore) => state.setDialog,
  setSearchQuery: (state: WorkspaceStore) => state.setSearchQuery,
  setPreviewFileId: (state: WorkspaceStore) => state.setPreviewFileId,
  setDragActive: (state: WorkspaceStore) => state.setDragActive,
  setViewMode: (state: WorkspaceStore) => state.setViewMode,
  setSelection: (state: WorkspaceStore) => state.setSelection,
  clearSelection: (state: WorkspaceStore) => state.clearSelection,
  toggleFolderSelection: (state: WorkspaceStore) => state.toggleFolderSelection,
  toggleFileSelection: (state: WorkspaceStore) => state.toggleFileSelection,
  selectAll: (state: WorkspaceStore) => state.selectAll,
};
