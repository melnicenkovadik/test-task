import { useLoadingStore } from "../model/loadingStore";

export function Loader() {
  const isLoading = useLoadingStore((state) => state.isLoading);

  if (!isLoading) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-lg">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span className="text-xs text-muted">Loading...</span>
    </div>
  );
}
