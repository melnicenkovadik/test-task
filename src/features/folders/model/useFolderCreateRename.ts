import { useCallback } from "react";
import { toast } from "sonner";
import {
  createId,
  makeUniqueName,
  normalizeName,
} from "../../../shared/lib/utils";
import { getSiblingNames } from "../../../entities/workspace/lib/selectors";
import { logError } from "../../../shared/lib/logger";
import { useLoadingStore } from "../../../shared/model/loadingStore";
import { useUIStore } from "../../../shared/model/uiStore";
import { useFirestore } from "../../data/model/useFirestore";
import {
  useWorkspaceStore,
  workspaceSelectors,
} from "../../../entities/workspace/model/workspaceStore";

type FirestoreApi = Pick<
  ReturnType<typeof useFirestore>,
  "createFolder" | "updateFolder"
>;

export const useFolderCreateRename = (
  userId: string | null,
  firestore: FirestoreApi,
) => {
  const data = useWorkspaceStore(workspaceSelectors.data);
  const setData = useWorkspaceStore(workspaceSelectors.setData);
  const setDialog = useWorkspaceStore(workspaceSelectors.setDialog);
  const { setLoading } = useLoadingStore();
  const { addFolder } = useUIStore();

  const handleCreateFolder = useCallback(
    async (parentId: string, name: string) => {
      const normalized = normalizeName(name);
      if (!normalized) {
        setDialog((prev) =>
          prev && "error" in prev
            ? { ...prev, error: "Name is required." }
            : prev,
        );
        return;
      }

      if (!parentId) {
        toast.error("No parent folder selected");
        setDialog(null);
        return;
      }

      const parent = data.folders[parentId];
      if (!parent) {
        toast.error("Parent folder not found");
        setDialog(null);
        return;
      }

      const used = getSiblingNames(parentId, data);
      const finalName = makeUniqueName(normalized, used);
      const folderId = createId();
      const now = Date.now();

      const newFolder = {
        id: folderId,
        name: finalName,
        parentId,
        dataroomId: parent.dataroomId,
        childFolderIds: [],
        fileIds: [],
        createdAt: now,
      };

      if (userId) {
        setLoading(true);
        try {
          await firestore.createFolder(newFolder);
          await firestore.updateFolder(parentId, {
            childFolderIds: [...parent.childFolderIds, folderId],
          });
        } catch (error) {
          toast.error("Failed to create folder");
          logError("Create folder failed", error);
          return;
        } finally {
          setLoading(false);
        }
      } else {
        setData((prev) => ({
          ...prev,
          folders: {
            ...prev.folders,
            [folderId]: newFolder,
            [parentId]: {
              ...parent,
              childFolderIds: [...parent.childFolderIds, folderId],
            },
          },
        }));
      }

      if (data.activeDataroomId) {
        addFolder(data.activeDataroomId, parentId);
      }

      setDialog(null);
      toast.success("Folder created.");
    },
    [addFolder, data, firestore, setData, setDialog, setLoading, userId],
  );

  const handleRenameFolder = useCallback(
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

      const folder = data.folders[id];
      if (!folder) return;
      const used = getSiblingNames(folder.parentId ?? folder.id, data, id);

      if (used.has(normalized.toLowerCase())) {
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
          await firestore.updateFolder(id, { name: normalized });
        } catch (error) {
          toast.error("Failed to rename folder");
          logError("Rename folder failed", error);
          return;
        } finally {
          setLoading(false);
        }
      } else {
        setData((prev) => ({
          ...prev,
          folders: {
            ...prev.folders,
            [id]: { ...prev.folders[id], name: normalized },
          },
        }));
      }

      setDialog(null);
      toast.success("Folder renamed.");
    },
    [data, firestore, setData, setDialog, setLoading, userId],
  );

  return {
    handleCreateFolder,
    handleRenameFolder,
  };
};
