import type { Folder } from "../model/types";
import { cx } from "../../../shared/lib/utils";
import { buttonStyles } from "../../../shared/ui/styles";
import {
  ChevronIcon,
  EditIcon,
  FolderIcon,
  TrashIcon,
} from "../../../shared/ui/Icons";
import { TooltipLabel } from "../../../shared/ui/TooltipLabel";

interface FolderTreeProps {
  rootId: string;
  folders: Record<string, Folder>;
  activeFolderId: string | null;
  expandedFolderIds: Set<string>;
  onSelect: (folderId: string) => void;
  onToggle: (folderId: string) => void;
  onRename?: (folderId: string) => void;
  onDelete?: (folderId: string) => void;
  hideRoot?: boolean;
  onDropItems?: (event: React.DragEvent<HTMLElement>, folderId: string) => void;
  onDragOverFolder?: (event: React.DragEvent<HTMLElement>) => void;
  onDragStartFolder?: (
    event: React.DragEvent<HTMLDivElement>,
    folderId: string,
  ) => void;
}

export function FolderTree({
  rootId,
  folders,
  activeFolderId,
  expandedFolderIds,
  onSelect,
  onToggle,
  onRename,
  onDelete,
  hideRoot = false,
  onDropItems,
  onDragOverFolder,
  onDragStartFolder,
}: FolderTreeProps) {
  const root = folders[rootId];
  if (!root) return null;

  const renderFolder = (folder: Folder, depth: number) => {
    const isRoot = folder.parentId === null;
    const isExpanded = expandedFolderIds.has(folder.id);
    const hasChildren = folder.childFolderIds.length > 0;
    const isActive = folder.id === activeFolderId;
    const label = isRoot ? "All documents" : folder.name;
    const showActions = Boolean(onRename || onDelete) && !isRoot;

    return (
      <div key={folder.id} className="space-y-1">
        <div
          className={cx(
            "group flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition min-w-0",
            isActive
              ? "border-accent bg-white text-ink shadow-soft"
              : "border-border bg-white/60 text-muted hover:bg-white",
          )}
          style={{ marginLeft: depth * 12 }}
          draggable={!isRoot}
          onDragStart={
            !isRoot && onDragStartFolder
              ? (event) => onDragStartFolder(event, folder.id)
              : undefined
          }
          onDragOver={onDragOverFolder}
          onDrop={
            onDropItems ? (event) => onDropItems(event, folder.id) : undefined
          }
        >
          {hasChildren ? (
            <button
              className="flex shrink-0 items-center gap-2 transition hover:text-ink"
              onClick={() => onToggle(folder.id)}
              aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
              aria-expanded={isExpanded}
            >
              <ChevronIcon isOpen={isExpanded} />
            </button>
          ) : (
            <span className="h-4 w-4 shrink-0" />
          )}
          <button
            className="flex flex-1 min-w-0 items-center gap-2 text-left transition hover:text-ink"
            onClick={() => onSelect(folder.id)}
          >
            <span className="shrink-0 text-accent">
              <FolderIcon />
            </span>
            <TooltipLabel text={label} className="flex-1 min-w-0 truncate">
              {label}
            </TooltipLabel>
          </button>
          {showActions && (
            <div className="flex items-center gap-1 text-xs opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100">
              {onRename && (
                <button
                  className={buttonStyles.icon}
                  onClick={() => onRename(folder.id)}
                  title="Rename folder"
                  aria-label="Rename folder"
                >
                  <EditIcon />
                </button>
              )}
              {onDelete && (
                <button
                  className={buttonStyles.icon}
                  onClick={() => onDelete(folder.id)}
                  title="Delete folder"
                  aria-label="Delete folder"
                >
                  <TrashIcon />
                </button>
              )}
            </div>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div className="space-y-1">
            {folder.childFolderIds
              .map((childId) => folders[childId])
              .filter(Boolean)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((child) => renderFolder(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const topLevelFolders = hideRoot
    ? root.childFolderIds
        .map((childId) => folders[childId])
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name))
    : [root];

  return (
    <div className="space-y-1">
      {topLevelFolders.map((folder) => renderFolder(folder, 0))}
    </div>
  );
}
