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

export type { ViewMode, Notice, DialogState } from "../shared/types";
