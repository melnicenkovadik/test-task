import { useCallback } from "react";
import { toast } from "sonner";
import { collectFolderIds } from "../../../entities/workspace/lib/selectors";
import { deleteFileFromIndexedDB } from "../../../shared/lib/indexedDB";
import { logError, logWarn } from "../../../shared/lib/logger";
import { useUIStore } from "../../../shared/model/uiStore";
import { useLoadingStore } from "../../../shared/model/loadingStore";
import { useFirestore } from "../../../features/data/model/useFirestore";
import {
  useWorkspaceStore,
  workspaceSelectors,
} from "../../../entities/workspace/model/workspaceStore";
import { useWorkspaceSelection } from "../../../widgets/workspace/model/useWorkspaceSelection";

type FirestoreApi = Pick<
  ReturnType<typeof useFirestore>,
  "deleteFolder" | "deleteFile"
>;

export const useBulkDelete = (
  userId: string | null,
  firestore: FirestoreApi,
) => {
  const data = useWorkspaceStore(workspaceSelectors.data);
  const previewFileId = useWorkspaceStore(workspaceSelectors.previewFileId);
  const setPreviewFileId = useWorkspaceStore(
    workspaceSelectors.setPreviewFileId,
  );
  const setData = useWorkspaceStore(workspaceSelectors.setData);
  const { clearSelection } = useWorkspaceSelection();
  const { getExpandedFolders, removeFolder: removeFolderFromStore } =
    useUIStore();
  const { setLoading } = useLoadingStore();

  const handleBulkDelete = useCallback(
    async (folderIds: string[], fileIds: string[]) => {
      const rootId = data.activeDataroomId
        ? (data.datarooms[data.activeDataroomId]?.rootFolderId ?? null)
        : null;
      const sanitizedFolderIds = rootId
        ? folderIds.filter((id) => id !== rootId)
        : folderIds;

      if (rootId && folderIds.includes(rootId)) {
        toast.error("Root folder cannot be deleted.");
      }

      let deletedFolderIds = new Set<string>();
      let deletedFileIds = new Set<string>();

      const foldersToDelete = new Set<string>();
      const filesToDelete = new Set<string>(fileIds);

      sanitizedFolderIds.forEach((folderId) => {
        if (!data.folders[folderId]) return;
        collectFolderIds(folderId, data).forEach((id) => {
          foldersToDelete.add(id);
        });
      });

      foldersToDelete.forEach((folderId) => {
        const folder = data.folders[folderId];
        if (!folder) return;
        folder.fileIds.forEach((fileId) => filesToDelete.add(fileId));
      });

      if (userId) {
        setLoading(true);
        try {
          await Promise.all(
            Array.from(filesToDelete).map(async (fileId) => {
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
            Array.from(foldersToDelete).map((folderId) =>
              firestore.deleteFolder(folderId),
            ),
          );

          await Promise.all(
            Array.from(filesToDelete).map((fileId) =>
              firestore.deleteFile(fileId),
            ),
          );
        } catch (error) {
          toast.error("Failed to delete items");
          logError("Bulk delete failed", error);
          return;
        } finally {
          setLoading(false);
        }
      }

      setData((prev) => {
        const nextFolders = { ...prev.folders };
        const nextFiles = { ...prev.files };

        filesToDelete.forEach((fileId) => {
          const file = nextFiles[fileId];
          if (file?.blobUrl) URL.revokeObjectURL(file.blobUrl);
          delete nextFiles[fileId];
        });

        foldersToDelete.forEach((folderId) => {
          delete nextFolders[folderId];
        });

        Object.values(nextFolders).forEach((folder) => {
          nextFolders[folder.id] = {
            ...folder,
            childFolderIds: folder.childFolderIds.filter(
              (id) => !foldersToDelete.has(id),
            ),
            fileIds: folder.fileIds.filter((id) => !filesToDelete.has(id)),
          };
        });

        deletedFolderIds = foldersToDelete;
        deletedFileIds = filesToDelete;

        const activeFolderId =
          prev.activeFolderId && !nextFolders[prev.activeFolderId]
            ? prev.activeDataroomId
              ? (prev.datarooms[prev.activeDataroomId]?.rootFolderId ?? null)
              : null
            : prev.activeFolderId;

        return {
          ...prev,
          folders: nextFolders,
          files: nextFiles,
          activeFolderId,
        };
      });

      if (deletedFolderIds.size + deletedFileIds.size > 0) {
        if (data.activeDataroomId) {
          const current = getExpandedFolders(data.activeDataroomId);
          const dataroomId = data.activeDataroomId;
          deletedFolderIds.forEach((id) => {
            if (current.has(id)) {
              removeFolderFromStore(dataroomId, id);
            }
          });
        }
        if (previewFileId && deletedFileIds.has(previewFileId)) {
          setPreviewFileId(null);
        }
        clearSelection();
        toast.info("Selected items deleted.");
      }
    },
    [
      clearSelection,
      data,
      firestore,
      getExpandedFolders,
      previewFileId,
      removeFolderFromStore,
      setData,
      setLoading,
      setPreviewFileId,
      userId,
    ],
  );

  return {
    handleBulkDelete,
  };
};
