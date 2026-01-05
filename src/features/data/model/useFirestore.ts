import { useEffect, useState, useCallback } from "react";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  type DocumentData,
  type QuerySnapshot,
  type FirestoreError,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { AppState, Dataroom, Folder, FileItem } from "../../../types";

export function useFirestore(userId: string | null) {
  const [data, setData] = useState<AppState>({
    datarooms: {},
    folders: {},
    files: {},
    activeDataroomId: null,
    activeFolderId: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !userId) {
      if (loading) {
        setLoading(false);
      }
      return;
    }

    const dataroomsRef = collection(db, `users/${userId}/datarooms`);
    const foldersRef = collection(db, `users/${userId}/folders`);
    const filesRef = collection(db, `users/${userId}/files`);

    const unsubscribeDatarooms = onSnapshot(
      dataroomsRef,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const datarooms: Record<string, Dataroom> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Dataroom;
          datarooms[docSnap.id] = data;
        });
        setData((prev: AppState) => {
          const newState = { ...prev, datarooms };
          if (!newState.activeDataroomId && Object.keys(datarooms).length > 0) {
            const firstDataroomId = Object.keys(datarooms)[0];
            const firstDataroom = datarooms[firstDataroomId];
            newState.activeDataroomId = firstDataroomId;
            newState.activeFolderId = firstDataroom.rootFolderId;
          }
          return newState;
        });
      },
      (err: FirestoreError) => {
        console.error("Error listening to datarooms:", err);
        setError(err.message);
      },
    );

    const unsubscribeFolders = onSnapshot(
      foldersRef,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const folders: Record<string, Folder> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Folder;
          folders[docSnap.id] = data;
        });
        setData((prev: AppState) => ({ ...prev, folders }));
      },
      (err: FirestoreError) => {
        console.error("Error listening to folders:", err);
        setError(err.message);
      },
    );

    const unsubscribeFiles = onSnapshot(
      filesRef,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const files: Record<string, FileItem> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as FileItem;
          files[docSnap.id] = data;
        });
        setData((prev: AppState) => ({ ...prev, files }));
        setLoading(false);
      },
      (err: FirestoreError) => {
        console.error("Error listening to files:", err);
        setError(err.message);
        setLoading(false);
      },
    );

    return () => {
      unsubscribeDatarooms();
      unsubscribeFolders();
      unsubscribeFiles();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const createDataroom = useCallback(
    async (dataroom: Dataroom) => {
      if (!db || !userId) return;
      try {
        await setDoc(
          doc(db, `users/${userId}/datarooms`, dataroom.id),
          dataroom,
        );
      } catch (err) {
        console.error("Error creating dataroom:", err);
        throw err;
      }
    },
    [userId],
  );

  const updateDataroom = useCallback(
    async (id: string, updates: Partial<Dataroom>) => {
      if (!db || !userId) return;
      try {
        await updateDoc(doc(db, `users/${userId}/datarooms`, id), updates);
      } catch (err) {
        console.error("Error updating dataroom:", err);
        throw err;
      }
    },
    [userId],
  );

  const deleteDataroom = useCallback(
    async (id: string) => {
      if (!db || !userId) return;
      try {
        await deleteDoc(doc(db, `users/${userId}/datarooms`, id));
      } catch (err) {
        console.error("Error deleting dataroom:", err);
        throw err;
      }
    },
    [userId],
  );

  const createFolder = useCallback(
    async (folder: Folder) => {
      if (!db || !userId) return;
      try {
        await setDoc(doc(db, `users/${userId}/folders`, folder.id), folder);
      } catch (err) {
        console.error("Error creating folder:", err);
        throw err;
      }
    },
    [userId],
  );

  const updateFolder = useCallback(
    async (id: string, updates: Partial<Folder>) => {
      if (!db || !userId) return;
      try {
        await updateDoc(doc(db, `users/${userId}/folders`, id), updates);
      } catch (err) {
        console.error("Error updating folder:", err);
        throw err;
      }
    },
    [userId],
  );

  const deleteFolder = useCallback(
    async (id: string) => {
      if (!db || !userId) return;
      try {
        await deleteDoc(doc(db, `users/${userId}/folders`, id));
      } catch (err) {
        console.error("Error deleting folder:", err);
        throw err;
      }
    },
    [userId],
  );

  const createFile = useCallback(
    async (file: FileItem) => {
      if (!db || !userId) return;
      try {
        const fileData = { ...file };
        delete fileData.blobUrl;
        await setDoc(doc(db, `users/${userId}/files`, file.id), fileData);
      } catch (err) {
        console.error("Error creating file:", err);
        throw err;
      }
    },
    [userId],
  );

  const updateFile = useCallback(
    async (id: string, updates: Partial<FileItem>) => {
      if (!db || !userId) return;
      try {
        const fileUpdates = { ...updates };
        delete fileUpdates.blobUrl;
        await updateDoc(doc(db, `users/${userId}/files`, id), fileUpdates);
      } catch (err) {
        console.error("Error updating file:", err);
        throw err;
      }
    },
    [userId],
  );

  const deleteFile = useCallback(
    async (id: string) => {
      if (!db || !userId) return;
      try {
        await deleteDoc(doc(db, `users/${userId}/files`, id));
      } catch (err) {
        console.error("Error deleting file:", err);
        throw err;
      }
    },
    [userId],
  );

  const setActiveDataroomId = useCallback(
    async (id: string | null) => {
      if (!db || !userId) return;
      try {
        await setDoc(
          doc(db, `users/${userId}/preferences`, "settings"),
          { activeDataroomId: id },
          { merge: true },
        );
      } catch (err) {
        console.error("Error setting active dataroom:", err);
      }
    },
    [userId],
  );

  const setActiveFolderId = useCallback(
    async (id: string | null) => {
      if (!db || !userId) return;
      try {
        await setDoc(
          doc(db, `users/${userId}/preferences`, "settings"),
          { activeFolderId: id },
          { merge: true },
        );
      } catch (err) {
        console.error("Error setting active folder:", err);
      }
    },
    [userId],
  );

  useEffect(() => {
    if (!db || !userId || loading) return;

    let isMounted = true;

    const loadPreferences = async () => {
      if (!db) return;
      try {
        const prefsDoc = await getDoc(
          doc(db, `users/${userId}/preferences`, "settings"),
        );
        if (!isMounted) return;

        if (prefsDoc.exists()) {
          const prefs = prefsDoc.data();
          setData((prev: AppState) => {
            const activeDataroomId = prefs.activeDataroomId || null;
            const activeFolderId = prefs.activeFolderId || null;

            if (activeDataroomId && !prev.datarooms[activeDataroomId]) {
              return prev;
            }
            if (activeFolderId && !prev.folders[activeFolderId]) {
              return prev;
            }

            if (
              prev.activeDataroomId === activeDataroomId &&
              prev.activeFolderId === activeFolderId
            ) {
              return prev;
            }

            return {
              ...prev,
              activeDataroomId,
              activeFolderId,
            };
          });
        } else {
          setData((prev: AppState) => {
            if (
              !prev.activeDataroomId &&
              Object.keys(prev.datarooms).length > 0
            ) {
              const firstDataroomId = Object.keys(prev.datarooms)[0];
              const firstDataroom = prev.datarooms[firstDataroomId];
              return {
                ...prev,
                activeDataroomId: firstDataroomId,
                activeFolderId: firstDataroom.rootFolderId,
              };
            }
            return prev;
          });
        }
      } catch (err) {
        console.error("Error loading preferences:", err);
      }
    };

    loadPreferences();

    return () => {
      isMounted = false;
    };
  }, [userId, loading]);

  return {
    data,
    loading,
    error,
    createDataroom,
    updateDataroom,
    deleteDataroom,
    createFolder,
    updateFolder,
    deleteFolder,
    createFile,
    updateFile,
    deleteFile,
    setActiveDataroomId,
    setActiveFolderId,
  };
}
