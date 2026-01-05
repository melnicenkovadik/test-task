export type ViewMode = "grid" | "list";

export type Notice = {
  type: "success" | "error" | "info";
  message: string;
};

export type DialogState =
  | { type: "create-dataroom"; error?: string }
  | { type: "rename-dataroom"; id: string; currentName: string; error?: string }
  | { type: "create-folder"; parentId: string; error?: string }
  | { type: "rename-folder"; id: string; currentName: string; error?: string }
  | { type: "rename-file"; id: string; currentName: string; error?: string }
  | { type: "confirm-delete-dataroom"; id: string }
  | { type: "confirm-delete-folder"; id: string }
  | { type: "confirm-delete-file"; id: string }
  | { type: "confirm-bulk-delete"; folderIds: string[]; fileIds: string[] }
  | { type: "bulk-move"; folderIds: string[]; fileIds: string[] };
