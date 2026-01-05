import type { ReactNode } from "react";

interface TooltipLabelProps {
  text: string;
  children: ReactNode;
  className?: string;
}

export function TooltipLabel({
  text,
  children,
  className = "",
}: TooltipLabelProps) {
  return (
    <span
      className={`relative inline-flex items-center group min-w-0 ${className}`}
    >
      <span className="truncate min-w-0">{children}</span>
      <span
        className="pointer-events-none absolute left-1/2 top-full z-20 mt-3 -translate-x-1/2 max-w-[400px] rounded-lg border border-white/10 bg-slate-900/95 px-3 py-1 text-[11px] font-medium text-white shadow-xl shadow-black/25 opacity-0 scale-95 transition duration-150 group-hover:opacity-100 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:scale-100 break-words"
        role="tooltip"
      >
        {text}
        <span className="pointer-events-none absolute left-1/2 -top-1.5 -translate-x-1/2 h-3 w-3 rotate-45 rounded-[3px] border border-white/10 bg-slate-900/95 shadow-md shadow-black/20" />
      </span>
    </span>
  );
}
