import type { FileItem } from "../model/types";
import { cx } from "../../../shared/lib/utils";
import { buttonStyles } from "../../../shared/ui/styles";
import { CloseIcon, FileIcon } from "../../../shared/ui/Icons";

interface FilePreviewProps {
  file: FileItem;
  onClose: () => void;
}

export function FilePreview({ file, onClose }: FilePreviewProps) {
  const hasPreview = Boolean(file.blobUrl);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl h-[min(90vh,960px)] rounded-3xl border border-border bg-panel/95 shadow-soft animate-in fade-in zoom-in duration-150 overflow-hidden flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">
              PDF preview
            </p>
            <p className="text-sm font-semibold truncate" title={file.name}>
              {file.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasPreview && (
              <a
                className={cx(buttonStyles.base, buttonStyles.ghost)}
                href={file.blobUrl}
                download={file.name}
                aria-label={`Download ${file.name}`}
              >
                Download
              </a>
            )}
            <button
              className={cx(buttonStyles.base, buttonStyles.subtle)}
              onClick={onClose}
              aria-label="Close preview"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="relative flex-1 bg-black/80">
          {hasPreview ? (
            <iframe
              title={file.name}
              src={file.blobUrl}
              className="absolute inset-0 h-full w-full rounded-b-3xl border-0 bg-white"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-muted">
              <FileIcon />
              <p className="font-semibold">
                Preview is only available for uploaded PDFs.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
