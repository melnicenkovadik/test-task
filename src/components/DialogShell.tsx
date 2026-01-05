import { cx } from "../utils";
import { CloseIcon } from "./Icons";
import { buttonStyles } from "../utils/styles";

interface DialogShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
}

export function DialogShell({
  title,
  description,
  children,
  onClose,
}: DialogShellProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-3xl border border-border bg-panel/95 p-6 shadow-soft animate-in fade-in duration-200"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-xl">{title}</h3>
            {description && (
              <p className="mt-1 text-sm text-muted">{description}</p>
            )}
          </div>
          <button
            className={cx(buttonStyles.base, buttonStyles.subtle)}
            onClick={onClose}
            aria-label="Close dialog"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
