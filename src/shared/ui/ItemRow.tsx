import { cx } from "../lib/utils";
import { TooltipLabel } from "./TooltipLabel";

interface ItemRowProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  actions: React.ReactNode;
  onClick: () => void;
  isActive?: boolean;
  isSelected?: boolean;
  leading?: React.ReactNode;
  draggable?: boolean;
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
}

export function ItemRow({
  title,
  subtitle,
  icon,
  actions,
  onClick,
  isActive,
  isSelected,
  leading,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
}: ItemRowProps) {
  const isHighlighted = Boolean(isActive || isSelected);

  return (
    <div
      className={cx(
        "group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition cursor-pointer",
        isHighlighted
          ? "border-accent bg-white shadow-soft"
          : "border-border bg-white/70 hover:bg-white active:scale-98",
      )}
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        {leading && <div className="shrink-0">{leading}</div>}
        <div className="shrink-0 text-accent">{icon}</div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="font-medium truncate">
            <TooltipLabel text={title} className="flex-1">
              {title}
            </TooltipLabel>
          </p>
          <p className="text-xs text-muted truncate">
            <TooltipLabel text={subtitle} className="flex-1">
              {subtitle}
            </TooltipLabel>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100">
        {actions}
      </div>
    </div>
  );
}
