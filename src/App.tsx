import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import type {
  AppState,
  DialogState,
  FileItem,
  Folder,
  ViewMode,
} from "./types";
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
import { useUIStore } from "./store/uiStore";
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
  LoginDialog,
  SignUpDialog,
} from "./components";
import { useAuth } from "./features/auth/model/useAuth";
import { useFirestore } from "./features/data/model/useFirestore";
import {
  saveFileToIndexedDB,
  deleteFileFromIndexedDB,
  getAllUserFiles,
} from "./shared/lib/indexedDB";

type SelectionState = {
  folders: Set<string>;
  files: Set<string>;
};

type DragPayload = {
  folderIds: string[];
  fileIds: string[];
};

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const [authDialog, setAuthDialog] = useState<"login" | "signup" | null>(null);

  const isFirebaseConfigured =
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_API_KEY !== "";

  const firestore = useFirestore(user?.uid || null);
  const {
    data: firestoreData,
    loading: firestoreLoading,
    createDataroom: firestoreCreateDataroom,
    updateDataroom: firestoreUpdateDataroom,
    deleteDataroom: firestoreDeleteDataroom,
    createFolder: firestoreCreateFolder,
    updateFolder: firestoreUpdateFolder,
    deleteFolder: firestoreDeleteFolder,
    createFile: firestoreCreateFile,
    updateFile: firestoreUpdateFile,
    deleteFile: firestoreDeleteFile,
    setActiveDataroomId: firestoreSetActiveDataroomId,
    setActiveFolderId: firestoreSetActiveFolderId,
  } = firestore;

  const [data, setData] = useState<AppState>(createEmptyState);

  const {
    getExpandedFolders,
    addFolder,
    removeFolder: removeFolderFromStore,
    setExpandedFolders,
  } = useUIStore();

  const expandedFolderIds = data.activeDataroomId
    ? getExpandedFolders(data.activeDataroomId)
    : new Set<string>();

  useEffect(() => {
    if (user && firestoreData && !firestoreLoading) {
      const loadFilesFromIndexedDB = async () => {
        try {
          const indexedDBFiles = await getAllUserFiles(user.uid);
          const updatedFiles = { ...firestoreData.files };
          Object.keys(firestoreData.files).forEach((fileId) => {
            if (indexedDBFiles[fileId]) {
              updatedFiles[fileId] = {
                ...updatedFiles[fileId],
                blobUrl: indexedDBFiles[fileId],
              };
            }
          });
          setData((prev) => {
            // Preserve activeFolderId and activeDataroomId from local state
            // Only update if they don't exist in Firestore data or if Firestore has valid values
            const activeFolderId =
              prev.activeFolderId && firestoreData.folders[prev.activeFolderId]
                ? prev.activeFolderId
                : firestoreData.activeFolderId || prev.activeFolderId;
            const activeDataroomId =
              prev.activeDataroomId &&
              firestoreData.datarooms[prev.activeDataroomId]
                ? prev.activeDataroomId
                : firestoreData.activeDataroomId || prev.activeDataroomId;

            return {
              ...firestoreData,
              files: updatedFiles,
              activeFolderId,
              activeDataroomId,
            };
          });
        } catch (error) {
          console.error("Error loading files from IndexedDB:", error);
          setData((prev) => {
            // Preserve activeFolderId and activeDataroomId when error occurs
            const activeFolderId =
              prev.activeFolderId && firestoreData.folders[prev.activeFolderId]
                ? prev.activeFolderId
                : firestoreData.activeFolderId || prev.activeFolderId;
            const activeDataroomId =
              prev.activeDataroomId &&
              firestoreData.datarooms[prev.activeDataroomId]
                ? prev.activeDataroomId
                : firestoreData.activeDataroomId || prev.activeDataroomId;

            return {
              ...firestoreData,
              activeFolderId,
              activeDataroomId,
            };
          });
        }
      };
      loadFilesFromIndexedDB();
    } else if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData(createEmptyState);
    }
  }, [user, firestoreData, firestoreLoading]);
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

  const clearSelection = () =>
    setSelection({ folders: new Set(), files: new Set() });

  const handleCreateDemo = () => {
    const demoState = createDemoState();
    setData(demoState);
    const demoRoot = Object.values(demoState.folders).find(
      (folder) => folder.parentId === null,
    );
    if (demoRoot && demoState.activeDataroomId) {
      setExpandedFolders(demoState.activeDataroomId, [demoRoot.id]);
    }
    setViewMode(resolveViewMode(demoState.activeDataroomId));
    setSearchQuery("");
    setPreviewFileId(null);
    clearSelection();
    toast.success("Demo data room is ready.");
  };

  const selectDataroom = async (id: string) => {
    const dataroom = data.datarooms[id];
    if (!dataroom) return;

    if (user) {
      try {
        await firestoreSetActiveDataroomId(id);
        await firestoreSetActiveFolderId(dataroom.rootFolderId);

        setData((prev) => ({
          ...prev,
          activeDataroomId: id,
          activeFolderId: dataroom.rootFolderId,
        }));
      } catch (error) {
        toast.error("Failed to switch data room");
        console.error(error);
        return;
      }
    } else {
      setData((prev) => ({
        ...prev,
        activeDataroomId: id,
        activeFolderId: dataroom.rootFolderId,
      }));
    }

    if (id) {
      setExpandedFolders(id, [dataroom.rootFolderId]);
    }
    setViewMode(resolveViewMode(id));
    setPreviewFileId(null);
    setSearchQuery("");
    clearSelection();
  };

  const handleSelectFolder = async (folderId: string) => {
    const folder = data.folders[folderId];

    if (folder && data.activeDataroomId) {
      let current: Folder | undefined = folder;
      while (current && current.parentId) {
        addFolder(data.activeDataroomId, current.parentId);
        current = data.folders[current.parentId];
      }
    }

    if (user) {
      try {
        await firestoreSetActiveFolderId(folderId);

        setData((prev) => ({
          ...prev,
          activeFolderId: folderId,
        }));
      } catch (error) {
        toast.error("Failed to select folder");
        console.error(error);
        return;
      }
    } else {
      setData((prev) => ({
        ...prev,
        activeFolderId: folderId,
      }));
    }

    clearSelection();
  };

  const handleCreateDataroom = useCallback(
    async (name: string) => {
      const normalized = normalizeName(name);
      if (!normalized) {
        setDialog((prev) =>
          prev && "error" in prev
            ? { ...prev, error: "Name is required." }
            : prev,
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
      const newDataroom = {
        id: dataroomId,
        name: finalName,
        rootFolderId,
        createdAt: now,
      };

      const newRootFolder = {
        id: rootFolderId,
        name: "All documents",
        parentId: null,
        dataroomId,
        childFolderIds: [],
        fileIds: [],
        createdAt: now,
      };

      if (user) {
        try {
          await firestoreCreateDataroom(newDataroom);
          await firestoreCreateFolder(newRootFolder);
          await firestoreSetActiveDataroomId(dataroomId);
          await firestoreSetActiveFolderId(rootFolderId);

          setData((prev) => ({
            ...prev,
            datarooms: {
              ...prev.datarooms,
              [dataroomId]: newDataroom,
            },
            folders: {
              ...prev.folders,
              [rootFolderId]: newRootFolder,
            },
            activeDataroomId: dataroomId,
            activeFolderId: rootFolderId,
          }));
        } catch (error) {
          toast.error("Failed to create data room");
          console.error(error);
          return;
        }
      } else {
        setData((prev) => ({
          ...prev,
          datarooms: {
            ...prev.datarooms,
            [dataroomId]: newDataroom,
          },
          folders: {
            ...prev.folders,
            [rootFolderId]: newRootFolder,
          },
          activeDataroomId: dataroomId,
          activeFolderId: rootFolderId,
        }));
      }

      setExpandedFolders(dataroomId, [rootFolderId]);
      setViewMode(DEFAULT_VIEW_MODE);
      setViewModeStore(dataroomId, DEFAULT_VIEW_MODE);
      setDialog(null);
      clearSelection();
      toast.success(`Data room "${finalName}" created.`);
    },
    [
      data.datarooms,
      user,
      firestoreCreateDataroom,
      firestoreCreateFolder,
      firestoreSetActiveDataroomId,
      firestoreSetActiveFolderId,
      setViewModeStore,
      setExpandedFolders,
    ],
  );

  const handleRenameDataroom = async (id: string, name: string) => {
    const normalized = normalizeName(name);
    if (!normalized) {
      setDialog((prev) =>
        prev && "error" in prev
          ? { ...prev, error: "Name is required." }
          : prev,
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

    if (user) {
      try {
        await firestoreUpdateDataroom(id, { name: normalized });
      } catch (error) {
        toast.error("Failed to rename data room");
        console.error(error);
        return;
      }
    } else {
      setData((prev) => ({
        ...prev,
        datarooms: {
          ...prev.datarooms,
          [id]: { ...prev.datarooms[id], name: normalized },
        },
      }));
    }
    setDialog(null);
    toast.success("Data room renamed.");
  };

  const handleDeleteDataroom = async (id: string) => {
    const dataroomList = Object.values(data.datarooms).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    const remainingRooms = dataroomList.filter((room) => room.id !== id);
    const nextActiveRoom = remainingRooms[0] ?? null;
    const nextActiveId = nextActiveRoom?.id ?? null;
    const nextRootId = nextActiveRoom?.rootFolderId ?? null;

    if (user) {
      try {
        const foldersToDelete = Object.values(data.folders).filter(
          (folder) => folder.dataroomId === id,
        );
        const filesToDelete = Object.values(data.files).filter(
          (file) => file.dataroomId === id,
        );

        await firestoreDeleteDataroom(id);
        await Promise.all(
          foldersToDelete.map((folder) => firestoreDeleteFolder(folder.id)),
        );
        await Promise.all(
          filesToDelete.map((file) => firestoreDeleteFile(file.id)),
        );

        if (nextActiveId) {
          await firestoreSetActiveDataroomId(nextActiveId);
          await firestoreSetActiveFolderId(nextRootId);
        } else {
          await firestoreSetActiveDataroomId(null);
          await firestoreSetActiveFolderId(null);
        }
      } catch (error) {
        toast.error("Failed to delete data room");
        console.error(error);
        return;
      }
    } else {
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
    }

    if (nextActiveId && nextRootId) {
      setExpandedFolders(nextActiveId, [nextRootId]);
    } else if (nextActiveId) {
      setExpandedFolders(nextActiveId, []);
    }
    setViewMode(resolveViewMode(nextActiveId));
    setPreviewFileId(null);
    setDialog(null);
    clearSelection();
    toast.info("Data room removed.");
  };

  const handleCreateFolder = async (parentId: string, name: string) => {
    const normalized = normalizeName(name);
    if (!normalized) {
      setDialog((prev) =>
        prev && "error" in prev
          ? { ...prev, error: "Name is required." }
          : prev,
      );
      return;
    }

    if (!parentId) {
      toast.error("No parent folder selected");
      setDialog(null);
      return;
    }

    const parent = data.folders[parentId];
    if (!parent) {
      toast.error("Parent folder not found");
      setDialog(null);
      return;
    }

    const used = getSiblingNames(parentId, data);
    const finalName = makeUniqueName(normalized, used);
    const folderId = createId();
    const now = Date.now();

    const newFolder = {
      id: folderId,
      name: finalName,
      parentId,
      dataroomId: parent.dataroomId,
      childFolderIds: [],
      fileIds: [],
      createdAt: now,
    };

    if (user) {
      try {
        await firestoreCreateFolder(newFolder);
        await firestoreUpdateFolder(parentId, {
          childFolderIds: [...parent.childFolderIds, folderId],
        });
      } catch (error) {
        toast.error("Failed to create folder");
        console.error(error);
        return;
      }
    } else {
      setData((prev) => ({
        ...prev,
        folders: {
          ...prev.folders,
          [folderId]: newFolder,
          [parentId]: {
            ...parent,
            childFolderIds: [...parent.childFolderIds, folderId],
          },
        },
      }));
    }

    if (data.activeDataroomId) {
      addFolder(data.activeDataroomId, parentId);
    }

    setDialog(null);
    toast.success("Folder created.");
  };

  const handleRenameFolder = async (id: string, name: string) => {
    const normalized = normalizeName(name);
    if (!normalized) {
      setDialog((prev) =>
        prev && "error" in prev
          ? { ...prev, error: "Name is required." }
          : prev,
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

    if (user) {
      try {
        await firestoreUpdateFolder(id, { name: normalized });
      } catch (error) {
        toast.error("Failed to rename folder");
        console.error(error);
        return;
      }
    } else {
      setData((prev) => ({
        ...prev,
        folders: {
          ...prev.folders,
          [id]: { ...prev.folders[id], name: normalized },
        },
      }));
    }

    setDialog(null);
    toast.success("Folder renamed.");
  };

  const handleDeleteFolder = async (id: string) => {
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

    const stack = [id];
    const folderIdsToDelete = new Set<string>();
    const fileIdsToDelete = new Set<string>();

    while (stack.length > 0) {
      const currentId = stack.pop();
      if (!currentId) continue;
      const currentFolder = data.folders[currentId];
      if (!currentFolder) continue;
      folderIdsToDelete.add(currentId);
      currentFolder.childFolderIds.forEach((childId) => stack.push(childId));
      currentFolder.fileIds.forEach((fileId) => fileIdsToDelete.add(fileId));
    }

    if (user) {
      try {
        // Delete files from IndexedDB first
        await Promise.all(
          Array.from(fileIdsToDelete).map(async (fileId) => {
            const file = data.files[fileId];
            if (file?.blobUrl) {
              try {
                await deleteFileFromIndexedDB(user.uid, fileId);
                URL.revokeObjectURL(file.blobUrl);
              } catch (storageError) {
                console.warn(
                  `Failed to delete file ${fileId} from IndexedDB:`,
                  storageError,
                );
              }
            }
          }),
        );

        // Delete folders from Firestore
        await Promise.all(
          Array.from(folderIdsToDelete).map((folderId) =>
            firestoreDeleteFolder(folderId),
          ),
        );

        // Delete files from Firestore
        await Promise.all(
          Array.from(fileIdsToDelete).map((fileId) =>
            firestoreDeleteFile(fileId),
          ),
        );

        const parentFolder = data.folders[folder.parentId ?? ""];
        if (parentFolder) {
          await firestoreUpdateFolder(parentFolder.id, {
            childFolderIds: parentFolder.childFolderIds.filter(
              (childId) => childId !== id,
            ),
          });
        }

        const nextActiveFolderId =
          data.activeFolderId && folderIdsToDelete.has(data.activeFolderId)
            ? (parentFolder?.id ?? data.activeFolderId)
            : data.activeFolderId;

        if (nextActiveFolderId !== data.activeFolderId) {
          await firestoreSetActiveFolderId(nextActiveFolderId);
        }
      } catch (error) {
        toast.error("Failed to delete folder");
        console.error(error);
        return;
      }
    } else {
      setData((prev) => {
        const nextFolders = { ...prev.folders };
        const nextFiles = { ...prev.files };

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
            ? (parentFolder?.id ?? prev.activeFolderId)
            : prev.activeFolderId;

        return {
          ...prev,
          folders: nextFolders,
          files: nextFiles,
          activeFolderId: nextActiveFolderId ?? prev.activeFolderId,
        };
      });
    }

    setDialog(null);
    setPreviewFileId(null);
    if (data.activeDataroomId) {
      const current = getExpandedFolders(data.activeDataroomId);
      const dataroomId = data.activeDataroomId;
      folderIdsToRemove.forEach((id) => {
        if (current.has(id)) {
          removeFolderFromStore(dataroomId, id);
        }
      });
    }
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

  const handleUploadFiles = async (
    files: FileList | File[],
    folderId: string,
  ) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(isPdfFile);
    const invalidCount = fileArray.length - validFiles.length;

    if (validFiles.length === 0) {
      toast.error("Only PDF files are accepted.");
      return;
    }

    toast.info(
      "Files are stored locally in your browser. They will not be synced to Firebase Storage.",
      { duration: 5000 },
    );

    const parent = data.folders[folderId];
    if (!parent) return;

    const usedNames = getSiblingNames(folderId, data);
    const newFiles: FileItem[] = [];
    let previewId: string | null = null;
    const now = Date.now();

    if (user) {
      try {
        const uploadPromises = validFiles.map(async (file) => {
          const fileId = createId();
          const uniqueName = makeUniqueFilename(file.name, usedNames);
          usedNames.add(uniqueName.toLowerCase());

          const blobUrl = await saveFileToIndexedDB(user.uid, fileId, file);

          const newFile: FileItem = {
            id: fileId,
            name: uniqueName,
            parentFolderId: folderId,
            dataroomId: parent.dataroomId,
            size: file.size,
            createdAt: now,
            blobUrl,
            source: "upload",
          };

          await firestoreCreateFile(newFile);
          return newFile;
        });

        const uploadedFiles = await Promise.all(uploadPromises);
        newFiles.push(...uploadedFiles);
        if (uploadedFiles.length > 0) previewId = uploadedFiles[0].id;

        const updatedFileIds = [
          ...(parent.fileIds || []),
          ...uploadedFiles.map((f) => f.id),
        ];
        await firestoreUpdateFolder(folderId, {
          fileIds: updatedFileIds,
        });

        setData((prev) => {
          const nextFiles = { ...prev.files };
          const currentParent = prev.folders[folderId] || parent;
          const nextFolder = { ...currentParent, fileIds: updatedFileIds };

          uploadedFiles.forEach((file) => {
            nextFiles[file.id] = file;
          });

          return {
            ...prev,
            files: nextFiles,
            folders: { ...prev.folders, [folderId]: nextFolder },
          };
        });
      } catch (error) {
        toast.error("Failed to upload files");
        console.error(error);
        return;
      }
    } else {
      setData((prev) => {
        const nextFiles = { ...prev.files };
        const currentParent = prev.folders[folderId] || parent;
        const nextFolder = {
          ...currentParent,
          fileIds: [...(currentParent.fileIds || [])],
        };

        newFiles.forEach((file) => {
          nextFiles[file.id] = file;
          nextFolder.fileIds.push(file.id);
        });

        return {
          ...prev,
          files: nextFiles,
          folders: { ...prev.folders, [folderId]: nextFolder },
        };
      });
    }

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

  const handleRenameFile = async (id: string, name: string) => {
    const normalized = normalizeName(name);
    if (!normalized) {
      setDialog((prev) =>
        prev && "error" in prev
          ? { ...prev, error: "Name is required." }
          : prev,
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

    if (user) {
      try {
        await firestoreUpdateFile(id, { name: finalName });
      } catch (error) {
        toast.error("Failed to rename file");
        console.error(error);
        return;
      }
    } else {
      setData((prev) => ({
        ...prev,
        files: {
          ...prev.files,
          [id]: { ...prev.files[id], name: finalName },
        },
      }));
    }

    setDialog(null);
    toast.success("File renamed.");
  };

  const handleDeleteFile = async (id: string) => {
    const file = data.files[id];
    if (!file) return;

    const parent = data.folders[file.parentFolderId];

    if (user) {
      try {
        if (file.blobUrl) {
          try {
            await deleteFileFromIndexedDB(user.uid, id);
            URL.revokeObjectURL(file.blobUrl);
          } catch (storageError) {
            console.warn("Failed to delete file from IndexedDB:", storageError);
          }
        }
        await firestoreDeleteFile(id);
        if (parent) {
          await firestoreUpdateFolder(parent.id, {
            fileIds: parent.fileIds.filter((fileId) => fileId !== id),
          });
        }
      } catch (error) {
        toast.error("Failed to delete file");
        console.error(error);
        return;
      }
    } else {
      setData((prev) => {
        const nextFiles = { ...prev.files };
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
    }

    if (file.blobUrl) URL.revokeObjectURL(file.blobUrl);

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
    const isSelected = type === "folder" ? folderIds.has(id) : fileIds.has(id);

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

  const moveItemsToFolder = async (
    targetFolderId: string,
    folderIds: string[],
    fileIds: string[],
  ) => {
    if (!targetFolderId) return;

    const targetFolder = data.folders[targetFolderId];
    if (!targetFolder) return;

    const usedNames = getSiblingNames(targetFolderId, data);
    const movedFolderIds: string[] = [];
    const movedFileIds: string[] = [];
    let skippedCount = 0;

    const folderUpdates: Array<{ id: string; updates: Partial<Folder> }> = [];
    const fileUpdates: Array<{ id: string; updates: Partial<FileItem> }> = [];
    const parentFolderUpdates: Map<string, Partial<Folder>> = new Map();

    folderIds.forEach((folderId) => {
      const folder = data.folders[folderId];
      if (!folder) return;
      if (folder.parentId === targetFolderId) return;

      const descendants = collectFolderIds(folderId, data);
      if (descendants.has(targetFolderId)) {
        skippedCount += 1;
        return;
      }

      const nextName = makeUniqueName(folder.name, usedNames);
      usedNames.add(nextName.toLowerCase());

      const parentFolder = folder.parentId
        ? data.folders[folder.parentId]
        : null;
      if (parentFolder) {
        const existing = parentFolderUpdates.get(parentFolder.id);
        const currentUpdates: Partial<Folder> = existing || {
          childFolderIds: [...parentFolder.childFolderIds],
          fileIds: [...parentFolder.fileIds],
        };
        currentUpdates.childFolderIds = (
          currentUpdates.childFolderIds || [...parentFolder.childFolderIds]
        ).filter((childId) => childId !== folderId);
        parentFolderUpdates.set(parentFolder.id, currentUpdates);
      }

      folderUpdates.push({
        id: folderId,
        updates: { name: nextName, parentId: targetFolderId },
      });
      movedFolderIds.push(folderId);
    });

    fileIds.forEach((fileId) => {
      const file = data.files[fileId];
      if (!file) return;
      if (file.parentFolderId === targetFolderId) return;

      const nextName = makeUniqueFilename(file.name, usedNames);
      usedNames.add(nextName.toLowerCase());

      const parentFolder = data.folders[file.parentFolderId];
      if (parentFolder) {
        const existing = parentFolderUpdates.get(parentFolder.id);
        const currentUpdates: Partial<Folder> = existing || {
          childFolderIds: [...parentFolder.childFolderIds],
          fileIds: [...parentFolder.fileIds],
        };
        currentUpdates.fileIds = (
          currentUpdates.fileIds || [...parentFolder.fileIds]
        ).filter((itemId) => itemId !== fileId);
        parentFolderUpdates.set(parentFolder.id, currentUpdates);
      }

      fileUpdates.push({
        id: fileId,
        updates: { name: nextName, parentFolderId: targetFolderId },
      });
      movedFileIds.push(fileId);
    });

    if (movedFolderIds.length === 0 && movedFileIds.length === 0) {
      toast.info("Nothing to move.");
      return;
    }

    if (user) {
      try {
        await Promise.all(
          folderUpdates.map(({ id, updates }) =>
            firestoreUpdateFolder(id, updates),
          ),
        );
        await Promise.all(
          fileUpdates.map(({ id, updates }) =>
            firestoreUpdateFile(id, updates),
          ),
        );
        await Promise.all(
          Array.from(parentFolderUpdates.entries()).map(([id, updates]) =>
            firestoreUpdateFolder(id, updates),
          ),
        );

        const updatedTarget = {
          childFolderIds: [
            ...targetFolder.childFolderIds,
            ...movedFolderIds.filter(
              (id) => !targetFolder.childFolderIds.includes(id),
            ),
          ],
          fileIds: [
            ...targetFolder.fileIds,
            ...movedFileIds.filter((id) => !targetFolder.fileIds.includes(id)),
          ],
        };
        await firestoreUpdateFolder(targetFolderId, updatedTarget);
      } catch (error) {
        toast.error("Failed to move items");
        console.error(error);
        return;
      }
    } else {
      setData((prev) => {
        const nextFolders = { ...prev.folders };
        const nextFiles = { ...prev.files };

        folderUpdates.forEach(({ id, updates }) => {
          nextFolders[id] = { ...nextFolders[id], ...updates };
        });

        fileUpdates.forEach(({ id, updates }) => {
          nextFiles[id] = { ...nextFiles[id], ...updates };
        });

        parentFolderUpdates.forEach((updates, id) => {
          nextFolders[id] = { ...nextFolders[id], ...updates };
        });

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

        return {
          ...prev,
          folders: nextFolders,
          files: nextFiles,
        };
      });
    }

    const movedFolders = movedFolderIds.length;
    const movedFiles = movedFileIds.length;

    if (movedFolders + movedFiles > 0) {
      if (data.activeDataroomId) {
        addFolder(data.activeDataroomId, targetFolderId);
      }
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

  const handleBulkDelete = async (folderIds: string[], fileIds: string[]) => {
    const rootId = activeDataroom?.rootFolderId ?? null;
    const sanitizedFolderIds = rootId
      ? folderIds.filter((id) => id !== rootId)
      : folderIds;

    if (rootId && folderIds.includes(rootId)) {
      toast.error("Root folder cannot be deleted.");
    }

    let deletedFolderIds = new Set<string>();
    let deletedFileIds = new Set<string>();

    // Collect all folders and files to delete
    const foldersToDelete = new Set<string>();
    const filesToDelete = new Set<string>(fileIds);

    sanitizedFolderIds.forEach((folderId) => {
      if (!data.folders[folderId]) return;
      collectFolderIds(folderId, data).forEach((id) => {
        foldersToDelete.add(id);
      });
    });

    foldersToDelete.forEach((folderId) => {
      const folder = data.folders[folderId];
      if (!folder) return;
      folder.fileIds.forEach((fileId) => filesToDelete.add(fileId));
    });

    if (user) {
      try {
        // Delete files from IndexedDB first
        await Promise.all(
          Array.from(filesToDelete).map(async (fileId) => {
            const file = data.files[fileId];
            if (file?.blobUrl) {
              try {
                await deleteFileFromIndexedDB(user.uid, fileId);
                URL.revokeObjectURL(file.blobUrl);
              } catch (storageError) {
                console.warn(
                  `Failed to delete file ${fileId} from IndexedDB:`,
                  storageError,
                );
              }
            }
          }),
        );

        // Delete folders from Firestore
        await Promise.all(
          Array.from(foldersToDelete).map((folderId) =>
            firestoreDeleteFolder(folderId),
          ),
        );

        // Delete files from Firestore
        await Promise.all(
          Array.from(filesToDelete).map((fileId) =>
            firestoreDeleteFile(fileId),
          ),
        );
      } catch (error) {
        toast.error("Failed to delete items");
        console.error(error);
        return;
      }
    }

    setData((prev) => {
      const nextFolders = { ...prev.folders };
      const nextFiles = { ...prev.files };

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
            ? (prev.datarooms[prev.activeDataroomId]?.rootFolderId ?? null)
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
      if (data.activeDataroomId) {
        const current = getExpandedFolders(data.activeDataroomId);
        const dataroomId = data.activeDataroomId;
        deletedFolderIds.forEach((id) => {
          if (current.has(id)) {
            removeFolderFromStore(dataroomId, id);
          }
        });
      }
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

  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink px-6">
        <div className="text-center max-w-2xl">
          <h1 className="font-display text-2xl mb-4">
            Firebase Configuration Required
          </h1>
          <p className="text-muted mb-4">
            Please set up Firebase Authentication to use this application.
          </p>
          <div className="bg-white/70 rounded-lg border border-border p-6 text-left">
            <p className="text-sm font-medium mb-2">Quick Setup:</p>
            <ol className="text-sm text-muted space-y-2 list-decimal list-inside">
              <li>
                Create a Firebase project at{" "}
                <a
                  href="https://console.firebase.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  Firebase Console
                </a>
              </li>
              <li>Add a web app to your Firebase project</li>
              <li>
                Enable Authentication → Email/Password (and optionally Google)
              </li>
              <li>
                Copy <code className="bg-white px-1 rounded">.env.example</code>{" "}
                to <code className="bg-white px-1 rounded">.env.local</code>
              </li>
              <li>
                Fill in your Firebase config values in{" "}
                <code className="bg-white px-1 rounded">.env.local</code>
              </li>
              <li>Restart the dev server</li>
            </ol>
            <p className="text-xs text-muted mt-4">
              See{" "}
              <code className="bg-white px-1 rounded">FIREBASE_SETUP.md</code>{" "}
              for detailed instructions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink">
        <div className="text-center">
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-ink">
      <div className="mx-auto flex max-w-10xl flex-col gap-8 px-6 py-10">
        <Header
          onCreateDataroom={() => setDialog({ type: "create-dataroom" })}
          onLoadDemo={handleCreateDemo}
        />

        {user && (
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

            {activeDataroom &&
            activeFolder &&
            Object.keys(data.datarooms).length > 0 ? (
              <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
                <FolderPanel
                  dataroom={activeDataroom}
                  folders={data.folders}
                  activeFolderId={data.activeFolderId}
                  expandedFolderIds={expandedFolderIds}
                  onSelect={handleSelectFolder}
                  onToggle={(folderId) => {
                    if (data.activeDataroomId) {
                      const current = getExpandedFolders(data.activeDataroomId);
                      if (current.has(folderId)) {
                        removeFolderFromStore(data.activeDataroomId, folderId);
                      } else {
                        addFolder(data.activeDataroomId, folderId);
                      }
                    }
                  }}
                  onCreateFolder={() => {
                    const parentId =
                      activeFolder?.id || activeDataroom?.rootFolderId;
                    if (!parentId) {
                      toast.error("Please select a folder first");
                      return;
                    }
                    setDialog({
                      type: "create-folder",
                      parentId,
                    });
                  }}
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
                  onCreateFolder={() => {
                    const parentId =
                      activeFolder?.id || activeDataroom?.rootFolderId;
                    if (!parentId) {
                      toast.error("Please select a folder first");
                      return;
                    }
                    setDialog({
                      type: "create-folder",
                      parentId,
                    });
                  }}
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
        )}
      </div>

      <Toaster position="top-right" richColors />

      {!user && authDialog === "login" && (
        <LoginDialog
          onClose={() => setAuthDialog(null)}
          onSwitchToSignUp={() => setAuthDialog("signup")}
        />
      )}

      {!user && authDialog === "signup" && (
        <SignUpDialog
          onClose={() => setAuthDialog(null)}
          onSwitchToLogin={() => setAuthDialog("login")}
        />
      )}

      {!user && !authDialog && (
        <LoginDialog
          onClose={() => {}}
          onSwitchToSignUp={() => setAuthDialog("signup")}
        />
      )}

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
        <FilePreview
          file={previewFile}
          onClose={() => setPreviewFileId(null)}
        />
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
