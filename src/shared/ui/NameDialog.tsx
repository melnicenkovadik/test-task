import { useState } from "react";
import { DialogShell } from "./DialogShell";
import { cx } from "../lib/utils";
import { buttonStyles } from "./styles";

interface NameDialogProps {
  title: string;
  description?: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel: string;
  error?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export function NameDialog({
  title,
  description,
  label,
  defaultValue,
  placeholder,
  confirmLabel,
  error,
  onConfirm,
  onCancel,
}: NameDialogProps) {
  const [value, setValue] = useState(defaultValue ?? "");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onConfirm(value);
  };

  return (
    <DialogShell title={title} description={description} onClose={onCancel}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          {label}
          <input
            autoFocus
            className="mt-2 w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
            value={value}
            placeholder={placeholder}
            onChange={(event) => setValue(event.target.value)}
          />
        </label>
        {error && (
          <p className="rounded-xl border border-[#f7c8c1] bg-[#fce8e6] px-3 py-2 text-xs text-[#a61b1b]">
            {error}
          </p>
        )}
        <div className="flex items-center justify-end gap-2 pt-2">
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
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </DialogShell>
  );
}
