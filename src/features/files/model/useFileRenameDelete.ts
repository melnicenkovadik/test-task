import { useCallback } from "react";
import { toast } from "sonner";
import { deleteFileFromIndexedDB } from "../../../shared/lib/indexedDB";
import { getSiblingNames } from "../../../entities/workspace/lib/selectors";
import { normalizeName } from "../../../shared/lib/utils";
import { logError, logWarn } from "../../../shared/lib/logger";
import { useLoadingStore } from "../../../shared/model/loadingStore";
import { useFirestore } from "../../data/model/useFirestore";
import {
  useWorkspaceStore,
  workspaceSelectors,
} from "../../../entities/workspace/model/workspaceStore";

type FirestoreApi = Pick<
  ReturnType<typeof useFirestore>,
  "updateFile" | "deleteFile" | "updateFolder"
>;

export const useFileRenameDelete = (
  userId: string | null,
  firestore: FirestoreApi,
) => {
  const data = useWorkspaceStore(workspaceSelectors.data);
  const setData = useWorkspaceStore(workspaceSelectors.setData);
  const setDialog = useWorkspaceStore(workspaceSelectors.setDialog);
  const previewFileId = useWorkspaceStore(workspaceSelectors.previewFileId);
  const setPreviewFileId = useWorkspaceStore(
    workspaceSelectors.setPreviewFileId,
  );
  const setSelection = useWorkspaceStore(workspaceSelectors.setSelection);
  const { setLoading } = useLoadingStore();

  const handleRenameFile = useCallback(
    async (id: string, name: string) => {
      const normalized = normalizeName(name);
      if (!normalized) {
        setDialog((prev) =>
          prev && "error" in prev
            ? { ...prev, error: "Name is required." }
            : prev,
        );
        return;
      }

      const file = data.files[id];
      if (!file) return;
      const parentId = file.parentFolderId;
      const used = getSiblingNames(parentId, data, id);
      const finalName = normalized.toLowerCase().endsWith(".pdf")
        ? normalized
        : `${normalized}.pdf`;

      if (used.has(finalName.toLowerCase())) {
        setDialog((prev) =>
          prev && "error" in prev
            ? { ...prev, error: "An item with this name already exists." }
            : prev,
        );
        return;
      }

      if (userId) {
        setLoading(true);
        try {
          await firestore.updateFile(id, { name: finalName });
        } catch (error) {
          toast.error("Failed to rename file");
          logError("Rename file failed", error);
          return;
        } finally {
          setLoading(false);
        }
      } else {
        setData((prev) => ({
          ...prev,
          files: {
            ...prev.files,
            [id]: { ...prev.files[id], name: finalName },
          },
        }));
      }

      setDialog(null);
      toast.success("File renamed.");
    },
    [data, firestore, setData, setDialog, setLoading, userId],
  );

  const handleDeleteFile = useCallback(
    async (id: string) => {
      const file = data.files[id];
      if (!file) return;

      const parent = data.folders[file.parentFolderId];

      if (userId) {
        setLoading(true);
        try {
          if (file.blobUrl) {
            try {
              await deleteFileFromIndexedDB(userId, id);
              URL.revokeObjectURL(file.blobUrl);
            } catch (storageError) {
              logWarn("Failed to delete file from IndexedDB", storageError);
            }
          }
          await firestore.deleteFile(id);
          if (parent) {
            await firestore.updateFolder(parent.id, {
              fileIds: parent.fileIds.filter((fileId) => fileId !== id),
            });
          }
        } catch (error) {
          toast.error("Failed to delete file");
          logError("Delete file failed", error);
          return;
        } finally {
          setLoading(false);
        }
      } else {
        setData((prev) => {
          const nextFiles = { ...prev.files };
          if (file.blobUrl) URL.revokeObjectURL(file.blobUrl);
          delete nextFiles[id];

          if (!parent) return { ...prev, files: nextFiles };
          const nextParent = {
            ...parent,
            fileIds: parent.fileIds.filter((fileId) => fileId !== id),
          };

          return {
            ...prev,
            files: nextFiles,
            folders: { ...prev.folders, [parent.id]: nextParent },
          };
        });
      }

      if (file.blobUrl) URL.revokeObjectURL(file.blobUrl);

      if (previewFileId === id) {
        setPreviewFileId(null);
      }

      setDialog(null);
      setSelection((prev) => {
        const nextFolders = new Set(prev.folders);
        const nextFiles = new Set(prev.files);
        nextFiles.delete(id);
        return { folders: nextFolders, files: nextFiles };
      });
      toast.info("File deleted.");
    },
    [
      data.files,
      data.folders,
      firestore,
      previewFileId,
      setData,
      setDialog,
      setLoading,
      setPreviewFileId,
      setSelection,
      userId,
    ],
  );

  return {
    handleRenameFile,
    handleDeleteFile,
  };
};
