import { useCallback } from "react";
import type { DialogState } from "../../../shared/types";
import {
  useWorkspaceStore,
  workspaceSelectors,
} from "../../../entities/workspace/model/workspaceStore";

export const useWorkspaceDialogs = () => {
  const dialog = useWorkspaceStore(workspaceSelectors.dialog);
  const setDialog = useWorkspaceStore(workspaceSelectors.setDialog);

  const closeDialog = useCallback(() => setDialog(null), [setDialog]);
  const openDialog = useCallback(
    (nextDialog: DialogState) => setDialog(nextDialog),
    [setDialog],
  );
  const openBulkMove = useCallback(
    (folderIds: string[], fileIds: string[]) =>
      setDialog({ type: "bulk-move", folderIds, fileIds }),
    [setDialog],
  );
  const openBulkDeleteConfirm = useCallback(
    (folderIds: string[], fileIds: string[]) =>
      setDialog({ type: "confirm-bulk-delete", folderIds, fileIds }),
    [setDialog],
  );

  return {
    dialog,
    setDialog,
    closeDialog,
    openDialog,
    openBulkMove,
    openBulkDeleteConfirm,
  };
};
