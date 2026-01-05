import { useMemo } from "react";
import { normalizeName } from "../../../shared/lib/utils";
import type { Folder } from "../../../entities/folder/model/types";
import type { FileItem } from "../../../entities/file/model/types";

export const useSearch = (
  folders: Folder[],
  files: FileItem[],
  searchQuery: string,
) => {
  const filteredFolders = useMemo(() => {
    const query = normalizeName(searchQuery).toLowerCase();
    if (!query) return folders;
    return folders.filter((folder) =>
      folder.name.toLowerCase().includes(query),
    );
  }, [folders, searchQuery]);

  const filteredFiles = useMemo(() => {
    const query = normalizeName(searchQuery).toLowerCase();
    if (!query) return files;
    return files.filter((file) => file.name.toLowerCase().includes(query));
  }, [files, searchQuery]);

  return {
    filteredFolders,
    filteredFiles,
  };
};
