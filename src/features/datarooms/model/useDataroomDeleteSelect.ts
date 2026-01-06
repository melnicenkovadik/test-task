import { useCallback } from "react";
import { toast } from "sonner";
import type { AppState } from "../../../entities/workspace/model/types";
import { useUIStore } from "../../../shared/model/uiStore";
import { useLoadingStore } from "../../../shared/model/loadingStore";
import { logError } from "../../../shared/lib/logger";
import { useFirestore } from "../../data/model/useFirestore";
import {
  useWorkspaceStore,
  workspaceSelectors,
} from "../../../entities/workspace/model/workspaceStore";

type FirestoreApi = Pick<
  ReturnType<typeof useFirestore>,
  | "deleteDataroom"
  | "deleteFolder"
  | "deleteFile"
  | "setActiveDataroomId"
  | "setActiveFolderId"
>;

export const useDataroomDeleteSelect = (
  userId: string | null,
  firestore: FirestoreApi,
) => {
  const data = useWorkspaceStore(workspaceSelectors.data);
  const setData = useWorkspaceStore(workspaceSelectors.setData);
  const setDialog = useWorkspaceStore(workspaceSelectors.setDialog);
  const setSearchQuery = useWorkspaceStore(workspaceSelectors.setSearchQuery);
  const setPreviewFileId = useWorkspaceStore(
    workspaceSelectors.setPreviewFileId,
  );
  const clearSelection = useWorkspaceStore(workspaceSelectors.clearSelection);
  const { setExpandedFolders } = useUIStore();
  const { setLoading } = useLoadingStore();

  const handleDeleteDataroom = useCallback(
    async (id: string) => {
      const dataroomList = Object.values(data.datarooms).sort((a, b) =>
        a.name.localeCompare(b.name),
      );
      const remainingRooms = dataroomList.filter((room) => room.id !== id);
      const nextActiveRoom = remainingRooms[0] ?? null;
      const nextActiveId = nextActiveRoom?.id ?? null;
      const nextRootId = nextActiveRoom?.rootFolderId ?? null;

      if (userId) {
        setLoading(true);
        try {
          const foldersToDelete = Object.values(data.folders).filter(
            (folder) => folder.dataroomId === id,
          );
          const filesToDelete = Object.values(data.files).filter(
            (file) => file.dataroomId === id,
          );

          await firestore.deleteDataroom(id);
          await Promise.all(
            foldersToDelete.map((folder) => firestore.deleteFolder(folder.id)),
          );
          await Promise.all(
            filesToDelete.map((file) => firestore.deleteFile(file.id)),
          );

          if (nextActiveId) {
            await firestore.setActiveDataroomId(nextActiveId);
            await firestore.setActiveFolderId(nextRootId);
          } else {
            await firestore.setActiveDataroomId(null);
            await firestore.setActiveFolderId(null);
          }
        } catch (error) {
          toast.error("Failed to delete data room");
          logError("Delete data room failed", error);
          return;
        } finally {
          setLoading(false);
        }
      } else {
        setData((prev) => {
          const nextDatarooms = { ...prev.datarooms };
          const nextFolders = { ...prev.folders };
          const nextFiles = { ...prev.files };

          delete nextDatarooms[id];

          Object.values(prev.folders)
            .filter((folder) => folder.dataroomId === id)
            .forEach((folder) => {
              delete nextFolders[folder.id];
            });

          Object.values(prev.files)
            .filter((file) => file.dataroomId === id)
            .forEach((file) => {
              if (file.blobUrl) URL.revokeObjectURL(file.blobUrl);
              delete nextFiles[file.id];
            });

          return {
            datarooms: nextDatarooms,
            folders: nextFolders,
            files: nextFiles,
            activeDataroomId: nextActiveId,
            activeFolderId: nextRootId,
          } as AppState;
        });
      }

      if (nextActiveId && nextRootId) {
        setExpandedFolders(nextActiveId, [nextRootId]);
      } else if (nextActiveId) {
        setExpandedFolders(nextActiveId, []);
      }
      setPreviewFileId(null);
      setDialog(null);
      clearSelection();
      toast.info("Data room removed.");
    },
    [
      clearSelection,
      data,
      firestore,
      setData,
      setDialog,
      setExpandedFolders,
      setLoading,
      setPreviewFileId,
      userId,
    ],
  );

  const selectDataroom = useCallback(
    async (id: string) => {
      const dataroom = data.datarooms[id];
      if (!dataroom) return;

      if (userId) {
        setLoading(true);
        try {
          await firestore.setActiveDataroomId(id);
          await firestore.setActiveFolderId(dataroom.rootFolderId);

          setData((prev) => ({
            ...prev,
            activeDataroomId: id,
            activeFolderId: dataroom.rootFolderId,
          }));
        } catch (error) {
          toast.error("Failed to switch data room");
          logError("Select data room failed", error);
          return;
        } finally {
          setLoading(false);
        }
      } else {
        setData((prev) => ({
          ...prev,
          activeDataroomId: id,
          activeFolderId: dataroom.rootFolderId,
        }));
      }

      setExpandedFolders(id, [dataroom.rootFolderId]);
      setPreviewFileId(null);
      setSearchQuery("");
      clearSelection();
    },
    [
      clearSelection,
      data.datarooms,
      firestore,
      setData,
      setExpandedFolders,
      setLoading,
      setPreviewFileId,
      setSearchQuery,
      userId,
    ],
  );

  return {
    handleDeleteDataroom,
    selectDataroom,
  };
};
