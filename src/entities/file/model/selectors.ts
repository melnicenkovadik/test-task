import type { FileItem } from "./types";
import type { AppState } from "../../../types";
import { isPdfFile as checkIsPdfFile } from "../../../shared/lib/utils";

export const isPdfFile = checkIsPdfFile;

export const getSortedFiles = (
  parentId: string,
  state: AppState,
): FileItem[] => {
  const parent = state.folders[parentId];
  if (!parent) return [];
  return parent.fileIds
    .map((id) => state.files[id])
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));
};
