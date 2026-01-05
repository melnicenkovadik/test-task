import type { Dataroom, AppState } from "../types";
import { cx } from "../utils";
import { buttonStyles } from "../utils/styles";
import { EditIcon, PlusIcon, TrashIcon } from "./Icons";

interface DataroomPanelProps {
  datarooms: Dataroom[];
  activeDataroomId: string | null;
  appState: AppState;
  onSelect: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

export function DataroomPanel({
  datarooms,
  activeDataroomId,
  appState,
  onSelect,
  onRename,
  onDelete,
  onCreate,
}: DataroomPanelProps) {
  return (
    <section className="rounded-3xl border border-border bg-panel/90 p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg">Data rooms</h2>
          <p className="text-xs text-muted">Top-level workspaces</p>
        </div>
        <button
          className={cx(buttonStyles.base, buttonStyles.subtle)}
          onClick={onCreate}
          aria-label="Create data room"
          title="Create data room"
        >
          <PlusIcon />
        </button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {datarooms.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-border bg-white/70 px-4 py-5 text-sm text-muted">
            Create your first data room to start organizing documents.
          </div>
        )}
        {datarooms.map((room) => {
          const isActive = room.id === activeDataroomId;
          const fileCount = Object.values(appState.files).filter(
            (file) => file.dataroomId === room.id,
          ).length;
          const folderCount = Object.values(appState.folders).filter(
            (folder) => folder.dataroomId === room.id,
          ).length;

          return (
            <div
              key={room.id}
              className={cx(
                "group rounded-2xl border px-4 py-3 transition",
                isActive
                  ? "border-accent bg-white shadow-soft"
                  : "border-border bg-white/60 hover:bg-white cursor-pointer",
              )}
            >
              <button
                className="w-full text-left transition hover:text-accent"
                onClick={() => onSelect(room.id)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className="text-sm font-semibold truncate"
                      title={room.name}
                    >
                      {room.name}
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
                  onClick={() =>
                    onRename(room.id, room.name)
                  }
                  title="Rename data room"
                  aria-label="Rename data room"
                >
                  <EditIcon />
                </button>
                <button
                  className={buttonStyles.icon}
                  onClick={() => onDelete(room.id)}
                  title="Delete data room"
                  aria-label="Delete data room"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
