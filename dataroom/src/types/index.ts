export type Dataroom = {
  id: string;
  name: string;
  rootFolderId: string;
  createdAt: number;
};

export type Folder = {
  id: string;
  name: string;
  parentId: string | null;
  dataroomId: string;
  childFolderIds: string[];
  fileIds: string[];
  createdAt: number;
};

export type FileItem = {
  id: string;
  name: string;
  parentFolderId: string;
  dataroomId: string;
  size: number;
  createdAt: number;
  blobUrl?: string;
  source: "upload" | "demo";
};

export type AppState = {
  datarooms: Record<string, Dataroom>;
  folders: Record<string, Folder>;
  files: Record<string, FileItem>;
  activeDataroomId: string | null;
  activeFolderId: string | null;
};

export type Notice = {
  type: "success" | "error" | "info";
  message: string;
};

export type ViewMode = "grid" | "list";

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
