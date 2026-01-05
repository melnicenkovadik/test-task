interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-white/70 px-4 py-8 text-center text-sm">
      <p className="font-medium text-ink">{title}</p>
      <p className="mt-2 text-xs text-muted leading-relaxed">{description}</p>
    </div>
  );
}
