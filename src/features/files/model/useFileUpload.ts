import { useCallback } from "react";
import { toast } from "sonner";
import type { FileItem } from "../../../entities/file/model/types";
import {
  createId,
  isPdfFile,
  makeUniqueFilename,
} from "../../../shared/lib/utils";
import { getSiblingNames } from "../../../entities/workspace/lib/selectors";
import { logError } from "../../../shared/lib/logger";
import { saveFileToIndexedDB } from "../../../shared/lib/indexedDB";
import { useLoadingStore } from "../../../shared/model/loadingStore";
import { useFirestore } from "../../data/model/useFirestore";
import {
  useWorkspaceStore,
  workspaceSelectors,
} from "../../../entities/workspace/model/workspaceStore";

type FirestoreApi = Pick<
  ReturnType<typeof useFirestore>,
  "createFile" | "updateFolder"
>;

export const useFileUpload = (
  userId: string | null,
  firestore: FirestoreApi,
) => {
  const data = useWorkspaceStore(workspaceSelectors.data);
  const setData = useWorkspaceStore(workspaceSelectors.setData);
  const setPreviewFileId = useWorkspaceStore(
    workspaceSelectors.setPreviewFileId,
  );
  const { setLoading } = useLoadingStore();

  const handleUploadFiles = useCallback(
    async (files: FileList | File[], folderId: string) => {
      const fileArray = Array.from(files);
      const validFiles = fileArray.filter(isPdfFile);
      const invalidCount = fileArray.length - validFiles.length;

      if (validFiles.length === 0) {
        toast.error("Only PDF files are accepted.");
        return;
      }

      toast.info(
        "Files are stored locally in your browser. They will not be synced to Firebase Storage.",
        { duration: 5000 },
      );

      const parent = data.folders[folderId];
      if (!parent) return;

      const usedNames = getSiblingNames(folderId, data);
      const newFiles: FileItem[] = [];
      let previewId: string | null = null;
      const now = Date.now();

      if (userId) {
        setLoading(true);
        try {
          const uploadPromises = validFiles.map(async (file) => {
            const fileId = createId();
            const uniqueName = makeUniqueFilename(file.name, usedNames);
            usedNames.add(uniqueName.toLowerCase());

            const blobUrl = await saveFileToIndexedDB(userId, fileId, file);

            const newFile: FileItem = {
              id: fileId,
              name: uniqueName,
              parentFolderId: folderId,
              dataroomId: parent.dataroomId,
              size: file.size,
              createdAt: now,
              blobUrl,
              source: "upload",
            };

            await firestore.createFile(newFile);
            return newFile;
          });

          const uploadedFiles = await Promise.all(uploadPromises);
          newFiles.push(...uploadedFiles);
          if (uploadedFiles.length > 0) previewId = uploadedFiles[0].id;

          const updatedFileIds = [
            ...(parent.fileIds || []),
            ...uploadedFiles.map((file) => file.id),
          ];
          await firestore.updateFolder(folderId, {
            fileIds: updatedFileIds,
          });

          setData((prev) => {
            const nextFiles = { ...prev.files };
            const currentParent = prev.folders[folderId] || parent;
            const nextFolder = { ...currentParent, fileIds: updatedFileIds };

            uploadedFiles.forEach((file) => {
              nextFiles[file.id] = file;
            });

            return {
              ...prev,
              files: nextFiles,
              folders: { ...prev.folders, [folderId]: nextFolder },
            };
          });
        } catch (error) {
          toast.error("Failed to upload files");
          logError("Upload files failed", error);
          return;
        } finally {
          setLoading(false);
        }
      } else {
        setData((prev) => {
          const nextFiles = { ...prev.files };
          const currentParent = prev.folders[folderId] || parent;
          const nextFolder = {
            ...currentParent,
            fileIds: [...(currentParent.fileIds || [])],
          };

          newFiles.forEach((file) => {
            nextFiles[file.id] = file;
            nextFolder.fileIds.push(file.id);
          });

          return {
            ...prev,
            files: nextFiles,
            folders: { ...prev.folders, [folderId]: nextFolder },
          };
        });
      }

      if (previewId) {
        setPreviewFileId(previewId);
      }
      if (invalidCount > 0) {
        toast.info(
          `Uploaded ${validFiles.length} PDF(s). ${invalidCount} file(s) skipped.`,
        );
      } else {
        toast.success("Files uploaded successfully.");
      }
    },
    [data, firestore, setData, setLoading, setPreviewFileId, userId],
  );

  return { handleUploadFiles };
};
