import { useRef, type ReactNode } from "react";
import type { Dataroom, FileItem, Folder, ViewMode } from "../types";
import { cx } from "../utils";
import { buttonStyles } from "../utils/styles";
import {
  BackIcon,
  GridIcon,
  ListIcon,
  PlusIcon,
  SearchIcon,
  UploadIcon,
} from "./Icons";
import { DocumentsGrid } from "./DocumentsGrid";
import { DocumentsList } from "./DocumentsList";
import { EmptyState } from "./EmptyState";

const formatDisplayName = (name: string, limit = 20) =>
  name.length > limit ? `${name.slice(0, limit)}...` : name;

function TooltipLabel({
  text,
  children,
}: {
  text: string;
  children: ReactNode;
}) {
  return (
    <span className="relative inline-flex items-center group overflow-visible">
      <span className="truncate">{children}</span>
      <span
        className="pointer-events-none absolute left-1/2 top-full z-20 mt-3 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-slate-900/95 px-3 py-1 text-[11px] font-medium text-white shadow-xl shadow-black/25 opacity-0 scale-95 transition duration-150 group-hover:opacity-100 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:scale-100"
        role="tooltip"
      >
        {text}
        <span className="pointer-events-none absolute left-1/2 -top-1.5 -translate-x-1/2 h-3 w-3 rotate-45 rounded-[3px] border border-white/10 bg-slate-900/95 shadow-md shadow-black/20" />
      </span>
    </span>
  );
}

interface DocumentsPanelProps {
  dataroom: Dataroom;
  activeFolder: Folder | null;
  filteredFolders: Folder[];
  filteredFiles: FileItem[];
  searchQuery: string;
  previewFileId: string | null;
  dragActive: boolean;
  folderPath: Folder[];
  viewMode: ViewMode;
  selectedFolderIds: Set<string>;
  selectedFileIds: Set<string>;
  onViewModeChange: (mode: ViewMode) => void;
  onSelectAllVisible: () => void;
  onClearSelection: () => void;
  onToggleFolderSelection: (folderId: string) => void;
  onToggleFileSelection: (fileId: string) => void;
  onBulkMove: () => void;
  onBulkDelete: () => void;
  onSearchChange: (query: string) => void;
  onCreateFolder: () => void;
  onUploadFiles: (files: FileList | File[]) => void;
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
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
}

