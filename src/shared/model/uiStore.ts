import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type UIStore = {
  expandedFolders: Record<string, string[]>;
  setExpandedFolders: (dataroomId: string, folderIds: string[]) => void;
  toggleFolder: (dataroomId: string, folderId: string) => void;
  addFolder: (dataroomId: string, folderId: string) => void;
  removeFolder: (dataroomId: string, folderId: string) => void;
  getExpandedFolders: (dataroomId: string) => Set<string>;
};

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      expandedFolders: {},
      setExpandedFolders: (dataroomId, folderIds) => {
        set((state) => ({
          expandedFolders: {
            ...state.expandedFolders,
            [dataroomId]: folderIds,
          },
        }));
      },
      toggleFolder: (dataroomId, folderId) => {
        const current = get().expandedFolders[dataroomId] || [];
        const isExpanded = current.includes(folderId);
        if (isExpanded) {
          get().removeFolder(dataroomId, folderId);
        } else {
          get().addFolder(dataroomId, folderId);
        }
      },
      addFolder: (dataroomId, folderId) => {
        const current = get().expandedFolders[dataroomId] || [];
        if (!current.includes(folderId)) {
          set((state) => ({
            expandedFolders: {
              ...state.expandedFolders,
              [dataroomId]: [...current, folderId],
            },
          }));
        }
      },
      removeFolder: (dataroomId, folderId) => {
        const current = get().expandedFolders[dataroomId] || [];
        set((state) => ({
          expandedFolders: {
            ...state.expandedFolders,
            [dataroomId]: current.filter((id) => id !== folderId),
          },
        }));
      },
      getExpandedFolders: (dataroomId) => {
        const folderIds = get().expandedFolders[dataroomId] || [];
        return new Set(folderIds);
      },
    }),
    {
      name: "ui-store-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ expandedFolders: state.expandedFolders }),
    },
  ),
);
