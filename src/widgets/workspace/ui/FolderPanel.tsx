import { memo, useMemo } from "react";
import { useWorkspaceStore } from "../../../entities/workspace/model/workspaceStore";
import { useWorkspaceActions } from "../model/workspaceActionsContext";
import { useUIStore } from "../../../shared/model/uiStore";
import { cx } from "../../../shared/lib/utils";
import { buttonStyles } from "../../../shared/ui/styles";
import { ChevronIcon, PlusIcon } from "../../../shared/ui/Icons";
import { FolderTree } from "../../../entities/folder/ui/FolderTree";

export const FolderPanel = memo(function FolderPanel() {
  const isCollapsed = useUIStore((state) => state.foldersCollapsed);
  const setFoldersCollapsed = useUIStore(
    (state) => state.setFoldersCollapsed,
  );
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
    <section
      className={cx(
        "w-full rounded-3xl border border-border bg-panel/80 shadow-card transition-all duration-300",
        isCollapsed
          ? "p-5 lg:w-16 lg:px-3 lg:flex lg:h-full lg:items-center lg:justify-center"
          : "p-5",
      )}
    >
      <div
        className={cx(
          "flex items-center justify-between gap-3 transition-all duration-300",
          isCollapsed && "lg:flex-col lg:items-center lg:justify-center",
        )}
      >
        <button
          className={cx(
            "flex items-center gap-2 text-left min-w-0 transition-all duration-300",
            isCollapsed
              ? "flex-1 lg:w-full lg:flex-col lg:items-center lg:justify-center lg:gap-2"
              : "flex-1 lg:flex-none",
          )}
          onClick={() => setFoldersCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand folders" : "Collapse folders"}
          aria-expanded={!isCollapsed}
        >
          <span
            className={cx(
              "shrink-0 transition-transform duration-300",
              isCollapsed
                ? "rotate-90 lg:rotate-0"
                : "-rotate-90 lg:rotate-180",
            )}
          >
            <ChevronIcon isOpen={false} />
          </span>
          <div className={cx("min-w-0", isCollapsed && "lg:hidden")}>
            <h2 className="font-display text-lg lg:whitespace-nowrap">
              Folders
            </h2>
            <p
              className="text-xs text-muted truncate lg:whitespace-nowrap"
              title={dataroom.name}
            >
              {dataroom.name}
            </p>
          </div>
        </button>
        {!isCollapsed && (
          <button
            className={cx(buttonStyles.base, buttonStyles.subtle, "shrink-0")}
            onClick={handleCreateFolder}
          >
            <PlusIcon />
            <span className="hidden sm:inline">Folder</span>
          </button>
        )}
      </div>
      {!isCollapsed && (
        <div className="mt-4 overflow-x-auto -mx-5 px-5 lg:overflow-x-visible lg:mx-0 lg:px-0">
          <div className="min-w-0 space-y-2">
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
        </div>
      )}
    </section>
  );
});
