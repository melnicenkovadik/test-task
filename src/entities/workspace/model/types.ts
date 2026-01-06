import type { Dataroom } from "../../dataroom/model/types";
import type { Folder } from "../../folder/model/types";
import type { FileItem } from "../../file/model/types";

export type AppState = {
  datarooms: Record<string, Dataroom>;
  folders: Record<string, Folder>;
  files: Record<string, FileItem>;
  activeDataroomId: string | null;
  activeFolderId: string | null;
};
