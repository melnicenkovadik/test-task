import { toast } from "sonner";
import { cx } from "../../../../shared/lib/utils";
import { EmptyState } from "../../../../shared/ui/EmptyState";
import { DocumentsGrid } from "./DocumentsGrid";
import { DocumentsList } from "./DocumentsList";
import { useWorkspaceActions } from "../../model/workspaceActionsContext";
import { useWorkspaceDocuments } from "../../model/useWorkspaceDocuments";
import { useWorkspaceDragAndDrop } from "../../model/useWorkspaceDragAndDrop";
import { useWorkspaceSelection } from "../../model/useWorkspaceSelection";
import { useWorkspaceViewMode } from "../../model/useWorkspaceViewMode";
import {
  useWorkspaceStore,
  workspaceSelectors,
} from "../../../../entities/workspace/model/workspaceStore";

export function DocumentsPanelBody() {
  const { filteredFolders, filteredFiles, searchQuery, data } =
    useWorkspaceDocuments();
  const { viewMode } = useWorkspaceViewMode();
  const { selection, clearSelection } = useWorkspaceSelection();
  const { dragActive, handleDragOver, handleDragLeave } =
    useWorkspaceDragAndDrop();
  const {
    handleSelectAllVisible,
    handleToggleFolderSelection,
    handleToggleFileSelection,
    handleSelectFolder,
    handleRenameFolder,
    handleDeleteFolder,
    handleRenameFile,
    handleDeleteFile,
    handleDragStartItem,
    handleDragOverFolder,
    handleDropOnFolder,
    handleDrop,
  } = useWorkspaceActions();
  const previewFileId = useWorkspaceStore(workspaceSelectors.previewFileId);
  const setPreviewFileId = useWorkspaceStore(
    workspaceSelectors.setPreviewFileId,
  );

  const selectedFolderIds = selection.folders;
  const selectedFileIds = selection.files;
  const hasVisibleItems = filteredFolders.length + filteredFiles.length > 0;
  const selectedVisibleCount =
    filteredFolders.filter((folder) => selectedFolderIds.has(folder.id))
      .length +
    filteredFiles.filter((file) => selectedFileIds.has(file.id)).length;
  const allVisibleSelected =
    hasVisibleItems &&
    selectedVisibleCount === filteredFolders.length + filteredFiles.length;
  const someVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected;
  const isEmpty = filteredFolders.length === 0 && filteredFiles.length === 0;

  const handleSelectFile = (fileId: string | null) => {
    setPreviewFileId(fileId);
    const file = fileId ? data.files[fileId] : null;
    if (fileId && !file?.blobUrl) {
      toast.info("Preview becomes available after the PDF is uploaded.");
    }
  };

  return (
    <div
      className={cx(
        "mt-6 rounded-3xl border border-dashed border-border bg-white/60 p-5 transition",
        dragActive && "border-accent bg-accent/10 scale-[1.01]",
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="mb-3 rounded-2xl bg-white/60 px-4 py-3 text-xs text-muted">
        Click any PDF to open a full-screen preview. Drag and drop to upload, or
        use the buttons above.
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
          onToggleFolderSelection={handleToggleFolderSelection}
          onToggleFileSelection={handleToggleFileSelection}
          onSelectFolder={handleSelectFolder}
          onSelectFile={handleSelectFile}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onRenameFile={handleRenameFile}
          onDeleteFile={handleDeleteFile}
          onDragStartItem={handleDragStartItem}
          onDragOverFolder={handleDragOverFolder}
          onDropOnFolder={handleDropOnFolder}
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
          onSelectAllVisible={handleSelectAllVisible}
          onClearSelection={clearSelection}
          onToggleFolderSelection={handleToggleFolderSelection}
          onToggleFileSelection={handleToggleFileSelection}
          onSelectFolder={handleSelectFolder}
          onSelectFile={handleSelectFile}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onRenameFile={handleRenameFile}
          onDeleteFile={handleDeleteFile}
          onDragStartItem={handleDragStartItem}
          onDragOverFolder={handleDragOverFolder}
          onDropOnFolder={handleDropOnFolder}
        />
      )}
    </div>
  );
}
