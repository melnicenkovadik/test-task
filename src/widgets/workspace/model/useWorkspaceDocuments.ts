import { useMemo } from "react";
import { useSearch } from "../../../features/search/model/useSearch";
import {
  useWorkspaceStore,
  workspaceSelectors,
} from "../../../entities/workspace/model/workspaceStore";

export const useWorkspaceDocuments = () => {
  const data = useWorkspaceStore(workspaceSelectors.data);
  const searchQuery = useWorkspaceStore(workspaceSelectors.searchQuery);

  const activeDataroom = data.activeDataroomId
    ? data.datarooms[data.activeDataroomId]
    : null;
  const activeFolder = data.activeFolderId
    ? data.folders[data.activeFolderId]
    : null;

  const folderPath = useMemo(() => {
    if (!activeFolder) return [];
    const path = [] as (typeof activeFolder)[];
    let current = activeFolder;
    while (current) {
      path.unshift(current);
      if (!current.parentId) break;
      current = data.folders[current.parentId];
    }
    return path;
  }, [activeFolder, data.folders]);

  const sortedFolders = useMemo(() => {
    if (!activeFolder) return [];
    return activeFolder.childFolderIds
      .map((id) => data.folders[id])
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [activeFolder, data.folders]);

  const sortedFiles = useMemo(() => {
    if (!activeFolder) return [];
    return activeFolder.fileIds
      .map((id) => data.files[id])
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [activeFolder, data.files]);

  const { filteredFolders, filteredFiles } = useSearch(
    sortedFolders,
    sortedFiles,
    searchQuery,
  );

  return {
    data,
    searchQuery,
    activeDataroom,
    activeFolder,
    folderPath,
    sortedFolders,
    sortedFiles,
    filteredFolders,
    filteredFiles,
  };
};
