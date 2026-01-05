import type { AppState, Dataroom, Folder, FileItem } from "../types";
import { createId } from "./index";

export const createEmptyState = (): AppState => ({
  datarooms: {},
  folders: {},
  files: {},
  activeDataroomId: null,
  activeFolderId: null,
});

export const createDemoState = (): AppState => {
  const dataroomId = createId();
  const rootFolderId = createId();
  const legalFolderId = createId();
  const financeFolderId = createId();
  const contractsFolderId = createId();
  const resumeFileId = createId();
  const createdAt = Date.now() - 1000 * 60 * 60 * 24 * 3;

  const dataroom: Dataroom = {
    id: dataroomId,
    name: "Acme Acquisition",
    rootFolderId,
    createdAt,
  };

  const rootFolder: Folder = {
    id: rootFolderId,
    name: "All documents",
    parentId: null,
    dataroomId,
    childFolderIds: [legalFolderId, financeFolderId],
    fileIds: [],
    createdAt,
  };

  const legalFolder: Folder = {
    id: legalFolderId,
    name: "Legal",
    parentId: rootFolderId,
    dataroomId,
    childFolderIds: [contractsFolderId],
    fileIds: [],
    createdAt: createdAt + 1000 * 60 * 60 * 8,
  };

  const contractsFolder: Folder = {
    id: contractsFolderId,
    name: "Contracts",
    parentId: legalFolderId,
    dataroomId,
    childFolderIds: [],
    fileIds: [resumeFileId],
    createdAt: createdAt + 1000 * 60 * 60 * 10,
  };

  const financeFolder: Folder = {
    id: financeFolderId,
    name: "Finance",
    parentId: rootFolderId,
    dataroomId,
    childFolderIds: [],
    fileIds: [],
    createdAt: createdAt + 1000 * 60 * 60 * 12,
  };

  const file1Id = createId();
  const file3Id = createId();

  const file1: FileItem = {
    id: file1Id,
    name: "NDA for Vadym M. .pdf",
    parentFolderId: rootFolderId,
    dataroomId,
    size: 980_000,
    createdAt: createdAt + 1000 * 60 * 60 * 2,
    source: "demo",
  };

  const file3: FileItem = {
    id: file3Id,
    name: "FY24 revenue summary.pdf",
    parentFolderId: financeFolderId,
    dataroomId,
    size: 2_340_000,
    createdAt: createdAt + 1000 * 60 * 60 * 11,
    source: "demo",
  };

  const resumeFile: FileItem = {
    id: resumeFileId,
    name: "Frontend_Vadym_Melnychenko.pdf",
    parentFolderId: contractsFolderId,
    dataroomId,
    size: 210_000,
    createdAt: createdAt + 1000 * 60 * 60 * 10 + 15_000,
    blobUrl: "/Frontend_Vadym_Melnychenko.pdf",
    source: "demo",
  };

  rootFolder.fileIds = [file1Id];
  financeFolder.fileIds = [file3Id];

  return {
    datarooms: { [dataroomId]: dataroom },
    folders: {
      [rootFolderId]: rootFolder,
      [legalFolderId]: legalFolder,
      [contractsFolderId]: contractsFolder,
      [financeFolderId]: financeFolder,
    },
    files: {
      [file1Id]: file1,
      [file3Id]: file3,
      [resumeFileId]: resumeFile,
    },
    activeDataroomId: dataroomId,
    activeFolderId: rootFolderId,
  };
};
