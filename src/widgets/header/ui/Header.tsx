import { cx } from "../../../shared/lib/utils";
import { buttonStyles } from "../../../shared/ui/styles";
import { PlusIcon, SparkIcon } from "../../../shared/ui/Icons";

interface HeaderProps {
  onCreateDataroom: () => void;
  onLoadDemo: () => void;
}

export function Header({ onCreateDataroom, onLoadDemo }: HeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          <span>Acme Corp</span>
          <span className="h-1 w-1 rounded-full bg-accent" />
          <span>Data Room MVP</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl text-ink">
          Secure due diligence, thoughtfully organized.
        </h1>
        <p className="max-w-2xl text-sm text-muted leading-relaxed">
          Create data rooms, curate folders, and upload PDFs with clear
          audit-friendly structure. Everything stays in your browser memory.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          className={cx(buttonStyles.base, buttonStyles.ghost)}
          onClick={onCreateDataroom}
        >
          <PlusIcon />
          New data room
        </button>
        <button
          className={cx(buttonStyles.base, buttonStyles.subtle)}
          onClick={onLoadDemo}
        >
          <SparkIcon />
          Load demo local
        </button>
      </div>
    </header>
  );
}
