import { useCallback } from "react";
import { deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../shared/lib/firebase";
import { logError } from "../../../shared/lib/logger";
import type { Dataroom } from "../../../entities/dataroom/model/types";
import type { Folder } from "../../../entities/folder/model/types";
import type { FileItem } from "../../../entities/file/model/types";

export const useFirestoreActions = (userId: string | null) => {
  const createDataroom = useCallback(
    async (dataroom: Dataroom) => {
      if (!db || !userId) return;
      try {
        await setDoc(
          doc(db, `users/${userId}/datarooms`, dataroom.id),
          dataroom,
        );
      } catch (err) {
        logError("Error creating dataroom", err);
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
        logError("Error updating dataroom", err);
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
        logError("Error deleting dataroom", err);
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
        logError("Error creating folder", err);
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
        logError("Error updating folder", err);
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
        logError("Error deleting folder", err);
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
        logError("Error creating file", err);
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
        logError("Error updating file", err);
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
        logError("Error deleting file", err);
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
        logError("Error setting active dataroom", err);
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
        logError("Error setting active folder", err);
      }
    },
    [userId],
  );

  return {
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
};
