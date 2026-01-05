import { DialogShell } from "./DialogShell";
import { cx } from "../lib/utils";
import { buttonStyles } from "./styles";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <DialogShell title={title} description={description} onClose={onCancel}>
      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          className={cx(buttonStyles.base, buttonStyles.subtle)}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className={cx(buttonStyles.base, buttonStyles.danger)}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </DialogShell>
  );
}
