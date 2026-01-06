import { cx } from "../../../shared/lib/utils";
import { buttonStyles } from "../../../shared/ui/styles";
import { PlusIcon, SparkIcon } from "../../../shared/ui/Icons";

interface EmptyDataroomProps {
  onCreateDataroom: () => void;
  onLoadDemo: () => void;
}

export function EmptyDataroom({
  onCreateDataroom,
  onLoadDemo,
}: EmptyDataroomProps) {
  return (
    <section className="w-full">
      <div className="rounded-3xl border border-border bg-white/70 p-10 text-center shadow-card">
        <h2 className="font-display text-2xl">Start a new data room</h2>
        <p className="mt-3 text-sm text-muted">
          Create a workspace to organize folders and PDF files for due
          diligence.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            className={cx(buttonStyles.base, buttonStyles.primary)}
            onClick={onCreateDataroom}
          >
            <PlusIcon />
            Create data room
          </button>
          <button
            className={cx(buttonStyles.base, buttonStyles.ghost)}
            onClick={onLoadDemo}
          >
            <SparkIcon />
            Load demo local data
          </button>
        </div>
      </div>
    </section>
  );
}
