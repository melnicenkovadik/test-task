export type Folder = {
  id: string;
  name: string;
  parentId: string | null;
  dataroomId: string;
  childFolderIds: string[];
  fileIds: string[];
  createdAt: number;
};
