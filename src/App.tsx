import { useEffect, useMemo, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import type { AppState, DialogState, FileItem, ViewMode } from "./types";
import {
  collectFolderIds,
  createId,
  getDescendantStats,
  getSiblingNames,
  isPdfFile,
  makeUniqueName,
  makeUniqueFilename,
  normalizeName,
} from "./utils";
import { createDemoState, createEmptyState } from "./utils/demo";
import { DEFAULT_VIEW_MODE, useDocumentsStore } from "./store/documentsStore";
import {
  ConfirmDialog,
  DataroomPanel,
  DocumentsPanel,
  EmptyDataroom,
  FolderPanel,
  Header,
  NameDialog,
  MoveItemsDialog,
  FilePreview,
} from "./components";

type SelectionState = {
  folders: Set<string>;
  files: Set<string>;
};

type DragPayload = {
  folderIds: string[];
  fileIds: string[];
};

export default function App() {
  const [data, setData] = useState<AppState>(createEmptyState);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(DEFAULT_VIEW_MODE);
  const [selection, setSelection] = useState<SelectionState>(() => ({
    folders: new Set(),
    files: new Set(),
  }));

  const activeDataroom = data.activeDataroomId
    ? data.datarooms[data.activeDataroomId]
    : null;
  const activeFolder = data.activeFolderId
    ? data.folders[data.activeFolderId]
    : null;
  const previewFile = previewFileId ? data.files[previewFileId] : null;
  const setViewModeStore = useDocumentsStore((state) => state.setViewMode);

  const resolveViewMode = (dataroomId: string | null) => {
    if (!dataroomId) return DEFAULT_VIEW_MODE;
    return (
      useDocumentsStore.getState().cases[dataroomId]?.viewMode ??
      DEFAULT_VIEW_MODE
    );
  };

  // Cleanup blob URLs on unmount
  const filesRef = useRef<Record<string, FileItem>>(data.files);
  useEffect(() => {
    filesRef.current = data.files;
  }, [data.files]);

  useEffect(() => {
    return () => {
      Object.values(filesRef.current).forEach((file: FileItem) => {
        if (file.blobUrl) {
          URL.revokeObjectURL(file.blobUrl);
        }
      });
    };
  }, []);

  // Compute folder path
  const folderPath = useMemo(() => {
    if (!activeFolder) return [];
    const path = [];
    let current = activeFolder;
    while (current) {
      path.unshift(current);
      if (!current.parentId) break;
      current = data.folders[current.parentId];
    }
    return path;
  }, [activeFolder, data.folders]);

  // Sorted folders and files
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

  // Filtered folders and files
  const filteredFolders = useMemo(() => {
    const query = normalizeName(searchQuery).toLowerCase();
    if (!query) return sortedFolders;
    return sortedFolders.filter((folder) =>
      folder.name.toLowerCase().includes(query),
    );
  }, [sortedFolders, searchQuery]);

  const filteredFiles = useMemo(() => {
    const query = normalizeName(searchQuery).toLowerCase();
    if (!query) return sortedFiles;
    return sortedFiles.filter((file) =>
      file.name.toLowerCase().includes(query),
    );
  }, [sortedFiles, searchQuery]);

  // Handlers
  const handleCreateDemo = () => {
    const demoState = createDemoState();
    setData(demoState);
    const demoRoot = Object.values(demoState.folders).find(
      (folder) => folder.parentId === null,
    );
    if (demoRoot) {
      setExpandedFolderIds(new Set([demoRoot.id]));
    }
    setViewMode(resolveViewMode(demoState.activeDataroomId));
    setSearchQuery("");
    setPreviewFileId(null);
    clearSelection();
    toast.success("Demo data room is ready.");
  };

  const selectDataroom = (id: string) => {
    const dataroom = data.datarooms[id];
    if (!dataroom) return;
    setData((prev) => ({
      ...prev,
      activeDataroomId: id,
      activeFolderId: dataroom.rootFolderId,
    }));
    setExpandedFolderIds(new Set([dataroom.rootFolderId]));
    setViewMode(resolveViewMode(id));
    setPreviewFileId(null);
    setSearchQuery("");
    clearSelection();
  };

  const handleSelectFolder = (folderId: string) => {
    setData((prev) => ({
      ...prev,
      activeFolderId: folderId,
    }));
    clearSelection();
  };

  const handleCreateDataroom = (name: string) => {
    const normalized = normalizeName(name);
    if (!normalized) {
      setDialog((prev) =>
        prev && "error" in prev ? { ...prev, error: "Name is required." } : prev,
      );
      return;
    }

    const used = new Set(
      Object.values(data.datarooms).map((room) => room.name.toLowerCase()),
    );
    const finalName = makeUniqueName(normalized, used);
    const dataroomId = createId();
    const rootFolderId = createId();
    const now = Date.now();

    setData((prev) => ({
      ...prev,
      datarooms: {
        ...prev.datarooms,
        [dataroomId]: {
          id: dataroomId,
          name: finalName,
          rootFolderId,
          createdAt: now,
        },
      },
      folders: {
        ...prev.folders,
        [rootFolderId]: {
          id: rootFolderId,
          name: "All documents",
          parentId: null,
          dataroomId,
          childFolderIds: [],
          fileIds: [],
          createdAt: now,
        },
      },
      activeDataroomId: dataroomId,
      activeFolderId: rootFolderId,
    }));

    setExpandedFolderIds(new Set([rootFolderId]));
    setViewMode(DEFAULT_VIEW_MODE);
    setViewModeStore(dataroomId, DEFAULT_VIEW_MODE);
    setDialog(null);
    clearSelection();
    toast.success(`Data room "${finalName}" created.`);
  };

  const handleRenameDataroom = (id: string, name: string) => {
    const normalized = normalizeName(name);
    if (!normalized) {
      setDialog((prev) =>
        prev && "error" in prev ? { ...prev, error: "Name is required." } : prev,
      );
      return;
    }

    const used = new Set(
      Object.values(data.datarooms)
        .filter((room) => room.id !== id)
        .map((room) => room.name.toLowerCase()),
    );

    if (used.has(normalized.toLowerCase())) {
      setDialog((prev) =>
        prev && "error" in prev
          ? { ...prev, error: "A data room with this name already exists." }
          : prev,
      );
      return;
    }

    setData((prev) => ({
      ...prev,
      datarooms: {
        ...prev.datarooms,
        [id]: { ...prev.datarooms[id], name: normalized },
      },
    }));
    setDialog(null);
    toast.success("Data room renamed.");
  };

  const handleDeleteDataroom = (id: string) => {
    const dataroomList = Object.values(data.datarooms).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    const remainingRooms = dataroomList.filter((room) => room.id !== id);
    const nextActiveRoom = remainingRooms[0] ?? null;
    const nextActiveId = nextActiveRoom?.id ?? null;
    const nextRootId = nextActiveRoom?.rootFolderId ?? null;

    setData((prev) => {
      const nextDatarooms = { ...prev.datarooms };
      const nextFolders = { ...prev.folders };
      const nextFiles = { ...prev.files };

      delete nextDatarooms[id];

      Object.values(prev.folders)
        .filter((folder) => folder.dataroomId === id)
        .forEach((folder) => {
          delete nextFolders[folder.id];
        });

      Object.values(prev.files)
        .filter((file) => file.dataroomId === id)
        .forEach((file) => {
          if (file.blobUrl) URL.revokeObjectURL(file.blobUrl);
          delete nextFiles[file.id];
        });

      return {
        datarooms: nextDatarooms,
        folders: nextFolders,
        files: nextFiles,
        activeDataroomId: nextActiveId,
        activeFolderId: nextRootId,
      };
    });

    setExpandedFolderIds(nextRootId ? new Set([nextRootId]) : new Set());
    setViewMode(resolveViewMode(nextActiveId));
    setPreviewFileId(null);
    setDialog(null);
    clearSelection();
    toast.info("Data room removed.");
  };

  const handleCreateFolder = (parentId: string, name: string) => {
    const normalized = normalizeName(name);
    if (!normalized) {
      setDialog((prev) =>
        prev && "error" in prev ? { ...prev, error: "Name is required." } : prev,
      );
      return;
    }

    setData((prev) => {
      const parent = prev.folders[parentId];
      if (!parent) return prev;
      const used = getSiblingNames(parentId, prev);
      const finalName = makeUniqueName(normalized, used);
      const folderId = createId();
      const now = Date.now();

      return {
        ...prev,
        folders: {
          ...prev.folders,
          [folderId]: {
            id: folderId,
            name: finalName,
            parentId,
            dataroomId: parent.dataroomId,
            childFolderIds: [],
            fileIds: [],
            createdAt: now,
          },
          [parentId]: {
            ...parent,
            childFolderIds: [...parent.childFolderIds, folderId],
          },
        },
      };
    });

    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      next.add(parentId);
      return next;
    });

    setDialog(null);
    toast.success("Folder created.");
  };

  const handleRenameFolder = (id: string, name: string) => {
    const normalized = normalizeName(name);
    if (!normalized) {
      setDialog((prev) =>
        prev && "error" in prev ? { ...prev, error: "Name is required." } : prev,
      );
      return;
    }

    const folder = data.folders[id];
    if (!folder) return;
    const used = getSiblingNames(folder.parentId ?? folder.id, data, id);

    if (used.has(normalized.toLowerCase())) {
      setDialog((prev) =>
        prev && "error" in prev
          ? { ...prev, error: "An item with this name already exists." }
          : prev,
      );
      return;
    }

    setData((prev) => ({
      ...prev,
      folders: {
        ...prev.folders,
        [id]: { ...prev.folders[id], name: normalized },
      },
    }));

    setDialog(null);
    toast.success("Folder renamed.");
  };

  const handleDeleteFolder = (id: string) => {
    const folder = data.folders[id];
    if (!folder) return;

    const isRoot =
      data.datarooms[folder.dataroomId]?.rootFolderId === folder.id;
    if (isRoot) {
      toast.error("Root folder cannot be deleted.");
      setDialog(null);
      return;
    }

    const folderIdsToRemove = collectFolderIds(id, data);

    setData((prev) => {
      const nextFolders = { ...prev.folders };
      const nextFiles = { ...prev.files };
      const stack = [id];
      const folderIdsToDelete = new Set<string>();
      const fileIdsToDelete = new Set<string>();

      while (stack.length > 0) {
        const currentId = stack.pop();
        if (!currentId) continue;
        const currentFolder = nextFolders[currentId];
        if (!currentFolder) continue;
        folderIdsToDelete.add(currentId);
        currentFolder.childFolderIds.forEach((childId) => stack.push(childId));
        currentFolder.fileIds.forEach((fileId) => fileIdsToDelete.add(fileId));
      }

      folderIdsToDelete.forEach((folderId) => {
        delete nextFolders[folderId];
      });

      fileIdsToDelete.forEach((fileId) => {
        const file = nextFiles[fileId];
        if (file?.blobUrl) URL.revokeObjectURL(file.blobUrl);
        delete nextFiles[fileId];
      });

      const parentFolder = nextFolders[folder.parentId ?? ""];
      if (parentFolder) {
        nextFolders[parentFolder.id] = {
          ...parentFolder,
          childFolderIds: parentFolder.childFolderIds.filter(
            (childId) => childId !== id,
          ),
        };
      }

      const nextActiveFolderId =
        prev.activeFolderId && folderIdsToDelete.has(prev.activeFolderId)
          ? parentFolder?.id ?? prev.activeFolderId
          : prev.activeFolderId;

      return {
        ...prev,
        folders: nextFolders,
        files: nextFiles,
        activeFolderId: nextActiveFolderId ?? prev.activeFolderId,
      };
    });

    setDialog(null);
    setPreviewFileId(null);
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      folderIdsToRemove.forEach((folderId) => next.delete(folderId));
      return next;
    });
    setSelection((prev) => {
      const nextFolders = new Set(prev.folders);
      const nextFiles = new Set(prev.files);
      const fileIdsToRemove = new Set<string>();

      folderIdsToRemove.forEach((folderId) => {
        nextFolders.delete(folderId);
        const folderItem = data.folders[folderId];
        if (folderItem) {
          folderItem.fileIds.forEach((fileId) => fileIdsToRemove.add(fileId));
        }
      });

      fileIdsToRemove.forEach((fileId) => nextFiles.delete(fileId));
      return { folders: nextFolders, files: nextFiles };
    });
    toast.info("Folder deleted.");
  };

  const handleUploadFiles = (files: FileList | File[], folderId: string) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(isPdfFile);
    const invalidCount = fileArray.length - validFiles.length;

    if (validFiles.length === 0) {
      toast.error("Only PDF files are accepted.");
      return;
    }

    let previewId: string | null = null;
    setData((prev) => {
      const parent = prev.folders[folderId];
      if (!parent) return prev;
      const usedNames = getSiblingNames(folderId, prev);
      const nextFiles = { ...prev.files };
      const nextFolder = { ...parent, fileIds: [...parent.fileIds] };

      validFiles.forEach((file) => {
        const fileId = createId();
        const uniqueName = makeUniqueFilename(file.name, usedNames);
        usedNames.add(uniqueName.toLowerCase());
        const blobUrl = URL.createObjectURL(file);
        const newFile: FileItem = {
          id: fileId,
          name: uniqueName,
          parentFolderId: folderId,
          dataroomId: parent.dataroomId,
          size: file.size,
          createdAt: Date.now(),
          blobUrl,
          source: "upload",
        };
        nextFiles[fileId] = newFile;
        nextFolder.fileIds.push(fileId);
        if (!previewId) previewId = fileId;
      });

      return {
        ...prev,
        files: nextFiles,
        folders: { ...prev.folders, [folderId]: nextFolder },
      };
    });

    if (previewId) {
      setPreviewFileId(previewId);
    }
    if (invalidCount > 0) {
      toast.info(
        `Uploaded ${validFiles.length} PDF(s). ${invalidCount} file(s) skipped.`,
      );
    } else {
      toast.success("Files uploaded successfully.");
    }
  };

  const handleRenameFile = (id: string, name: string) => {
    const normalized = normalizeName(name);
    if (!normalized) {
      setDialog((prev) =>
        prev && "error" in prev ? { ...prev, error: "Name is required." } : prev,
      );
      return;
    }

    const file = data.files[id];
    if (!file) return;
    const parentId = file.parentFolderId;
    const used = getSiblingNames(parentId, data, id);
    const finalName = normalized.toLowerCase().endsWith(".pdf")
      ? normalized
      : `${normalized}.pdf`;

    if (used.has(finalName.toLowerCase())) {
      setDialog((prev) =>
        prev && "error" in prev
          ? { ...prev, error: "An item with this name already exists." }
          : prev,
      );
      return;
    }

    setData((prev) => ({
      ...prev,
      files: {
        ...prev.files,
        [id]: { ...prev.files[id], name: finalName },
      },
    }));

    setDialog(null);
    toast.success("File renamed.");
  };

  const handleDeleteFile = (id: string) => {
    const file = data.files[id];
    if (!file) return;

    setData((prev) => {
      const nextFiles = { ...prev.files };
      const parent = prev.folders[file.parentFolderId];
      if (file.blobUrl) URL.revokeObjectURL(file.blobUrl);
      delete nextFiles[id];

      if (!parent) return { ...prev, files: nextFiles };
      const nextParent = {
        ...parent,
        fileIds: parent.fileIds.filter((fileId) => fileId !== id),
      };

      return {
        ...prev,
        files: nextFiles,
        folders: { ...prev.folders, [parent.id]: nextParent },
      };
    });

    if (previewFileId === id) {
      setPreviewFileId(null);
    }

    setDialog(null);
    setSelection((prev) => {
      const nextFolders = new Set(prev.folders);
      const nextFiles = new Set(prev.files);
      nextFiles.delete(id);
      return { folders: nextFolders, files: nextFiles };
    });
    toast.info("File deleted.");
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    if (!activeFolder) return;
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleUploadFiles(files, activeFolder.id);
    }
  };

  const clearSelection = () =>
    setSelection({ folders: new Set(), files: new Set() });

  const handleToggleFolderSelection = (id: string) => {
    setSelection((prev) => {
      const nextFolders = new Set(prev.folders);
      const nextFiles = new Set(prev.files);
      if (nextFolders.has(id)) {
        nextFolders.delete(id);
      } else {
        nextFolders.add(id);
      }
      return { folders: nextFolders, files: nextFiles };
    });
  };

  const handleToggleFileSelection = (id: string) => {
    setSelection((prev) => {
      const nextFolders = new Set(prev.folders);
      const nextFiles = new Set(prev.files);
      if (nextFiles.has(id)) {
        nextFiles.delete(id);
      } else {
        nextFiles.add(id);
      }
      return { folders: nextFolders, files: nextFiles };
    });
  };

  const handleSelectAllVisible = () => {
    setSelection({
      folders: new Set(filteredFolders.map((folder) => folder.id)),
      files: new Set(filteredFiles.map((file) => file.id)),
    });
  };

  const buildDragPayload = (
    type: "folder" | "file",
    id: string,
  ): DragPayload => {
    const folderIds = selection.folders;
    const fileIds = selection.files;
    const isSelected =
      type === "folder" ? folderIds.has(id) : fileIds.has(id);

    if (isSelected) {
      return {
        folderIds: Array.from(folderIds),
        fileIds: Array.from(fileIds),
      };
    }

    return {
      folderIds: type === "folder" ? [id] : [],
      fileIds: type === "file" ? [id] : [],
    };
  };

  const parseDragPayload = (
    event: React.DragEvent<HTMLElement>,
  ): DragPayload | null => {
    const raw = event.dataTransfer.getData("application/json");
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as DragPayload;
      if (!Array.isArray(parsed.folderIds) || !Array.isArray(parsed.fileIds)) {
        return null;
      }
      return {
        folderIds: parsed.folderIds.filter(Boolean),
        fileIds: parsed.fileIds.filter(Boolean),
      };
    } catch {
      return null;
    }
  };

  const handleDragStartItem = (
    event: React.DragEvent<HTMLDivElement>,
    type: "folder" | "file",
    id: string,
  ) => {
    const payload = buildDragPayload(type, id);
    event.dataTransfer.setData("application/json", JSON.stringify(payload));
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDragOverFolder = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const moveItemsToFolder = (
    targetFolderId: string,
    folderIds: string[],
    fileIds: string[],
  ) => {
    if (!targetFolderId) return;

    let movedFolders = 0;
    let movedFiles = 0;
    let skippedCount = 0;

    setData((prev) => {
      const targetFolder = prev.folders[targetFolderId];
      if (!targetFolder) return prev;

      const nextFolders = { ...prev.folders };
      const nextFiles = { ...prev.files };
      const usedNames = getSiblingNames(targetFolderId, prev);
      const movedFolderIds: string[] = [];
      const movedFileIds: string[] = [];

      folderIds.forEach((folderId) => {
        const folder = nextFolders[folderId];
        if (!folder) return;
        if (folder.parentId === targetFolderId) return;

        const descendants = collectFolderIds(folderId, prev);
        if (descendants.has(targetFolderId)) {
          skippedCount += 1;
          return;
        }

        const nextName = makeUniqueName(folder.name, usedNames);
        usedNames.add(nextName.toLowerCase());

        const parentFolder = folder.parentId
          ? nextFolders[folder.parentId]
          : null;
        if (parentFolder) {
          nextFolders[parentFolder.id] = {
            ...parentFolder,
            childFolderIds: parentFolder.childFolderIds.filter(
              (childId) => childId !== folderId,
            ),
          };
        }

        nextFolders[folderId] = {
          ...folder,
          name: nextName,
          parentId: targetFolderId,
        };
        movedFolderIds.push(folderId);
      });

      fileIds.forEach((fileId) => {
        const file = nextFiles[fileId];
        if (!file) return;
        if (file.parentFolderId === targetFolderId) return;

        const nextName = makeUniqueFilename(file.name, usedNames);
        usedNames.add(nextName.toLowerCase());

        const parentFolder = nextFolders[file.parentFolderId];
        if (parentFolder) {
          nextFolders[parentFolder.id] = {
            ...parentFolder,
            fileIds: parentFolder.fileIds.filter(
              (itemId) => itemId !== fileId,
            ),
          };
        }

        nextFiles[fileId] = {
          ...file,
          name: nextName,
          parentFolderId: targetFolderId,
        };
        movedFileIds.push(fileId);
      });

      if (movedFolderIds.length === 0 && movedFileIds.length === 0) {
        return prev;
      }

      const updatedTarget = {
        ...nextFolders[targetFolderId],
        childFolderIds: [
          ...nextFolders[targetFolderId].childFolderIds,
          ...movedFolderIds.filter(
            (id) => !nextFolders[targetFolderId].childFolderIds.includes(id),
          ),
        ],
        fileIds: [
          ...nextFolders[targetFolderId].fileIds,
          ...movedFileIds.filter(
            (id) => !nextFolders[targetFolderId].fileIds.includes(id),
          ),
        ],
      };

      nextFolders[targetFolderId] = updatedTarget;
      movedFolders = movedFolderIds.length;
      movedFiles = movedFileIds.length;

      return {
        ...prev,
        folders: nextFolders,
        files: nextFiles,
      };
    });

    if (movedFolders + movedFiles > 0) {
      setExpandedFolderIds((prev) => {
        const next = new Set(prev);
        next.add(targetFolderId);
        return next;
      });
      clearSelection();
      toast.success(`Moved ${movedFolders + movedFiles} item(s).`);
    } else {
      toast.info("Nothing to move.");
    }

    if (skippedCount > 0) {
      toast.info("Some items could not be moved.");
    }
  };

  const handleDropOnFolder = (
    event: React.DragEvent<HTMLElement>,
    folderId: string,
  ) => {
    event.preventDefault();
    const payload = parseDragPayload(event);
    if (!payload) return;
    moveItemsToFolder(folderId, payload.folderIds, payload.fileIds);
  };

  const handleBulkDelete = (folderIds: string[], fileIds: string[]) => {
    const rootId = activeDataroom?.rootFolderId ?? null;
    const sanitizedFolderIds = rootId
      ? folderIds.filter((id) => id !== rootId)
      : folderIds;

    if (rootId && folderIds.includes(rootId)) {
      toast.error("Root folder cannot be deleted.");
    }

    let deletedFolderIds = new Set<string>();
    let deletedFileIds = new Set<string>();

    setData((prev) => {
      const nextFolders = { ...prev.folders };
      const nextFiles = { ...prev.files };
      const foldersToDelete = new Set<string>();
      const filesToDelete = new Set<string>(fileIds);

      sanitizedFolderIds.forEach((folderId) => {
        if (!nextFolders[folderId]) return;
        collectFolderIds(folderId, prev).forEach((id) => {
          foldersToDelete.add(id);
        });
      });

      foldersToDelete.forEach((folderId) => {
        const folder = nextFolders[folderId];
        if (!folder) return;
        folder.fileIds.forEach((fileId) => filesToDelete.add(fileId));
      });

      filesToDelete.forEach((fileId) => {
        const file = nextFiles[fileId];
        if (file?.blobUrl) URL.revokeObjectURL(file.blobUrl);
        delete nextFiles[fileId];
      });

      foldersToDelete.forEach((folderId) => {
        delete nextFolders[folderId];
      });

      Object.values(nextFolders).forEach((folder) => {
        nextFolders[folder.id] = {
          ...folder,
          childFolderIds: folder.childFolderIds.filter(
            (id) => !foldersToDelete.has(id),
          ),
          fileIds: folder.fileIds.filter((id) => !filesToDelete.has(id)),
        };
      });

      deletedFolderIds = foldersToDelete;
      deletedFileIds = filesToDelete;

      const activeFolderId =
        prev.activeFolderId && !nextFolders[prev.activeFolderId]
          ? prev.activeDataroomId
            ? prev.datarooms[prev.activeDataroomId]?.rootFolderId ?? null
            : null
          : prev.activeFolderId;

      return {
        ...prev,
        folders: nextFolders,
        files: nextFiles,
        activeFolderId,
      };
    });

    if (deletedFolderIds.size + deletedFileIds.size > 0) {
      setExpandedFolderIds((prev) => {
        const next = new Set(prev);
        deletedFolderIds.forEach((id) => next.delete(id));
        return next;
      });
      if (previewFileId && deletedFileIds.has(previewFileId)) {
        setPreviewFileId(null);
      }
      clearSelection();
      toast.info("Selected items deleted.");
    }
  };

  const handleBulkMove = () => {
    const folderIds = Array.from(selection.folders);
    const fileIds = Array.from(selection.files);
    if (folderIds.length + fileIds.length === 0) return;
    setDialog({ type: "bulk-move", folderIds, fileIds });
  };

  const handleBulkDeleteConfirm = () => {
    const folderIds = Array.from(selection.folders);
    const fileIds = Array.from(selection.files);
    if (folderIds.length + fileIds.length === 0) return;
    setDialog({ type: "confirm-bulk-delete", folderIds, fileIds });
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (data.activeDataroomId) {
      setViewModeStore(data.activeDataroomId, mode);
    }
  };

  const buildFolderLabel = (folderId: string) => {
    const parts: string[] = [];
    let current = data.folders[folderId];
    while (current) {
      if (!current.parentId) {
        parts.unshift("Documents");
        break;
      }
      parts.unshift(current.name);
      current = data.folders[current.parentId];
    }
    return parts.join(" / ");
  };

  const getMoveOptions = (folderIds: string[]) => {
    if (!activeDataroom) return [] as Array<{ id: string; label: string }>;

    const invalidTargets = new Set<string>();
    folderIds.forEach((folderId) => {
      collectFolderIds(folderId, data).forEach((id) => invalidTargets.add(id));
    });

    return Object.values(data.folders)
      .filter((folder) => folder.dataroomId === activeDataroom.id)
      .filter((folder) => !invalidTargets.has(folder.id))
      .map((folder) => ({
        id: folder.id,
        label: buildFolderLabel(folder.id),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  };

  const dataroomList = Object.values(data.datarooms).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const moveOptions =
    dialog?.type === "bulk-move" ? getMoveOptions(dialog.folderIds) : [];
  const defaultMoveTargetId =
    moveOptions.find((option) => option.id === activeFolder?.id)?.id ??
    moveOptions[0]?.id ??
    activeDataroom?.rootFolderId ??
    "";

  return (
    <div className="min-h-screen text-ink">
      <div className="mx-auto flex max-w-10xl flex-col gap-8 px-6 py-10">
        {/* Header */}
        <Header
          onCreateDataroom={() => setDialog({ type: "create-dataroom" })}
          onLoadDemo={handleCreateDemo}
        />

        {/* Main Content */}
        <main className="flex flex-col gap-6">
          {dataroomList.length > 0 && (
            <DataroomPanel
              datarooms={dataroomList}
              activeDataroomId={data.activeDataroomId}
              appState={data}
              onSelect={selectDataroom}
              onRename={(id, name) =>
                setDialog({
                  type: "rename-dataroom",
                  id,
                  currentName: name,
                })
              }
              onDelete={(id) =>
                setDialog({
                  type: "confirm-delete-dataroom",
                  id,
                })
              }
              onCreate={() => setDialog({ type: "create-dataroom" })}
            />
          )}

          {activeDataroom && activeFolder ? (
            <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
              <FolderPanel
                dataroom={activeDataroom}
                folders={data.folders}
                activeFolderId={data.activeFolderId}
                expandedFolderIds={expandedFolderIds}
                onSelect={handleSelectFolder}
                onToggle={(folderId) => {
                  setExpandedFolderIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(folderId)) {
                      next.delete(folderId);
                    } else {
                      next.add(folderId);
                    }
                    return next;
                  });
                }}
                onRename={(folderId) =>
                  setDialog({
                    type: "rename-folder",
                    id: folderId,
                    currentName: data.folders[folderId]?.name ?? "",
                  })
                }
                onDelete={(folderId) =>
                  setDialog({
                    type: "confirm-delete-folder",
                    id: folderId,
                  })
                }
                onCreateFolder={() =>
                  setDialog({
                    type: "create-folder",
                    parentId: activeFolder.id,
                  })
                }
                onDropItems={handleDropOnFolder}
                onDragOverFolder={handleDragOverFolder}
                onDragStartFolder={(event, folderId) =>
                  handleDragStartItem(event, "folder", folderId)
                }
              />

              <DocumentsPanel
                dataroom={activeDataroom}
                activeFolder={activeFolder}
                filteredFolders={filteredFolders}
                filteredFiles={filteredFiles}
                searchQuery={searchQuery}
                previewFileId={previewFileId}
                dragActive={dragActive}
                folderPath={folderPath}
                viewMode={viewMode}
                onViewModeChange={handleViewModeChange}
                selectedFolderIds={selection.folders}
                selectedFileIds={selection.files}
                onSelectAllVisible={handleSelectAllVisible}
                onClearSelection={clearSelection}
                onToggleFolderSelection={handleToggleFolderSelection}
                onToggleFileSelection={handleToggleFileSelection}
                onBulkMove={handleBulkMove}
                onBulkDelete={handleBulkDeleteConfirm}
                onSearchChange={setSearchQuery}
                onCreateFolder={() =>
                  setDialog({
                    type: "create-folder",
                    parentId: activeFolder.id,
                  })
                }
                onUploadFiles={(files: FileList | File[]) =>
                  handleUploadFiles(files, activeFolder.id)
                }
                onSelectFolder={handleSelectFolder}
                onSelectFile={(fileId: string | null) => {
                  setPreviewFileId(fileId);
                  const file = fileId ? data.files[fileId] : null;
                  if (fileId && !file?.blobUrl) {
                    toast.info(
                      "Preview becomes available after the PDF is uploaded.",
                    );
                  }
                }}
                onRenameFolder={(folderId) =>
                  setDialog({
                    type: "rename-folder",
                    id: folderId,
                    currentName: data.folders[folderId]?.name ?? "",
                  })
                }
                onDeleteFolder={(folderId) =>
                  setDialog({
                    type: "confirm-delete-folder",
                    id: folderId,
                  })
                }
                onRenameFile={(fileId) =>
                  setDialog({
                    type: "rename-file",
                    id: fileId,
                    currentName: data.files[fileId]?.name ?? "",
                  })
                }
                onDeleteFile={(fileId) =>
                  setDialog({
                    type: "confirm-delete-file",
                    id: fileId,
                  })
                }
                onDragStartItem={handleDragStartItem}
                onDragOverFolder={handleDragOverFolder}
                onDropOnFolder={handleDropOnFolder}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
              />
            </div>
          ) : (
            <EmptyDataroom
              onCreateDataroom={() => setDialog({ type: "create-dataroom" })}
              onLoadDemo={handleCreateDemo}
            />
          )}
        </main>
      </div>

      <Toaster position="top-right" richColors />

      {/* Dialogs */}
      {dialog?.type === "create-dataroom" && (
        <NameDialog
          title="Create data room"
          description="Give your workspace a clear, client-ready name."
          label="Data room name"
          placeholder="Acme Series B"
          confirmLabel="Create"
          error={dialog.error}
          onConfirm={handleCreateDataroom}
          onCancel={() => setDialog(null)}
        />
      )}

      {previewFile && (
        <FilePreview file={previewFile} onClose={() => setPreviewFileId(null)} />
      )}

      {dialog?.type === "rename-dataroom" && (
        <NameDialog
          title="Rename data room"
          description="Update the workspace name and keep everyone aligned."
          label="Data room name"
          defaultValue={dialog.currentName}
          confirmLabel="Save"
          error={dialog.error}
          onConfirm={(value) => handleRenameDataroom(dialog.id, value)}
          onCancel={() => setDialog(null)}
        />
      )}

      {dialog?.type === "create-folder" && (
        <NameDialog
          title="Create folder"
          description="Add a new folder inside the current directory."
          label="Folder name"
          placeholder="Financial statements"
          confirmLabel="Create"
          error={dialog.error}
          onConfirm={(value) => handleCreateFolder(dialog.parentId, value)}
          onCancel={() => setDialog(null)}
        />
      )}

      {dialog?.type === "rename-folder" && (
        <NameDialog
          title="Rename folder"
          description="Keep folder names consistent for due diligence."
          label="Folder name"
          defaultValue={dialog.currentName}
          confirmLabel="Save"
          error={dialog.error}
          onConfirm={(value) => handleRenameFolder(dialog.id, value)}
          onCancel={() => setDialog(null)}
        />
      )}

      {dialog?.type === "rename-file" && (
        <NameDialog
          title="Rename file"
          description="PDF extension is enforced automatically."
          label="File name"
          defaultValue={dialog.currentName.replace(/\.pdf$/i, "")}
          confirmLabel="Save"
          error={dialog.error}
          onConfirm={(value) => handleRenameFile(dialog.id, value)}
          onCancel={() => setDialog(null)}
        />
      )}

      {dialog?.type === "confirm-delete-dataroom" && (
        <ConfirmDialog
          title="Delete data room?"
          description="This removes the data room and all nested folders and files."
          confirmLabel="Delete"
          onConfirm={() => handleDeleteDataroom(dialog.id)}
          onCancel={() => setDialog(null)}
        />
      )}

      {dialog?.type === "confirm-delete-folder" && (
        <ConfirmDialog
          title="Delete folder?"
          description={(() => {
            const stats = getDescendantStats(dialog.id, data);
            if (stats.folderCount === 0 && stats.fileCount === 0) {
              return "This folder is empty and will be removed.";
            }
            return `This removes ${stats.folderCount} nested folder(s) and ${stats.fileCount} file(s).`;
          })()}
          confirmLabel="Delete"
          onConfirm={() => handleDeleteFolder(dialog.id)}
          onCancel={() => setDialog(null)}
        />
      )}

      {dialog?.type === "confirm-delete-file" && (
        <ConfirmDialog
          title="Delete file?"
          description="This removes the PDF from the data room."
          confirmLabel="Delete"
          onConfirm={() => handleDeleteFile(dialog.id)}
          onCancel={() => setDialog(null)}
        />
      )}

      {dialog?.type === "confirm-bulk-delete" && (
        <ConfirmDialog
          title="Delete selected items?"
          description={`This removes ${dialog.folderIds.length + dialog.fileIds.length} item(s).`}
          confirmLabel="Delete"
          onConfirm={() => {
            handleBulkDelete(dialog.folderIds, dialog.fileIds);
            setDialog(null);
          }}
          onCancel={() => setDialog(null)}
        />
      )}

      {dialog?.type === "bulk-move" && activeDataroom && (
        <MoveItemsDialog
          title="Move items"
          description={`Moving ${dialog.folderIds.length + dialog.fileIds.length} item(s).`}
          options={moveOptions}
          defaultFolderId={defaultMoveTargetId}
          onConfirm={(folderId) => {
            moveItemsToFolder(folderId, dialog.folderIds, dialog.fileIds);
            setDialog(null);
          }}
          onCancel={() => setDialog(null)}
        />
      )}
    </div>
  );
}
