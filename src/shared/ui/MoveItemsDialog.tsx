import { useEffect, useState } from "react";
import { cx } from "../lib/utils";
import { buttonStyles } from "./styles";
import { DialogShell } from "./DialogShell";

interface MoveItemsDialogProps {
  title: string;
  description?: string;
  options: Array<{ id: string; label: string }>;
  defaultFolderId: string;
  onConfirm: (folderId: string) => void;
  onCancel: () => void;
}

export function MoveItemsDialog({
  title,
  description,
  options,
  defaultFolderId,
  onConfirm,
  onCancel,
}: MoveItemsDialogProps) {
  const [value, setValue] = useState(defaultFolderId);

  useEffect(() => {
    setValue(defaultFolderId);
  }, [defaultFolderId]);

  const isDisabled = options.length === 0;

  return (
    <DialogShell title={title} description={description} onClose={onCancel}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!isDisabled) {
            onConfirm(value);
          }
        }}
      >
        <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Destination folder
          <select
            className="mt-2 w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-ink outline-none focus:border-accent"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            disabled={isDisabled}
          >
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {isDisabled && (
          <p className="rounded-xl border border-[#f7c8c1] bg-[#fce8e6] px-3 py-2 text-xs text-[#a61b1b]">
            No valid destination folders available.
          </p>
        )}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className={cx(buttonStyles.base, buttonStyles.subtle)}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={cx(buttonStyles.base, buttonStyles.primary)}
            disabled={isDisabled}
          >
            Move
          </button>
        </div>
      </form>
    </DialogShell>
  );
}
