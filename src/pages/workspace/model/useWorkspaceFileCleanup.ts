import { useEffect, useRef } from "react";
import type { FileItem } from "../../../entities/file/model/types";
import {
  useWorkspaceStore,
  workspaceSelectors,
} from "../../../entities/workspace/model/workspaceStore";

export const useWorkspaceFileCleanup = () => {
  const files = useWorkspaceStore(workspaceSelectors.data).files;
  const filesRef = useRef<Record<string, FileItem>>(files);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    return () => {
      Object.values(filesRef.current).forEach((file) => {
        if (file.blobUrl) {
          URL.revokeObjectURL(file.blobUrl);
        }
      });
    };
  }, []);
};