export function DocumentsPanel({
  dataroom,
  activeFolder,
  filteredFolders,
  filteredFiles,
  searchQuery,
  previewFileId,
  dragActive,
  folderPath,
  viewMode,
  selectedFolderIds,
  selectedFileIds,
  onViewModeChange,
  onSelectAllVisible,
  onClearSelection,
  onToggleFolderSelection,
  onToggleFileSelection,
  onBulkMove,
  onBulkDelete,
  onSearchChange,
  onCreateFolder,
  onUploadFiles,
  onSelectFolder,
  onSelectFile,
  onRenameFolder,
  onDeleteFolder,
  onRenameFile,
  onDeleteFile,
  onDragStartItem,
  onDragOverFolder,
  onDropOnFolder,
  onDragOver,
  onDragLeave,
  onDrop,
}: DocumentsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isRootFolder = activeFolder?.parentId === null;
  const activeTitle =
    activeFolder && !isRootFolder ? activeFolder.name : "Documents";
  const isEmpty = filteredFolders.length === 0 && filteredFiles.length === 0;
  const selectedCount = selectedFolderIds.size + selectedFileIds.size;
  const hasVisibleItems = filteredFolders.length + filteredFiles.length > 0;
  const selectedVisibleCount =
    filteredFolders.filter((folder) => selectedFolderIds.has(folder.id))
      .length +
    filteredFiles.filter((file) => selectedFileIds.has(file.id)).length;
  const allVisibleSelected =
    hasVisibleItems &&
    selectedVisibleCount === filteredFolders.length + filteredFiles.length;
  const someVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected;
  const viewButtonBase =
    "inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-muted transition";
  const viewButtonActive = "border-border bg-white text-accent shadow-soft";

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (fileList) {
      onUploadFiles(fileList);
    }
    event.target.value = "";
  };

  return (
    <section className="rounded-3xl border border-border bg-white/80 p-6 shadow-card">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p
            className="text-xs uppercase tracking-[0.2em] text-muted truncate"
            title={dataroom.name}
          >
            {dataroom.name}
          </p>
          <div className="flex items-center gap-2">
            {!isRootFolder && activeFolder?.parentId && (
              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white/70 text-muted transition hover:bg-white hover:text-ink"
                onClick={() => onSelectFolder(activeFolder.parentId)}
                title="Back to parent folder"
                aria-label="Back to parent folder"
              >
                <BackIcon />
              </button>
            )}
            <h2 className="font-display text-xl truncate" title={activeTitle}>
              {!isRootFolder && activeFolder ? (
                <TooltipLabel text={activeFolder.name}>
                  {formatDisplayName(activeFolder.name)}
                </TooltipLabel>
              ) : (
                "Documents"
              )}
            </h2>
          </div>
          <nav className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            {folderPath.map((folder) => (
              <button
                key={folder.id}
                className="rounded-full border border-border bg-white/60 px-2 py-1 text-muted hover:bg-white hover:text-accent transition"
                onClick={() => onSelectFolder(folder.id)}
                title={folder.parentId === null ? "Documents" : folder.name}
                onDragOver={onDragOverFolder}
                onDrop={(event) => onDropOnFolder(event, folder.id)}
              >
                {folder.parentId === null ? (
                  "Documents"
                ) : (
                  <TooltipLabel text={folder.name}>
                    {formatDisplayName(folder.name)}
                  </TooltipLabel>
                )}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className={cx(buttonStyles.base, buttonStyles.ghost)}
            onClick={onCreateFolder}
          >
            <PlusIcon />
            New folder
          </button>
          <button
            className={cx(buttonStyles.base, buttonStyles.primary)}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon />
            Upload PDF
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white/70 px-4 py-3 text-xs text-muted">
          <span>{selectedCount} selected</span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className={cx(buttonStyles.base, buttonStyles.ghost)}
              onClick={onBulkMove}
            >
              Move
            </button>
            <button
              className={cx(buttonStyles.base, buttonStyles.danger)}
              onClick={onBulkDelete}
            >
              Delete
            </button>
            <button
              className={cx(buttonStyles.base, buttonStyles.subtle)}
              onClick={onClearSelection}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Search and Stats */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-3 py-2 text-sm">
            <SearchIcon />
            <input
              className="w-44 bg-transparent text-sm outline-none placeholder-muted focus:placeholder-transparent transition"
              placeholder="Search folders or files"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>
          <div className="inline-flex items-center gap-1 rounded-full border border-border bg-white/70 p-1">
            <button
              className={cx(
                viewButtonBase,
                viewMode === "grid" && viewButtonActive,
              )}
              onClick={() => onViewModeChange("grid")}
              aria-label="Grid view"
              title="Grid view"
            >
              <GridIcon />
            </button>
            <button
              className={cx(
                viewButtonBase,
                viewMode === "list" && viewButtonActive,
              )}
              onClick={() => onViewModeChange("list")}
              aria-label="List view"
              title="List view"
            >
              <ListIcon />
            </button>
          </div>
          {hasVisibleItems && (
            <button
              className={cx(buttonStyles.base, buttonStyles.subtle)}
              onClick={
                allVisibleSelected ? onClearSelection : onSelectAllVisible
              }
            >
              {allVisibleSelected ? "Clear selection" : "Select all"}
            </button>
          )}
        </div>
        <p className="text-xs text-muted">
          {filteredFolders.length} folders · {filteredFiles.length} files
        </p>
      </div>

      {/* Drop Zone and Content */}
      <div
        className={cx(
          "mt-6 rounded-3xl border border-dashed border-border bg-white/60 p-5 transition",
          dragActive && "border-accent bg-accent/10 scale-[1.01]",
        )}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="mb-3 rounded-2xl bg-white/60 px-4 py-3 text-xs text-muted">
          Click any PDF to open a full-screen preview. Drag and drop to upload, or use the buttons above.
        </div>
        {isEmpty ? (
          <EmptyState
            title={searchQuery ? "No matching results" : "No documents yet"}
            description={
              searchQuery
                ? "Try a different keyword or clear the search."
                : "Create folders or upload PDF files to populate this room."
            }
          />
        ) : viewMode === "grid" ? (
          <DocumentsGrid
            folders={filteredFolders}
            files={filteredFiles}
            previewFileId={previewFileId}
            selectedFolderIds={selectedFolderIds}
            selectedFileIds={selectedFileIds}
            onToggleFolderSelection={onToggleFolderSelection}
            onToggleFileSelection={onToggleFileSelection}
            onSelectFolder={onSelectFolder}
            onSelectFile={onSelectFile}
            onRenameFolder={onRenameFolder}
            onDeleteFolder={onDeleteFolder}
            onRenameFile={onRenameFile}
            onDeleteFile={onDeleteFile}
            onDragStartItem={onDragStartItem}
            onDragOverFolder={onDragOverFolder}
            onDropOnFolder={onDropOnFolder}
          />
        ) : (
          <DocumentsList
            folders={filteredFolders}
            files={filteredFiles}
            previewFileId={previewFileId}
            selectedFolderIds={selectedFolderIds}
            selectedFileIds={selectedFileIds}
            allVisibleSelected={allVisibleSelected}
            someVisibleSelected={someVisibleSelected}
            onSelectAllVisible={onSelectAllVisible}
            onClearSelection={onClearSelection}
            onToggleFolderSelection={onToggleFolderSelection}
            onToggleFileSelection={onToggleFileSelection}
            onSelectFolder={onSelectFolder}
            onSelectFile={onSelectFile}
            onRenameFolder={onRenameFolder}
            onDeleteFolder={onDeleteFolder}
            onRenameFile={onRenameFile}
            onDeleteFile={onDeleteFile}
            onDragStartItem={onDragStartItem}
            onDragOverFolder={onDragOverFolder}
            onDropOnFolder={onDropOnFolder}
          />
        )}
      </div>
    </section>
  );
}
