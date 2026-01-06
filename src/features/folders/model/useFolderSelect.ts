import { useCallback } from "react";
import { toast } from "sonner";
import type { Folder } from "../../../entities/folder/model/types";
import { useLoadingStore } from "../../../shared/model/loadingStore";
import { useUIStore } from "../../../shared/model/uiStore";
import { logError } from "../../../shared/lib/logger";
import { useFirestore } from "../../data/model/useFirestore";
import {
  useWorkspaceStore,
  workspaceSelectors,
} from "../../../entities/workspace/model/workspaceStore";

type FirestoreApi = Pick<ReturnType<typeof useFirestore>, "setActiveFolderId">;

export const useFolderSelect = (
  userId: string | null,
  firestore: FirestoreApi,
) => {
  const data = useWorkspaceStore(workspaceSelectors.data);
  const setData = useWorkspaceStore(workspaceSelectors.setData);
  const clearSelection = useWorkspaceStore(workspaceSelectors.clearSelection);
  const { addFolder } = useUIStore();
  const { setLoading } = useLoadingStore();

  const handleSelectFolder = useCallback(
    async (folderId: string) => {
      const folder = data.folders[folderId];

      if (folder && data.activeDataroomId) {
        let current: Folder | undefined = folder;
        while (current && current.parentId) {
          addFolder(data.activeDataroomId, current.parentId);
          current = data.folders[current.parentId];
        }
      }

      if (userId) {
        setLoading(true);
        try {
          await firestore.setActiveFolderId(folderId);

          setData((prev) => ({
            ...prev,
            activeFolderId: folderId,
          }));
        } catch (error) {
          toast.error("Failed to select folder");
          logError("Select folder failed", error);
          return;
        } finally {
          setLoading(false);
        }
      } else {
        setData((prev) => ({
          ...prev,
          activeFolderId: folderId,
        }));
      }

      clearSelection();
    },
    [addFolder, clearSelection, data, firestore, setData, setLoading, userId],
  );

  return { handleSelectFolder };
};
