import type { Folder } from "./types";
import type { AppState } from "../../../types";
import {
  getSiblingNames,
  getDescendantStats,
  collectFolderIds,
} from "../../../shared/lib/selectors";

export { getSiblingNames, getDescendantStats, collectFolderIds };

export const getFolderPath = (
  folderId: string | null,
  state: AppState,
): Folder[] => {
  if (!folderId) return [];
  const path: Folder[] = [];
  let current = state.folders[folderId];
  while (current) {
    path.unshift(current);
    if (!current.parentId) break;
    current = state.folders[current.parentId];
  }
  return path;
};

export const getSortedFolders = (
  parentId: string | null,
  state: AppState,
): Folder[] => {
  if (!parentId) return [];
  const parent = state.folders[parentId];
  if (!parent) return [];
  return parent.childFolderIds
    .map((id) => state.folders[id])
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));
};
