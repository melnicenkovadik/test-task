import { useCallback } from "react";

type SelectionState = {
  folders: Set<string>;
  files: Set<string>;
};

type DragPayload = {
  folderIds: string[];
  fileIds: string[];
};

export function useDragAndDrop(selection: SelectionState) {
  const buildDragPayload = useCallback(
    (type: "folder" | "file", id: string): DragPayload => {
      const folderIds = selection.folders;
      const fileIds = selection.files;
      const isSelected =
        type === "folder" ? folderIds.has(id) : fileIds.has(id);

      if (isSelected) {
        return {
          folderIds: Array.from(folderIds),
          fileIds: Array.from(fileIds),
        };
      }

      return {
        folderIds: type === "folder" ? [id] : [],
        fileIds: type === "file" ? [id] : [],
      };
    },
    [selection],
  );

  const parseDragPayload = useCallback(
    (event: React.DragEvent<HTMLElement>): DragPayload | null => {
      const raw = event.dataTransfer.getData("application/json");
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw) as DragPayload;
        if (
          !Array.isArray(parsed.folderIds) ||
          !Array.isArray(parsed.fileIds)
        ) {
          return null;
        }
        return {
          folderIds: parsed.folderIds.filter(Boolean),
          fileIds: parsed.fileIds.filter(Boolean),
        };
      } catch {
        return null;
      }
    },
    [],
  );

  const handleDragStartItem = useCallback(
    (
      event: React.DragEvent<HTMLDivElement>,
      type: "folder" | "file",
      id: string,
    ) => {
      const payload = buildDragPayload(type, id);
      event.dataTransfer.setData("application/json", JSON.stringify(payload));
      event.dataTransfer.effectAllowed = "move";
    },
    [buildDragPayload],
  );

  const handleDragOverFolder = useCallback(
    (event: React.DragEvent<HTMLElement>) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    },
    [],
  );

  return {
    buildDragPayload,
    parseDragPayload,
    handleDragStartItem,
    handleDragOverFolder,
  };
}
