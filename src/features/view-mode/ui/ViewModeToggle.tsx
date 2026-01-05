import { cx } from "../../../shared/lib/utils";
import { GridIcon, ListIcon } from "../../../shared/ui/Icons";
import type { ViewMode } from "../../../shared/types";

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function ViewModeToggle({
  viewMode,
  onViewModeChange,
}: ViewModeToggleProps) {
  const viewButtonBase =
    "inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-muted transition";
  const viewButtonActive = "border-border bg-white text-accent shadow-soft";

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-white/70 p-1">
      <button
        className={cx(viewButtonBase, viewMode === "grid" && viewButtonActive)}
        onClick={() => onViewModeChange("grid")}
        aria-label="Grid view"
        title="Grid view"
      >
        <GridIcon />
      </button>
      <button
        className={cx(viewButtonBase, viewMode === "list" && viewButtonActive)}
        onClick={() => onViewModeChange("list")}
        aria-label="List view"
        title="List view"
      >
        <ListIcon />
      </button>
    </div>
  );
}
