export const buttonStyles = {
  base: "inline-flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
  primary:
    "bg-accent text-white shadow-card hover:-translate-y-[1px] hover:shadow-soft",
  ghost: "bg-white/70 text-ink hover:bg-white",
  subtle: "border-transparent bg-transparent text-muted hover:text-ink",
  danger: "bg-[#fce8e6] text-[#a61b1b] border-[#f7c8c1] hover:bg-[#f9d8d2]",
  icon: "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-white/70 text-muted transition hover:bg-white hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
};

export const noticeStyles = {
  error: "border-[#f7c8c1] bg-[#fce8e6]",
  success: "border-[#c7e6dc] bg-[#e9f6f1]",
  info: "border-border bg-white/70",
};
