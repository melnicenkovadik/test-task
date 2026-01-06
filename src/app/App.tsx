import { useState } from "react";
import { LoginDialog } from "../features/auth/ui/LoginDialog";
import { SignUpDialog } from "../features/auth/ui/SignUpDialog";
import { useAuth } from "../features/auth/model/useAuth";
import { WorkspacePage } from "../pages/workspace/ui/WorkspacePage";

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const [authDialog, setAuthDialog] = useState<"login" | "signup" | null>(null);

  const isFirebaseConfigured =
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_API_KEY !== "";

  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink px-6">
        <div className="text-center max-w-2xl">
          <h1 className="font-display text-2xl mb-4">
            Firebase Configuration Required
          </h1>
          <p className="text-muted mb-4">
            Please set up Firebase Authentication to use this application.
          </p>
          <div className="bg-white/70 rounded-lg border border-border p-6 text-left">
            <p className="text-sm font-medium mb-2">Quick Setup:</p>
            <ol className="text-sm text-muted space-y-2 list-decimal list-inside">
              <li>
                Create a Firebase project at{" "}
                <a
                  href="https://console.firebase.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  Firebase Console
                </a>
              </li>
              <li>Add a web app to your Firebase project</li>
              <li>
                Enable Authentication → Email/Password (and optionally Google)
              </li>
              <li>
                Copy <code className="bg-white px-1 rounded">.env.example</code>{" "}
                to <code className="bg-white px-1 rounded">.env.local</code>
              </li>
              <li>
                Fill in your Firebase config values in{" "}
                <code className="bg-white px-1 rounded">.env.local</code>
              </li>
              <li>Restart the dev server</li>
            </ol>
            <p className="text-xs text-muted mt-4">
              See{" "}
              <code className="bg-white px-1 rounded">FIREBASE_SETUP.md</code>{" "}
              for detailed instructions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink">
        <div className="text-center">
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {user && <WorkspacePage userId={user.uid} />}

      {!user && authDialog === "login" && (
        <LoginDialog
          onClose={() => setAuthDialog(null)}
          onSwitchToSignUp={() => setAuthDialog("signup")}
        />
      )}

      {!user && authDialog === "signup" && (
        <SignUpDialog
          onClose={() => setAuthDialog(null)}
          onSwitchToLogin={() => setAuthDialog("login")}
        />
      )}

      {!user && !authDialog && (
        <LoginDialog
          onClose={() => {}}
          onSwitchToSignUp={() => setAuthDialog("signup")}
        />
      )}
    </>
  );
}
