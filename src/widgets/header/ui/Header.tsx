import { cx } from "../../../shared/lib/utils";
import { logError } from "../../../shared/lib/logger";
import { buttonStyles } from "../../../shared/ui/styles";
import { LogOutIcon, PlusIcon, SparkIcon } from "../../../shared/ui/Icons";
import { useAuth } from "../../../features/auth/model/useAuth";

interface HeaderProps {
  onCreateDataroom: () => void;
  onLoadDemo: () => void;
}

export function Header({ onCreateDataroom, onLoadDemo }: HeaderProps) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    const { error } = await logout();
    if (error) {
      logError("Logout error", error);
    }
  };

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
        {user && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="hidden sm:inline">{user.email}</span>
            <button
              className={cx(buttonStyles.base, buttonStyles.ghost)}
              onClick={handleLogout}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOutIcon />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        )}
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
          Load demo
        </button>
      </div>
    </header>
  );
}
