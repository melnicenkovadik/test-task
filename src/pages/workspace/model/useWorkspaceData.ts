import { useEffect } from "react";
import { useFirestore } from "../../../features/data/model/useFirestore";
import { getAllUserFiles } from "../../../shared/lib/indexedDB";
import { logError } from "../../../shared/lib/logger";
import { createEmptyState } from "../../../entities/workspace/lib/demo";
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
            const activeFolderId =
              prev.activeFolderId && firestore.data.folders[prev.activeFolderId]
                ? prev.activeFolderId
                : firestore.data.activeFolderId || prev.activeFolderId;
            const activeDataroomId =
              prev.activeDataroomId &&
              firestore.data.datarooms[prev.activeDataroomId]
                ? prev.activeDataroomId
                : firestore.data.activeDataroomId || prev.activeDataroomId;

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
            const activeFolderId =
              prev.activeFolderId && firestore.data.folders[prev.activeFolderId]
                ? prev.activeFolderId
                : firestore.data.activeFolderId || prev.activeFolderId;
            const activeDataroomId =
              prev.activeDataroomId &&
              firestore.data.datarooms[prev.activeDataroomId]
                ? prev.activeDataroomId
                : firestore.data.activeDataroomId || prev.activeDataroomId;

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
