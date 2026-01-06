import { useCallback } from "react";
import { toast } from "sonner";
import {
  createId,
  makeUniqueName,
  normalizeName,
} from "../../../shared/lib/utils";
import { useUIStore } from "../../../shared/model/uiStore";
import { useLoadingStore } from "../../../shared/model/loadingStore";
import { logError } from "../../../shared/lib/logger";
import { useViewModeStore } from "../../view-mode/model/store";
import { DEFAULT_VIEW_MODE } from "../../../shared/lib/viewMode";
import { useFirestore } from "../../data/model/useFirestore";
import {
  useWorkspaceStore,
  workspaceSelectors,
} from "../../../entities/workspace/model/workspaceStore";

type FirestoreApi = Pick<
  ReturnType<typeof useFirestore>,
  | "createDataroom"
  | "updateDataroom"
  | "createFolder"
  | "setActiveDataroomId"
  | "setActiveFolderId"
>;

const createRootFolder = (
  dataroomId: string,
  rootFolderId: string,
  createdAt: number,
) => ({
  id: rootFolderId,
  name: "All documents",
  parentId: null,
  dataroomId,
  childFolderIds: [],
  fileIds: [],
  createdAt,
});

export const useDataroomCreateRename = (
  userId: string | null,
  firestore: FirestoreApi,
) => {
  const data = useWorkspaceStore(workspaceSelectors.data);
  const setData = useWorkspaceStore(workspaceSelectors.setData);
  const setDialog = useWorkspaceStore(workspaceSelectors.setDialog);
  const clearSelection = useWorkspaceStore(workspaceSelectors.clearSelection);
  const { setExpandedFolders } = useUIStore();
  const { setLoading } = useLoadingStore();
  const setViewModeStore = useViewModeStore((state) => state.setViewMode);

  const handleCreateDataroom = useCallback(
    async (name: string) => {
      const normalized = normalizeName(name);
      if (!normalized) {
        setDialog((prev) =>
          prev && "error" in prev
            ? { ...prev, error: "Name is required." }
            : prev,
        );
        return;
      }

      const used = new Set(
        Object.values(data.datarooms).map((room) => room.name.toLowerCase()),
      );
      const finalName = makeUniqueName(normalized, used);
      const dataroomId = createId();
      const rootFolderId = createId();
      const now = Date.now();

      const newDataroom = {
        id: dataroomId,
        name: finalName,
        rootFolderId,
        createdAt: now,
      };

      const newRootFolder = createRootFolder(dataroomId, rootFolderId, now);

      if (userId) {
        setLoading(true);
        try {
          await firestore.createDataroom(newDataroom);
          await firestore.createFolder(newRootFolder);
          await firestore.setActiveDataroomId(dataroomId);
          await firestore.setActiveFolderId(rootFolderId);

          setData((prev) => ({
            ...prev,
            datarooms: {
              ...prev.datarooms,
              [dataroomId]: newDataroom,
            },
            folders: {
              ...prev.folders,
              [rootFolderId]: newRootFolder,
            },
            activeDataroomId: dataroomId,
            activeFolderId: rootFolderId,
          }));
        } catch (error) {
          toast.error("Failed to create data room");
          logError("Create data room failed", error);
          return;
        } finally {
          setLoading(false);
        }
      } else {
        setData((prev) => ({
          ...prev,
          datarooms: {
            ...prev.datarooms,
            [dataroomId]: newDataroom,
          },
          folders: {
            ...prev.folders,
            [rootFolderId]: newRootFolder,
          },
          activeDataroomId: dataroomId,
          activeFolderId: rootFolderId,
        }));
      }

      setExpandedFolders(dataroomId, [rootFolderId]);
      setViewModeStore(dataroomId, DEFAULT_VIEW_MODE);
      setDialog(null);
      clearSelection();
      toast.success(`Data room "${finalName}" created.`);
    },
    [
      clearSelection,
      data.datarooms,
      firestore,
      setData,
      setDialog,
      setExpandedFolders,
      setLoading,
      setViewModeStore,
      userId,
    ],
  );

  const handleRenameDataroom = useCallback(
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

      const used = new Set(
        Object.values(data.datarooms)
          .filter((room) => room.id !== id)
          .map((room) => room.name.toLowerCase()),
      );

      if (used.has(normalized.toLowerCase())) {
        setDialog((prev) =>
          prev && "error" in prev
            ? { ...prev, error: "A data room with this name already exists." }
            : prev,
        );
        return;
      }

      if (userId) {
        setLoading(true);
        try {
          await firestore.updateDataroom(id, { name: normalized });
        } catch (error) {
          toast.error("Failed to rename data room");
          logError("Rename data room failed", error);
          return;
        } finally {
          setLoading(false);
        }
      } else {
        setData((prev) => ({
          ...prev,
          datarooms: {
            ...prev.datarooms,
            [id]: { ...prev.datarooms[id], name: normalized },
          },
        }));
      }
      setDialog(null);
      toast.success("Data room renamed.");
    },
    [data.datarooms, firestore, setData, setDialog, setLoading, userId],
  );

  return {
    handleCreateDataroom,
    handleRenameDataroom,
  };
};
