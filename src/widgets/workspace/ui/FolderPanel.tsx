import { memo, useMemo } from "react";
import { useWorkspaceStore } from "../../../entities/workspace/model/workspaceStore";
import { useWorkspaceActions } from "../model/workspaceActionsContext";
import { useUIStore } from "../../../shared/model/uiStore";
import { cx } from "../../../shared/lib/utils";
import { buttonStyles } from "../../../shared/ui/styles";
import { PlusIcon } from "../../../shared/ui/Icons";
import { FolderTree } from "../../../entities/folder/ui/FolderTree";

export const FolderPanel = memo(function FolderPanel() {
  const data = useWorkspaceStore((state) => state.data);
  const setDialog = useWorkspaceStore((state) => state.setDialog);
  const dataroom = data.activeDataroomId
    ? data.datarooms[data.activeDataroomId]
    : null;
  const folders = data.folders;
  const activeFolderId = data.activeFolderId;
  const {
    getExpandedFolders,
    addFolder,
    removeFolder: removeFolderFromStore,
  } = useUIStore();
  const expandedFolderIds = useMemo(() => {
    if (!dataroom) return new Set<string>();
    return getExpandedFolders(dataroom.id);
  }, [dataroom, getExpandedFolders]);
  const {
    handleSelectFolder,
    handleDragStartItem,
    handleDragOverFolder,
    handleDropOnFolder,
  } = useWorkspaceActions();

  if (!dataroom) {
    return null;
  }

  const handleToggle = (folderId: string) => {
    if (expandedFolderIds.has(folderId)) {
      removeFolderFromStore(dataroom.id, folderId);
    } else {
      addFolder(dataroom.id, folderId);
    }
  };

  const handleCreateFolder = () => {
    const parentId = data.activeFolderId || dataroom.rootFolderId;
    if (!parentId) return;
    setDialog({ type: "create-folder", parentId });
  };

  return (
    <section className="rounded-3xl border border-border bg-panel/80 p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg">Folders</h2>
          <p className="text-xs text-muted truncate" title={dataroom.name}>
            {dataroom.name}
          </p>
        </div>
        <button
          className={cx(buttonStyles.base, buttonStyles.subtle)}
          onClick={handleCreateFolder}
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
          onSelect={handleSelectFolder}
          onToggle={handleToggle}
          onDropItems={handleDropOnFolder}
          onDragOverFolder={handleDragOverFolder}
          onDragStartFolder={(event, folderId) =>
            handleDragStartItem(event, "folder", folderId)
          }
        />
      </div>
    </section>
  );
});
