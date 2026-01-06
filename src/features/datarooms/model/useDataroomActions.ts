import { useDataroomCreateRename } from "./useDataroomCreateRename";
import { useDataroomDeleteSelect } from "./useDataroomDeleteSelect";
import { useFirestore } from "../../data/model/useFirestore";

export const useDataroomActions = (
  userId: string | null,
  firestore: ReturnType<typeof useFirestore>,
) => {
  const createRename = useDataroomCreateRename(userId, firestore);
  const deleteSelect = useDataroomDeleteSelect(userId, firestore);

  return {
    ...createRename,
    ...deleteSelect,
  };
};
