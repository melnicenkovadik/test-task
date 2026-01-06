import { useRef } from "react";
import { toast } from "sonner";
import { cx } from "../../../../shared/lib/utils";
import { buttonStyles } from "../../../../shared/ui/styles";
import { BackIcon, PlusIcon, UploadIcon } from "../../../../shared/ui/Icons";
import { TooltipLabel } from "../../../../shared/ui/TooltipLabel";
import { useWorkspaceDocuments } from "../../model/useWorkspaceDocuments";
import { useWorkspaceActions } from "../../model/workspaceActionsContext";
import { useWorkspaceDialogs } from "../../model/useWorkspaceDialogs";

const formatDisplayName = (name: string, limit = 20) =>
  name.length > limit ? `${name.slice(0, limit)}...` : name;

export function DocumentsPanelHeader() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { activeDataroom, activeFolder, folderPath } = useWorkspaceDocuments();
  const {
    handleSelectFolder,
    handleUploadFiles,
    handleDragOverFolder,
    handleDropOnFolder,
  } = useWorkspaceActions();
  const { openDialog } = useWorkspaceDialogs();

  if (!activeDataroom || !activeFolder) {
    return null;
  }

  const isRootFolder = activeFolder.parentId === null;
  const activeTitle = !isRootFolder ? activeFolder.name : "Documents";

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const fileList = event.target.files;
    if (fileList) {
      handleUploadFiles(fileList, activeFolder.id);
    }
    event.target.value = "";
  };

  const handleCreateFolderDialog = () => {
    const parentId = activeFolder?.id || activeDataroom?.rootFolderId;
    if (!parentId) {
      toast.error("Please select a folder first");
      return;
    }
    openDialog({ type: "create-folder", parentId });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="min-w-0">
        <p
          className="text-xs uppercase tracking-[0.2em] text-muted truncate"
          title={activeDataroom.name}
        >
          {activeDataroom.name}
        </p>
        <div className="flex items-center gap-2">
          {!isRootFolder && activeFolder.parentId && (
            <button
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white/70 text-muted transition hover:bg-white hover:text-ink"
              onClick={() =>
                activeFolder.parentId &&
                handleSelectFolder(activeFolder.parentId)
              }
              title="Back to parent folder"
              aria-label="Back to parent folder"
            >
              <BackIcon />
            </button>
          )}
          <h2 className="font-display text-xl truncate" title={activeTitle}>
            {!isRootFolder ? (
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
              onClick={() => handleSelectFolder(folder.id)}
              title={folder.parentId === null ? "Documents" : folder.name}
              onDragOver={handleDragOverFolder}
              onDrop={(event) => handleDropOnFolder(event, folder.id)}
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
          onClick={handleCreateFolderDialog}
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
  );
}
