import { useFileUpload } from "./useFileUpload";
import { useFileRenameDelete } from "./useFileRenameDelete";
import { useFirestore } from "../../data/model/useFirestore";

export const useFileActions = (
  userId: string | null,
  firestore: ReturnType<typeof useFirestore>,
) => {
  const upload = useFileUpload(userId, firestore);
  const renameDelete = useFileRenameDelete(userId, firestore);

  return {
    ...upload,
    ...renameDelete,
  };
};
