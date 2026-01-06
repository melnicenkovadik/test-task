import { useMemo } from "react";
import { collectFolderIds } from "../../../entities/workspace/lib/selectors";
import type { AppState } from "../../../entities/workspace/model/types";
import {
  useWorkspaceStore,
  workspaceSelectors,
} from "../../../entities/workspace/model/workspaceStore";

const buildFolderLabel = (folderId: string, data: AppState) => {
  const parts: string[] = [];
  let current = data.folders[folderId];
  while (current) {
    if (!current.parentId) {
      parts.unshift("Documents");
      break;
    }
    parts.unshift(current.name);
    current = data.folders[current.parentId];
  }
  return parts.join(" / ");
};

export const useWorkspaceMoveOptions = () => {
  const data = useWorkspaceStore(workspaceSelectors.data);
  const dialog = useWorkspaceStore(workspaceSelectors.dialog);
  const activeDataroom = data.activeDataroomId
    ? data.datarooms[data.activeDataroomId]
    : null;
  const activeFolder = data.activeFolderId
    ? data.folders[data.activeFolderId]
    : null;

  const moveOptions = useMemo(() => {
    if (!activeDataroom) return [] as Array<{ id: string; label: string }>;
    if (dialog?.type !== "bulk-move") return [];

    const invalidTargets = new Set<string>();
    dialog.folderIds.forEach((folderId) => {
      collectFolderIds(folderId, data).forEach((id) => invalidTargets.add(id));
    });

    return Object.values(data.folders)
      .filter((folder) => folder.dataroomId === activeDataroom.id)
      .filter((folder) => !invalidTargets.has(folder.id))
      .map((folder) => ({
        id: folder.id,
        label: buildFolderLabel(folder.id, data),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [activeDataroom, data, dialog]);

  const defaultMoveTargetId = useMemo(() => {
    if (moveOptions.length === 0) return "";
    return (
      moveOptions.find((option) => option.id === activeFolder?.id)?.id ??
      moveOptions[0]?.id ??
      activeDataroom?.rootFolderId ??
      ""
    );
  }, [activeDataroom, activeFolder, moveOptions]);

  return {
    moveOptions,
    defaultMoveTargetId,
  };
};
