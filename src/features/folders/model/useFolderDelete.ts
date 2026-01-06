import { useCallback } from "react";
import { toast } from "sonner";
import { collectFolderIds } from "../../../entities/workspace/lib/selectors";
import { deleteFileFromIndexedDB } from "../../../shared/lib/indexedDB";
import { useLoadingStore } from "../../../shared/model/loadingStore";
import { useUIStore } from "../../../shared/model/uiStore";
import { logError, logWarn } from "../../../shared/lib/logger";
import { useFirestore } from "../../data/model/useFirestore";
import {
  useWorkspaceStore,
  workspaceSelectors,
} from "../../../entities/workspace/model/workspaceStore";

type FirestoreApi = Pick<
  ReturnType<typeof useFirestore>,
  "deleteFolder" | "deleteFile" | "updateFolder" | "setActiveFolderId"
>;

export const useFolderDelete = (
  userId: string | null,
  firestore: FirestoreApi,
) => {
  const data = useWorkspaceStore(workspaceSelectors.data);
  const setData = useWorkspaceStore(workspaceSelectors.setData);
  const setDialog = useWorkspaceStore(workspaceSelectors.setDialog);
  const setPreviewFileId = useWorkspaceStore(
    workspaceSelectors.setPreviewFileId,
  );
  const setSelection = useWorkspaceStore(workspaceSelectors.setSelection);
  const { setLoading } = useLoadingStore();
  const { getExpandedFolders, removeFolder: removeFolderFromStore } =
    useUIStore();

  const handleDeleteFolder = useCallback(
    async (id: string) => {
      const folder = data.folders[id];
      if (!folder) return;

      const isRoot =
        data.datarooms[folder.dataroomId]?.rootFolderId === folder.id;
      if (isRoot) {
        toast.error("Root folder cannot be deleted.");
        setDialog(null);
        return;
      }

      const folderIdsToRemove = collectFolderIds(id, data);

      const stack = [id];
      const folderIdsToDelete = new Set<string>();
      const fileIdsToDelete = new Set<string>();

      while (stack.length > 0) {
        const currentId = stack.pop();
        if (!currentId) continue;
        const currentFolder = data.folders[currentId];
        if (!currentFolder) continue;
        folderIdsToDelete.add(currentId);
        currentFolder.childFolderIds.forEach((childId) => stack.push(childId));
        currentFolder.fileIds.forEach((fileId) => fileIdsToDelete.add(fileId));
      }

      if (userId) {
        setLoading(true);
        try {
          await Promise.all(
            Array.from(fileIdsToDelete).map(async (fileId) => {
              const file = data.files[fileId];
              if (file?.blobUrl) {
                try {
                  await deleteFileFromIndexedDB(userId, fileId);
                  URL.revokeObjectURL(file.blobUrl);
                } catch (storageError) {
                  logWarn(
                    `Failed to delete file ${fileId} from IndexedDB`,
                    storageError,
                  );
                }
              }
            }),
          );

          await Promise.all(
            Array.from(folderIdsToDelete).map((folderId) =>
              firestore.deleteFolder(folderId),
            ),
          );

          await Promise.all(
            Array.from(fileIdsToDelete).map((fileId) =>
              firestore.deleteFile(fileId),
            ),
          );

          const parentFolder = data.folders[folder.parentId ?? ""];
          if (parentFolder) {
            await firestore.updateFolder(parentFolder.id, {
              childFolderIds: parentFolder.childFolderIds.filter(
                (childId) => childId !== id,
              ),
            });
          }

          const nextActiveFolderId =
            data.activeFolderId && folderIdsToDelete.has(data.activeFolderId)
              ? (parentFolder?.id ?? data.activeFolderId)
              : data.activeFolderId;

          if (nextActiveFolderId !== data.activeFolderId) {
            await firestore.setActiveFolderId(nextActiveFolderId);
          }
        } catch (error) {
          toast.error("Failed to delete folder");
          logError("Delete folder failed", error);
          return;
        } finally {
          setLoading(false);
        }
      } else {
        setData((prev) => {
          const nextFolders = { ...prev.folders };
          const nextFiles = { ...prev.files };

          folderIdsToDelete.forEach((folderId) => {
            delete nextFolders[folderId];
          });

          fileIdsToDelete.forEach((fileId) => {
            const file = nextFiles[fileId];
            if (file?.blobUrl) URL.revokeObjectURL(file.blobUrl);
            delete nextFiles[fileId];
          });

          const parentFolder = nextFolders[folder.parentId ?? ""];
          if (parentFolder) {
            nextFolders[parentFolder.id] = {
              ...parentFolder,
              childFolderIds: parentFolder.childFolderIds.filter(
                (childId) => childId !== id,
              ),
            };
          }

          const nextActiveFolderId =
            prev.activeFolderId && folderIdsToDelete.has(prev.activeFolderId)
              ? (parentFolder?.id ?? prev.activeFolderId)
              : prev.activeFolderId;

          return {
            ...prev,
            folders: nextFolders,
            files: nextFiles,
            activeFolderId: nextActiveFolderId ?? prev.activeFolderId,
          };
        });
      }

      setDialog(null);
      setPreviewFileId(null);
      if (data.activeDataroomId) {
        const current = getExpandedFolders(data.activeDataroomId);
        const dataroomId = data.activeDataroomId;
        folderIdsToRemove.forEach((folderId) => {
          if (current.has(folderId)) {
            removeFolderFromStore(dataroomId, folderId);
          }
        });
      }
      setSelection((prev) => {
        const nextFolders = new Set(prev.folders);
        const nextFiles = new Set(prev.files);
        const fileIdsToRemove = new Set<string>();

        folderIdsToRemove.forEach((folderId) => {
          nextFolders.delete(folderId);
          const folderItem = data.folders[folderId];
          if (folderItem) {
            folderItem.fileIds.forEach((fileId) => fileIdsToRemove.add(fileId));
          }
        });

        fileIdsToRemove.forEach((fileId) => nextFiles.delete(fileId));
        return { folders: nextFolders, files: nextFiles };
      });
      toast.info("Folder deleted.");
    },
    [
      data,
      firestore,
      getExpandedFolders,
      removeFolderFromStore,
      setData,
      setDialog,
      setLoading,
      setPreviewFileId,
      setSelection,
      userId,
    ],
  );

  return { handleDeleteFolder };
};
