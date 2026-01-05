import type { AppState } from "../types";

export const createId = () => crypto.randomUUID();

export const normalizeName = (value: string) =>
  value.trim().replace(/\s+/g, " ");

export const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
};

export const formatDate = (timestamp: number) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return formatter.format(new Date(timestamp));
};

export const cx = (...classes: Array<string | false | undefined>) =>
  classes.filter(Boolean).join(" ");

export const isPdfFile = (file: File) =>
  file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

export const splitFileName = (name: string) => {
  const lastDot = name.lastIndexOf(".");
  if (lastDot <= 0) return { base: name, ext: "" };
  return { base: name.slice(0, lastDot), ext: name.slice(lastDot) };
};

export const makeUniqueName = (name: string, usedNames: Set<string>) => {
  let candidate = name;
  let counter = 1;
  while (usedNames.has(candidate.toLowerCase())) {
    candidate = `${name} (${counter})`;
    counter += 1;
  }
  return candidate;
};

export const makeUniqueFilename = (name: string, usedNames: Set<string>) => {
  const normalized = normalizeName(name) || "Untitled.pdf";
  const { base, ext } = splitFileName(normalized);
  const extension = ext || ".pdf";
  let candidate = `${base}${extension}`;
  let counter = 1;
  while (usedNames.has(candidate.toLowerCase())) {
    candidate = `${base} (${counter})${extension}`;
    counter += 1;
  }
  return candidate;
};

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
