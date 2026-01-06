import { useState } from "react";
import type { AppState } from "../../../entities/workspace/model/types";
import { createEmptyState } from "../../../entities/workspace/lib/demo";
import { useFirestoreActions } from "./useFirestoreActions";
import { useFirestorePreferences } from "./useFirestorePreferences";
import { useFirestoreRealtime } from "./useFirestoreRealtime";

export function useFirestore(userId: string | null) {
  const [data, setData] = useState<AppState>(createEmptyState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFirestoreRealtime(userId, setData, setLoading, setError);
  useFirestorePreferences(userId, loading, setData);
  const actions = useFirestoreActions(userId);

  return {
    data,
    loading,
    error,
    ...actions,
  };
}
