import type { Dataroom } from "./types";
import type { AppState } from "../../../types";

export const getDataroomStats = (dataroomId: string, state: AppState) => {
  const fileCount = Object.values(state.files).filter(
    (file) => file.dataroomId === dataroomId,
  ).length;
  const folderCount = Object.values(state.folders).filter(
    (folder) => folder.dataroomId === dataroomId,
  ).length;
  return { fileCount, folderCount };
};

export const getDataroomList = (datarooms: Record<string, Dataroom>) => {
  return Object.values(datarooms).sort((a, b) => a.name.localeCompare(b.name));
};
