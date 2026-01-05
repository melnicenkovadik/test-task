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
