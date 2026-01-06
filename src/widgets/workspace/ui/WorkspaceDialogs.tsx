import { ConfirmDialog } from "../../../shared/ui/ConfirmDialog";
import { MoveItemsDialog } from "../../../shared/ui/MoveItemsDialog";
import { NameDialog } from "../../../shared/ui/NameDialog";
import { FilePreview } from "../../../entities/file/ui/FilePreview";
import { getDescendantStats } from "../../../entities/workspace/lib/selectors";
import {
  useWorkspaceStore,
  workspaceSelectors,
} from "../../../entities/workspace/model/workspaceStore";
import { useWorkspaceDialogs } from "../model/useWorkspaceDialogs";
import { useWorkspaceDocuments } from "../model/useWorkspaceDocuments";
import { useWorkspaceMoveOptions } from "../model/useWorkspaceMoveOptions";
import { useWorkspaceActions } from "../model/workspaceActionsContext";

type WorkspaceDialogsProps = {
  moveItemsToFolder: (
    targetFolderId: string,
    folderIds: string[],
    fileIds: string[],
  ) => Promise<void> | void;
  performBulkDelete: (
    folderIds: string[],
    fileIds: string[],
  ) => Promise<void> | void;
};

export function WorkspaceDialogs({
  moveItemsToFolder,
  performBulkDelete,
}: WorkspaceDialogsProps) {
  const { dialog, closeDialog } = useWorkspaceDialogs();
  const { data, activeDataroom } = useWorkspaceDocuments();
  const previewFileId = useWorkspaceStore(workspaceSelectors.previewFileId);
  const setPreviewFileId = useWorkspaceStore(
    workspaceSelectors.setPreviewFileId,
  );
  const previewFile = previewFileId ? data.files[previewFileId] : null;
  const { moveOptions, defaultMoveTargetId } = useWorkspaceMoveOptions();
  const {
    handleCreateDataroom,
    handleRenameDataroom,
    handleDeleteDataroom,
    handleCreateFolder,
    handleRenameFolder,
    handleDeleteFolder,
    handleRenameFile,
    handleDeleteFile,
  } = useWorkspaceActions();

  return (
    <>
      {dialog?.type === "create-dataroom" && (
        <NameDialog
          title="Create data room"
          description="Give your workspace a clear, client-ready name."
          label="Data room name"
          placeholder="Acme Series B"
          confirmLabel="Create"
          error={dialog.error}
          onConfirm={handleCreateDataroom}
          onCancel={closeDialog}
        />
      )}

      {previewFile && (
        <FilePreview
          file={previewFile}
          onClose={() => setPreviewFileId(null)}
        />
      )}

      {dialog?.type === "rename-dataroom" && (
        <NameDialog
          title="Rename data room"
          description="Update the workspace name and keep everyone aligned."
          label="Data room name"
          defaultValue={dialog.currentName}
          confirmLabel="Save"
          error={dialog.error}
          onConfirm={(value) => handleRenameDataroom(dialog.id, value)}
          onCancel={closeDialog}
        />
      )}

      {dialog?.type === "create-folder" && (
        <NameDialog
          title="Create folder"
          description="Add a new folder inside the current directory."
          label="Folder name"
          placeholder="Financial statements"
          confirmLabel="Create"
          error={dialog.error}
          onConfirm={(value) => handleCreateFolder(dialog.parentId, value)}
          onCancel={closeDialog}
        />
      )}

      {dialog?.type === "rename-folder" && (
        <NameDialog
          title="Rename folder"
          description="Keep folder names consistent for due diligence."
          label="Folder name"
          defaultValue={dialog.currentName}
          confirmLabel="Save"
          error={dialog.error}
          onConfirm={(value) => handleRenameFolder(dialog.id, value)}
          onCancel={closeDialog}
        />
      )}

      {dialog?.type === "rename-file" && (
        <NameDialog
          title="Rename file"
          description="PDF extension is enforced automatically."
          label="File name"
          defaultValue={dialog.currentName.replace(/\.pdf$/i, "")}
          confirmLabel="Save"
          error={dialog.error}
          onConfirm={(value) => handleRenameFile(dialog.id, value)}
          onCancel={closeDialog}
        />
      )}

      {dialog?.type === "confirm-delete-dataroom" && (
        <ConfirmDialog
          title="Delete data room?"
          description="This removes the data room and all nested folders and files."
          confirmLabel="Delete"
          onConfirm={() => handleDeleteDataroom(dialog.id)}
          onCancel={closeDialog}
        />
      )}

      {dialog?.type === "confirm-delete-folder" && (
        <ConfirmDialog
          title="Delete folder?"
          description={(() => {
            const stats = getDescendantStats(dialog.id, data);
            if (stats.folderCount === 0 && stats.fileCount === 0) {
              return "This folder is empty and will be removed.";
            }
            return `This removes ${stats.folderCount} nested folder(s) and ${stats.fileCount} file(s).`;
          })()}
          confirmLabel="Delete"
          onConfirm={() => handleDeleteFolder(dialog.id)}
          onCancel={closeDialog}
        />
      )}

      {dialog?.type === "confirm-delete-file" && (
        <ConfirmDialog
          title="Delete file?"
          description="This removes the PDF from the data room."
          confirmLabel="Delete"
          onConfirm={() => handleDeleteFile(dialog.id)}
          onCancel={closeDialog}
        />
      )}

      {dialog?.type === "confirm-bulk-delete" && (
        <ConfirmDialog
          title="Delete selected items?"
          description={`This removes ${dialog.folderIds.length + dialog.fileIds.length} item(s).`}
          confirmLabel="Delete"
          onConfirm={() => {
            performBulkDelete(dialog.folderIds, dialog.fileIds);
            closeDialog();
          }}
          onCancel={closeDialog}
        />
      )}

      {dialog?.type === "bulk-move" && activeDataroom && (
        <MoveItemsDialog
          title="Move items"
          description={`Moving ${dialog.folderIds.length + dialog.fileIds.length} item(s).`}
          options={moveOptions}
          defaultFolderId={defaultMoveTargetId}
          onConfirm={(folderId) => {
            moveItemsToFolder(folderId, dialog.folderIds, dialog.fileIds);
            closeDialog();
          }}
          onCancel={closeDialog}
        />
      )}
    </>
  );
}
