import { useEffect, useRef } from "react";
import type { FileItem } from "../../../../entities/file/model/types";
import type { Folder } from "../../../../entities/folder/model/types";
import { cx, formatBytes, formatDate } from "../../../../shared/lib/utils";
import { buttonStyles } from "../../../../shared/ui/styles";
import {
  EditIcon,
  FileIcon,
  FolderIcon,
  TrashIcon,
} from "../../../../shared/ui/Icons";
import { TooltipLabel } from "../../../../shared/ui/TooltipLabel";

interface DocumentsListProps {
  folders: Folder[];
  files: FileItem[];
  previewFileId: string | null;
  selectedFolderIds: Set<string>;
  selectedFileIds: Set<string>;
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  onSelectAllVisible: () => void;
  onClearSelection: () => void;
  onToggleFolderSelection: (folderId: string) => void;
  onToggleFileSelection: (fileId: string) => void;
  onSelectFolder: (folderId: string) => void;
  onSelectFile: (fileId: string | null) => void;
  onRenameFolder: (folderId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onRenameFile: (fileId: string) => void;
  onDeleteFile: (fileId: string) => void;
  onDragStartItem: (
    event: React.DragEvent<HTMLDivElement>,
    type: "folder" | "file",
    id: string,
  ) => void;
  onDragOverFolder: (event: React.DragEvent<HTMLElement>) => void;
  onDropOnFolder: (
    event: React.DragEvent<HTMLElement>,
    folderId: string,
  ) => void;
}

export function DocumentsList({
  folders,
  files,
  previewFileId,
  selectedFolderIds,
  selectedFileIds,
  allVisibleSelected,
  someVisibleSelected,
  onSelectAllVisible,
  onClearSelection,
  onToggleFolderSelection,
  onToggleFileSelection,
  onSelectFolder,
  onSelectFile,
  onRenameFolder,
  onDeleteFolder,
  onRenameFile,
  onDeleteFile,
  onDragStartItem,
  onDragOverFolder,
  onDropOnFolder,
}: DocumentsListProps) {
  const selectAllRef = useRef<HTMLInputElement>(null);
  const hasRows = folders.length + files.length > 0;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someVisibleSelected;
    }
  }, [someVisibleSelected]);

  const rows = [
    ...folders.map((folder) => ({
      id: folder.id,
      type: "folder" as const,
      name: folder.name,
      details: `${folder.childFolderIds.length} folders · ${folder.fileIds.length} files`,
      createdAt: folder.createdAt,
      onClick: () => onSelectFolder(folder.id),
      isSelected: selectedFolderIds.has(folder.id),
    })),
    ...files.map((file) => ({
      id: file.id,
      type: "file" as const,
      name: file.name,
      details: formatBytes(file.size),
      createdAt: file.createdAt,
      onClick: () => onSelectFile(file.id),
      isActive: file.id === previewFileId,
      isSelected: selectedFileIds.has(file.id),
    })),
  ];

  return (
    <div className="rounded-2xl border border-border bg-white/70 overflow-x-auto -mx-4 sm:mx-0 lg:overflow-x-visible lg:mx-0">
      <div className="min-w-[600px] lg:min-w-0">
        <div className="grid grid-cols-[32px_minmax(0,1fr)_140px_120px_88px] gap-3 border-b border-border bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted rounded-t-2xl">
          <div className="flex items-center justify-center">
            <input
              ref={selectAllRef}
              type="checkbox"
              checked={hasRows && allVisibleSelected}
              onChange={() =>
                allVisibleSelected ? onClearSelection() : onSelectAllVisible()
              }
              disabled={!hasRows}
              className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
              aria-label="Select all items"
            />
          </div>
          <span>Name</span>
          <span>Details</span>
          <span>Added</span>
          <span className="text-right">Actions</span>
        </div>
        <div className="divide-y divide-border overflow-visible">
          {rows.map((row, index) => (
            <div
              key={row.id}
              className={cx(
                "grid grid-cols-[32px_minmax(0,1fr)_140px_120px_88px] items-center gap-3 px-4 py-3 text-sm transition cursor-pointer overflow-visible",
                index === rows.length - 1 && "rounded-b-2xl",
                row.isSelected
                  ? "bg-white shadow-soft"
                  : row.type === "file" && row.isActive
                    ? "bg-white shadow-soft"
                    : "hover:bg-white",
              )}
              role="button"
              tabIndex={0}
              onClick={row.onClick}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  row.onClick();
                }
              }}
              draggable
              onDragStart={(event) => onDragStartItem(event, row.type, row.id)}
              onDragOver={row.type === "folder" ? onDragOverFolder : undefined}
              onDrop={
                row.type === "folder"
                  ? (event) => onDropOnFolder(event, row.id)
                  : undefined
              }
            >
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={row.isSelected}
                  onChange={() => {
                    if (row.type === "folder") {
                      onToggleFolderSelection(row.id);
                    } else {
                      onToggleFileSelection(row.id);
                    }
                  }}
                  onClick={(event) => event.stopPropagation()}
                  className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                  aria-label={`Select ${row.type} ${row.name}`}
                />
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 text-accent">
                  {row.type === "folder" ? <FolderIcon /> : <FileIcon />}
                </span>
                <span className="font-medium min-w-0">
                  <TooltipLabel text={row.name} className="max-w-full">
                    {row.name}
                  </TooltipLabel>
                </span>
              </div>
              <span className="text-xs text-muted min-w-0">
                <TooltipLabel text={row.details} className="max-w-full">
                  {row.details}
                </TooltipLabel>
              </span>
              <span className="text-xs text-muted">
                {formatDate(row.createdAt)}
              </span>
              <div className="flex items-center justify-end gap-1">
                <button
                  className={buttonStyles.icon}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (row.type === "folder") {
                      onRenameFolder(row.id);
                    } else {
                      onRenameFile(row.id);
                    }
                  }}
                  title={
                    row.type === "folder" ? "Rename folder" : "Rename file"
                  }
                  aria-label={
                    row.type === "folder" ? "Rename folder" : "Rename file"
                  }
                >
                  <EditIcon />
                </button>
                <button
                  className={buttonStyles.icon}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (row.type === "folder") {
                      onDeleteFolder(row.id);
                    } else {
                      onDeleteFile(row.id);
                    }
                  }}
                  title={
                    row.type === "folder" ? "Delete folder" : "Delete file"
                  }
                  aria-label={
                    row.type === "folder" ? "Delete folder" : "Delete file"
                  }
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
