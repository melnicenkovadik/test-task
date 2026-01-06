import { useFolderCreateRename } from "./useFolderCreateRename";
import { useFolderDelete } from "./useFolderDelete";
import { useFolderSelect } from "./useFolderSelect";
import { useFirestore } from "../../data/model/useFirestore";

export const useFolderActions = (
  userId: string | null,
  firestore: ReturnType<typeof useFirestore>,
) => {
  const select = useFolderSelect(userId, firestore);
  const createRename = useFolderCreateRename(userId, firestore);
  const remove = useFolderDelete(userId, firestore);

  return {
    ...select,
    ...createRename,
    ...remove,
  };
};
