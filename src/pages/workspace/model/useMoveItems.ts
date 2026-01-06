import { useCallback } from "react";
import { toast } from "sonner";
import type { FileItem } from "../../../entities/file/model/types";
import type { Folder } from "../../../entities/folder/model/types";
import {
  collectFolderIds,
  getSiblingNames,
} from "../../../entities/workspace/lib/selectors";
import { makeUniqueFilename, makeUniqueName } from "../../../shared/lib/utils";
import { logError } from "../../../shared/lib/logger";
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
  "updateFolder" | "updateFile"
>;

type FolderUpdate = { id: string; updates: Partial<Folder> };
type FileUpdate = { id: string; updates: Partial<FileItem> };

export const useMoveItems = (
  userId: string | null,
  firestore: FirestoreApi,
) => {
  const data = useWorkspaceStore(workspaceSelectors.data);
  const setData = useWorkspaceStore(workspaceSelectors.setData);
  const { setLoading } = useLoadingStore();
  const { addFolder } = useUIStore();
  const { clearSelection } = useWorkspaceSelection();

  const moveItemsToFolder = useCallback(
    async (targetFolderId: string, folderIds: string[], fileIds: string[]) => {
      if (!targetFolderId) return;

      const targetFolder = data.folders[targetFolderId];
      if (!targetFolder) return;

      const usedNames = getSiblingNames(targetFolderId, data);
      const movedFolderIds: string[] = [];
      const movedFileIds: string[] = [];
      let skippedCount = 0;

      const folderUpdates: FolderUpdate[] = [];
      const fileUpdates: FileUpdate[] = [];
      const parentFolderUpdates: Map<string, Partial<Folder>> = new Map();

      folderIds.forEach((folderId) => {
        const folder = data.folders[folderId];
        if (!folder) return;
        if (folder.parentId === targetFolderId) return;

        const descendants = collectFolderIds(folderId, data);
        if (descendants.has(targetFolderId)) {
          skippedCount += 1;
          return;
        }

        const nextName = makeUniqueName(folder.name, usedNames);
        usedNames.add(nextName.toLowerCase());

        const parentFolder = folder.parentId
          ? data.folders[folder.parentId]
          : null;
        if (parentFolder) {
          const existing = parentFolderUpdates.get(parentFolder.id);
          const currentUpdates: Partial<Folder> = existing || {
            childFolderIds: [...parentFolder.childFolderIds],
            fileIds: [...parentFolder.fileIds],
          };
          currentUpdates.childFolderIds = (
            currentUpdates.childFolderIds || [...parentFolder.childFolderIds]
          ).filter((childId) => childId !== folderId);
          parentFolderUpdates.set(parentFolder.id, currentUpdates);
        }

        folderUpdates.push({
          id: folderId,
          updates: { name: nextName, parentId: targetFolderId },
        });
        movedFolderIds.push(folderId);
      });

      fileIds.forEach((fileId) => {
        const file = data.files[fileId];
        if (!file) return;
        if (file.parentFolderId === targetFolderId) return;

        const nextName = makeUniqueFilename(file.name, usedNames);
        usedNames.add(nextName.toLowerCase());

        const parentFolder = data.folders[file.parentFolderId];
        if (parentFolder) {
          const existing = parentFolderUpdates.get(parentFolder.id);
          const currentUpdates: Partial<Folder> = existing || {
            childFolderIds: [...parentFolder.childFolderIds],
            fileIds: [...parentFolder.fileIds],
          };
          currentUpdates.fileIds = (
            currentUpdates.fileIds || [...parentFolder.fileIds]
          ).filter((itemId) => itemId !== fileId);
          parentFolderUpdates.set(parentFolder.id, currentUpdates);
        }

        fileUpdates.push({
          id: fileId,
          updates: { name: nextName, parentFolderId: targetFolderId },
        });
        movedFileIds.push(fileId);
      });

      if (movedFolderIds.length === 0 && movedFileIds.length === 0) {
        toast.info("Nothing to move.");
        return;
      }

      if (userId) {
        setLoading(true);
        try {
          await Promise.all(
            folderUpdates.map(({ id, updates }) =>
              firestore.updateFolder(id, updates),
            ),
          );
          await Promise.all(
            fileUpdates.map(({ id, updates }) =>
              firestore.updateFile(id, updates),
            ),
          );
          await Promise.all(
            Array.from(parentFolderUpdates.entries()).map(([id, updates]) =>
              firestore.updateFolder(id, updates),
            ),
          );

          const updatedTarget = {
            childFolderIds: [
              ...targetFolder.childFolderIds,
              ...movedFolderIds.filter(
                (id) => !targetFolder.childFolderIds.includes(id),
              ),
            ],
            fileIds: [
              ...targetFolder.fileIds,
              ...movedFileIds.filter(
                (id) => !targetFolder.fileIds.includes(id),
              ),
            ],
          };
          await firestore.updateFolder(targetFolderId, updatedTarget);
        } catch (error) {
          toast.error("Failed to move items");
          logError("Move items failed", error);
          return;
        } finally {
          setLoading(false);
        }
      } else {
        setData((prev) => {
          const nextFolders = { ...prev.folders };
          const nextFiles = { ...prev.files };

          folderUpdates.forEach(({ id, updates }) => {
            nextFolders[id] = { ...nextFolders[id], ...updates };
          });

          fileUpdates.forEach(({ id, updates }) => {
            nextFiles[id] = { ...nextFiles[id], ...updates };
          });

          parentFolderUpdates.forEach((updates, id) => {
            nextFolders[id] = { ...nextFolders[id], ...updates };
          });

          const updatedTarget = {
            ...nextFolders[targetFolderId],
            childFolderIds: [
              ...nextFolders[targetFolderId].childFolderIds,
              ...movedFolderIds.filter(
                (id) =>
                  !nextFolders[targetFolderId].childFolderIds.includes(id),
              ),
            ],
            fileIds: [
              ...nextFolders[targetFolderId].fileIds,
              ...movedFileIds.filter(
                (id) => !nextFolders[targetFolderId].fileIds.includes(id),
              ),
            ],
          };
          nextFolders[targetFolderId] = updatedTarget;

          return {
            ...prev,
            folders: nextFolders,
            files: nextFiles,
          };
        });
      }

      const movedCount = movedFolderIds.length + movedFileIds.length;
      if (movedCount > 0) {
        if (data.activeDataroomId) {
          addFolder(data.activeDataroomId, targetFolderId);
        }
        clearSelection();
        toast.success(`Moved ${movedCount} item(s).`);
      } else {
        toast.info("Nothing to move.");
      }

      if (skippedCount > 0) {
        toast.info("Some items could not be moved.");
      }
    },
    [addFolder, clearSelection, data, firestore, setData, setLoading, userId],
  );

  return {
    moveItemsToFolder,
  };
};
