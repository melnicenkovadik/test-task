import { useEffect } from "react";
import {
  collection,
  onSnapshot,
  type DocumentData,
  type FirestoreError,
  type QuerySnapshot,
} from "firebase/firestore";
import { db } from "../../../shared/lib/firebase";
import { logError } from "../../../shared/lib/logger";
import type { AppState } from "../../../entities/workspace/model/types";
import type { Dataroom } from "../../../entities/dataroom/model/types";
import type { Folder } from "../../../entities/folder/model/types";
import type { FileItem } from "../../../entities/file/model/types";

export const useFirestoreRealtime = (
  userId: string | null,
  setData: React.Dispatch<React.SetStateAction<AppState>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
) => {
  useEffect(() => {
    if (!db || !userId) {
      setLoading(false);
      return;
    }
    setLoading(true);

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
          const dataroomIds = Object.keys(datarooms);
          const nextActiveDataroomId =
            prev.activeDataroomId && datarooms[prev.activeDataroomId]
              ? prev.activeDataroomId
              : (dataroomIds[0] ?? null);

          if (!nextActiveDataroomId) {
            return {
              ...prev,
              datarooms,
              activeDataroomId: null,
              activeFolderId: null,
            };
          }

          const nextActiveFolderId =
            nextActiveDataroomId !== prev.activeDataroomId
              ? (datarooms[nextActiveDataroomId]?.rootFolderId ?? null)
              : prev.activeFolderId;

          return {
            ...prev,
            datarooms,
            activeDataroomId: nextActiveDataroomId,
            activeFolderId: nextActiveFolderId,
          };
        });
      },
      (err: FirestoreError) => {
        logError("Error listening to datarooms", err);
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
        setData((prev: AppState) => {
          const activeFolderId =
            prev.activeFolderId && folders[prev.activeFolderId]
              ? prev.activeFolderId
              : prev.activeDataroomId
                ? (prev.datarooms[prev.activeDataroomId]?.rootFolderId ?? null)
                : null;
          return { ...prev, folders, activeFolderId };
        });
      },
      (err: FirestoreError) => {
        logError("Error listening to folders", err);
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
        setData((prev: AppState) => {
          return { ...prev, files, activeFolderId: prev.activeFolderId };
        });
        setLoading(false);
      },
      (err: FirestoreError) => {
        logError("Error listening to files", err);
        setError(err.message);
        setLoading(false);
      },
    );

    return () => {
      unsubscribeDatarooms();
      unsubscribeFolders();
      unsubscribeFiles();
    };
  }, [setData, setError, setLoading, userId]);
};
