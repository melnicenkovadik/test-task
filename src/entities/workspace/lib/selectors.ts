import type { AppState } from "../model/types";

export const getSiblingNames = (
  folderId: string,
  snapshot: AppState,
  excludeId?: string,
) => {
  const folder = snapshot.folders[folderId];
  const names = new Set<string>();
  if (!folder) return names;
  folder.childFolderIds.forEach((id) => {
    if (id !== excludeId) {
      const child = snapshot.folders[id];
      if (child) names.add(child.name.toLowerCase());
    }
  });
  folder.fileIds.forEach((id) => {
    if (id !== excludeId) {
      const file = snapshot.files[id];
      if (file) names.add(file.name.toLowerCase());
    }
  });
  return names;
};

export const getDescendantStats = (folderId: string, snapshot: AppState) => {
  const folderIds: string[] = [];
  const fileIds: string[] = [];
  const stack = [folderId];

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId) continue;
    const folder = snapshot.folders[currentId];
    if (!folder) continue;

    if (currentId !== folderId) {
      folderIds.push(currentId);
    }

    folder.childFolderIds.forEach((childId) => stack.push(childId));
    folder.fileIds.forEach((fileId) => fileIds.push(fileId));
  }

  return { folderCount: folderIds.length, fileCount: fileIds.length };
};

export const collectFolderIds = (folderId: string, snapshot: AppState) => {
  const ids = new Set<string>();
  const stack = [folderId];

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId) continue;
    const folder = snapshot.folders[currentId];
    if (!folder) continue;
    ids.add(currentId);
    folder.childFolderIds.forEach((childId) => stack.push(childId));
  }

  return ids;
};
