import { cx } from "../../../shared/lib/utils";
import { buttonStyles } from "../../../shared/ui/styles";
import { EditIcon, TrashIcon } from "../../../shared/ui/Icons";
import type { Dataroom } from "../model/types";

interface DataroomCardProps {
  dataroom: Dataroom;
  isActive: boolean;
  fileCount: number;
  folderCount: number;
  onSelect: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export function DataroomCard({
  dataroom,
  isActive,
  fileCount,
  folderCount,
  onSelect,
  onRename,
  onDelete,
}: DataroomCardProps) {
  return (
    <div
      className={cx(
        "group rounded-2xl border px-4 py-3 transition",
        isActive
          ? "border-accent bg-white shadow-soft"
          : "border-border bg-white/60 hover:bg-white cursor-pointer",
      )}
    >
      <button
        className="w-full text-left transition hover:text-accent"
        onClick={onSelect}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" title={dataroom.name}>
              {dataroom.name}
            </p>
            <p className="text-xs text-muted">
              {folderCount} folders · {fileCount} files
            </p>
          </div>
          {isActive && (
            <span className="rounded-full bg-accent/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent whitespace-nowrap">
              Active
            </span>
          )}
        </div>
      </button>
      <div className="mt-3 flex items-center gap-1 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100">
        <button
          className={buttonStyles.icon}
          onClick={onRename}
          title="Rename data room"
          aria-label="Rename data room"
        >
          <EditIcon />
        </button>
        <button
          className={buttonStyles.icon}
          onClick={onDelete}
          title="Delete data room"
          aria-label="Delete data room"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}
