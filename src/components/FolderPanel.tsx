import type { Dataroom, Folder } from "../types";
import { cx } from "../utils";
import { buttonStyles } from "../utils/styles";
import { PlusIcon } from "./Icons";
import { FolderTree } from "./FolderTree";

interface FolderPanelProps {
  dataroom: Dataroom;
  folders: Record<string, Folder>;
  activeFolderId: string | null;
  expandedFolderIds: Set<string>;
  onSelect: (folderId: string) => void;
  onToggle: (folderId: string) => void;
  onRename: (folderId: string) => void;
  onDelete: (folderId: string) => void;
  onCreateFolder: () => void;
  onDropItems: (
    event: React.DragEvent<HTMLElement>,
    folderId: string,
  ) => void;
  onDragOverFolder: (event: React.DragEvent<HTMLElement>) => void;
  onDragStartFolder: (
    event: React.DragEvent<HTMLDivElement>,
    folderId: string,
  ) => void;
}

export function FolderPanel({
  dataroom,
  folders,
  activeFolderId,
  expandedFolderIds,
  onSelect,
  onToggle,
  onRename,
  onDelete,
  onCreateFolder,
  onDropItems,
  onDragOverFolder,
  onDragStartFolder,
}: FolderPanelProps) {
  return (
    <section className="rounded-3xl border border-border bg-panel/80 p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg">Folders</h2>
          <p
            className="text-xs text-muted truncate"
            title={dataroom.name}
          >
            {dataroom.name}
          </p>
        </div>
        <button
          className={cx(buttonStyles.base, buttonStyles.subtle)}
          onClick={onCreateFolder}
        >
          <PlusIcon />
          Folder
        </button>
      </div>
      <div className="mt-4 space-y-2">
        <FolderTree
          rootId={dataroom.rootFolderId}
          folders={folders}
          activeFolderId={activeFolderId}
          expandedFolderIds={expandedFolderIds}
          onSelect={onSelect}
          onToggle={onToggle}
          onRename={onRename}
          onDelete={onDelete}
          hideRoot
          onDropItems={onDropItems}
          onDragOverFolder={onDragOverFolder}
          onDragStartFolder={onDragStartFolder}
        />
      </div>
    </section>
  );
}
