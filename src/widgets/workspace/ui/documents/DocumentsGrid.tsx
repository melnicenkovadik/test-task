import type { FileItem } from "../../../../entities/file/model/types";
import type { Folder } from "../../../../entities/folder/model/types";
import { formatBytes, formatDate } from "../../../../shared/lib/utils";
import { buttonStyles } from "../../../../shared/ui/styles";
import {
  EditIcon,
  FileIcon,
  FolderIcon,
  TrashIcon,
} from "../../../../shared/ui/Icons";
import { ItemRow } from "../../../../shared/ui/ItemRow";

interface DocumentsGridProps {
  folders: Folder[];
  files: FileItem[];
  previewFileId: string | null;
  selectedFolderIds: Set<string>;
  selectedFileIds: Set<string>;
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

export function DocumentsGrid({
  folders,
  files,
  previewFileId,
  selectedFolderIds,
  selectedFileIds,
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
}: DocumentsGridProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {folders.map((folder) => (
        <ItemRow
          key={folder.id}
          title={folder.name}
          subtitle={`${folder.childFolderIds.length} folders · ${folder.fileIds.length} files`}
          icon={<FolderIcon />}
          isSelected={selectedFolderIds.has(folder.id)}
          leading={
            <input
              type="checkbox"
              checked={selectedFolderIds.has(folder.id)}
              onChange={() => onToggleFolderSelection(folder.id)}
              onClick={(event) => event.stopPropagation()}
              className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
              aria-label={`Select folder ${folder.name}`}
            />
          }
          onClick={() => onSelectFolder(folder.id)}
          draggable
          onDragStart={(event) => onDragStartItem(event, "folder", folder.id)}
          onDragOver={onDragOverFolder}
          onDrop={(event) => onDropOnFolder(event, folder.id)}
          actions={
            <>
              <button
                className={buttonStyles.icon}
                onClick={(event) => {
                  event.stopPropagation();
                  onRenameFolder(folder.id);
                }}
                title="Rename folder"
                aria-label="Rename folder"
              >
                <EditIcon />
              </button>
              <button
                className={buttonStyles.icon}
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteFolder(folder.id);
                }}
                title="Delete folder"
                aria-label="Delete folder"
              >
                <TrashIcon />
              </button>
            </>
          }
        />
      ))}
      {files.map((file) => (
        <ItemRow
          key={file.id}
          title={file.name}
          subtitle={`${formatBytes(file.size)} · ${formatDate(file.createdAt)}`}
          icon={<FileIcon />}
          isActive={file.id === previewFileId}
          isSelected={selectedFileIds.has(file.id)}
          leading={
            <input
              type="checkbox"
              checked={selectedFileIds.has(file.id)}
              onChange={() => onToggleFileSelection(file.id)}
              onClick={(event) => event.stopPropagation()}
              className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
              aria-label={`Select file ${file.name}`}
            />
          }
          onClick={() => onSelectFile(file.id)}
          draggable
          onDragStart={(event) => onDragStartItem(event, "file", file.id)}
          actions={
            <>
              <button
                className={buttonStyles.icon}
                onClick={(event) => {
                  event.stopPropagation();
                  onRenameFile(file.id);
                }}
                title="Rename file"
                aria-label="Rename file"
              >
                <EditIcon />
              </button>
              <button
                className={buttonStyles.icon}
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteFile(file.id);
                }}
                title="Delete file"
                aria-label="Delete file"
              >
                <TrashIcon />
              </button>
            </>
          }
        />
      ))}
    </div>
  );
}
