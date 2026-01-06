import { useEffect } from "react";
import { useFirestore } from "../../../features/data/model/useFirestore";
import { getAllUserFiles } from "../../../shared/lib/indexedDB";
import { logError } from "../../../shared/lib/logger";
import { createEmptyState } from "../../../entities/workspace/lib/demo";
import type { AppState } from "../../../entities/workspace/model/types";
import {
  useWorkspaceStore,
  workspaceSelectors,
} from "../../../entities/workspace/model/workspaceStore";
import { DEFAULT_VIEW_MODE } from "../../../shared/lib/viewMode";

export const useWorkspaceData = (userId: string | null) => {
  const setData = useWorkspaceStore(workspaceSelectors.setData);
  const setViewMode = useWorkspaceStore(workspaceSelectors.setViewMode);
  const firestore = useFirestore(userId);

  useEffect(() => {
    if (userId && firestore.data && !firestore.loading) {
      const resolveActiveIds = (prev: AppState) => {
        const firestoreActiveDataroomId = firestore.data.activeDataroomId;
        const firestoreActiveFolderId = firestore.data.activeFolderId;

        const activeDataroomId =
          (prev.activeDataroomId &&
          firestore.data.datarooms[prev.activeDataroomId]
            ? prev.activeDataroomId
            : null) ??
          (firestoreActiveDataroomId &&
          firestore.data.datarooms[firestoreActiveDataroomId]
            ? firestoreActiveDataroomId
            : null);

        const folderMatchesActiveRoom = (folderId: string | null) =>
          folderId &&
          firestore.data.folders[folderId] &&
          (!activeDataroomId ||
            firestore.data.folders[folderId].dataroomId === activeDataroomId);

        const activeFolderId =
          (folderMatchesActiveRoom(prev.activeFolderId)
            ? prev.activeFolderId
            : null) ??
          (folderMatchesActiveRoom(firestoreActiveFolderId)
            ? firestoreActiveFolderId
            : null) ??
          (activeDataroomId
            ? (firestore.data.datarooms[activeDataroomId]?.rootFolderId ?? null)
            : null);

        return { activeDataroomId, activeFolderId };
      };

      const hydrateFromIndexedDB = async () => {
        try {
          const indexedDBFiles = await getAllUserFiles(userId);
          const updatedFiles = { ...firestore.data.files };
          Object.keys(firestore.data.files).forEach((fileId) => {
            if (indexedDBFiles[fileId]) {
              updatedFiles[fileId] = {
                ...updatedFiles[fileId],
                blobUrl: indexedDBFiles[fileId],
              };
            }
          });

          setData((prev) => {
            const { activeDataroomId, activeFolderId } = resolveActiveIds(prev);

            return {
              ...firestore.data,
              files: updatedFiles,
              activeFolderId,
              activeDataroomId,
            };
          });
        } catch (error) {
          logError("Error loading files from IndexedDB", error);
          setData((prev) => {
            const { activeDataroomId, activeFolderId } = resolveActiveIds(prev);

            return {
              ...firestore.data,
              activeFolderId,
              activeDataroomId,
            };
          });
        }
      };

      hydrateFromIndexedDB();
      return;
    }

    if (!userId) {
      setData(createEmptyState);
      setViewMode(DEFAULT_VIEW_MODE);
    }
  }, [userId, firestore.data, firestore.loading, setData, setViewMode]);

  return firestore;
};
