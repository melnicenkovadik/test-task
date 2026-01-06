import { useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../shared/lib/firebase";
import type { AppState } from "../../../entities/workspace/model/types";
import { logError } from "../../../shared/lib/logger";

export const useFirestorePreferences = (
  userId: string | null,
  loading: boolean,
  setData: React.Dispatch<React.SetStateAction<AppState>>,
) => {
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
        logError("Error loading preferences", err);
      }
    };

    loadPreferences();

    return () => {
      isMounted = false;
    };
  }, [userId, loading, setData]);
};
