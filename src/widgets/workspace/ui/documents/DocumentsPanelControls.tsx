import { cx } from "../../../../shared/lib/utils";
import { buttonStyles } from "../../../../shared/ui/styles";
import { GridIcon, ListIcon, SearchIcon } from "../../../../shared/ui/Icons";
import { useWorkspaceDocuments } from "../../model/useWorkspaceDocuments";
import { useWorkspaceSelection } from "../../model/useWorkspaceSelection";
import { useWorkspaceActions } from "../../model/workspaceActionsContext";
import { useWorkspaceViewMode } from "../../model/useWorkspaceViewMode";
import {
  useWorkspaceStore,
  workspaceSelectors,
} from "../../../../entities/workspace/model/workspaceStore";

export function DocumentsPanelControls() {
  const { filteredFolders, filteredFiles, searchQuery } =
    useWorkspaceDocuments();
  const { selection, clearSelection } = useWorkspaceSelection();
  const { handleBulkMove, handleBulkDeleteConfirm, handleSelectAllVisible } =
    useWorkspaceActions();
  const { viewMode, handleViewModeChange } = useWorkspaceViewMode();
  const setSearchQuery = useWorkspaceStore(workspaceSelectors.setSearchQuery);

  const selectedCount = selection.folders.size + selection.files.size;
  const hasVisibleItems = filteredFolders.length + filteredFiles.length > 0;
  const selectedVisibleCount =
    filteredFolders.filter((folder) => selection.folders.has(folder.id))
      .length +
    filteredFiles.filter((file) => selection.files.has(file.id)).length;
  const allVisibleSelected =
    hasVisibleItems &&
    selectedVisibleCount === filteredFolders.length + filteredFiles.length;
  const viewButtonBase =
    "inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-muted transition";
  const viewButtonActive = "border-border bg-white text-accent shadow-soft";

  return (
    <>
      {selectedCount > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white/70 px-4 py-3 text-xs text-muted">
          <span>{selectedCount} selected</span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className={cx(buttonStyles.base, buttonStyles.ghost)}
              onClick={handleBulkMove}
            >
              Move
            </button>
            <button
              className={cx(buttonStyles.base, buttonStyles.danger)}
              onClick={handleBulkDeleteConfirm}
            >
              Delete
            </button>
            <button
              className={cx(buttonStyles.base, buttonStyles.subtle)}
              onClick={clearSelection}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-3 py-2 text-sm">
            <SearchIcon />
            <input
              className="w-44 bg-transparent text-sm outline-none placeholder-muted focus:placeholder-transparent transition"
              placeholder="Search folders or files"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <div className="inline-flex items-center gap-1 rounded-full border border-border bg-white/70 p-1">
            <button
              className={cx(
                viewButtonBase,
                viewMode === "grid" && viewButtonActive,
              )}
              onClick={() => handleViewModeChange("grid")}
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
              onClick={() => handleViewModeChange("list")}
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
                allVisibleSelected ? clearSelection : handleSelectAllVisible
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
    </>
  );
}
