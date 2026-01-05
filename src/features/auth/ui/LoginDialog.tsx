import { useState } from "react";
import { DialogShell } from "../../../shared/ui/DialogShell";
import { buttonStyles } from "../../../shared/ui/styles";
import { useAuth } from "../model/useAuth";
import { toast } from "sonner";

interface LoginDialogProps {
  onClose: () => void;
  onSwitchToSignUp: () => void;
}

export function LoginDialog({ onClose, onSwitchToSignUp }: LoginDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success("Signed in successfully");
      onClose();
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    setLoading(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success("Signed in successfully");
      onClose();
    }
  };

  return (
    <DialogShell
      title="Sign in"
      description="Enter your credentials to access your data rooms"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-ink mb-1"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-4 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
            placeholder="your@email.com"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-ink mb-1"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-4 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
            placeholder="••••••••"
            required
            disabled={loading}
            minLength={6}
          />
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="submit"
            disabled={loading}
            className={buttonStyles.base + " " + buttonStyles.primary}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-panel px-2 text-muted">Or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className={buttonStyles.base + " " + buttonStyles.ghost}
          >
            Sign in with Google
          </button>
        </div>

        <p className="text-xs text-center text-muted">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToSignUp}
            className="text-accent hover:underline font-medium"
          >
            Sign up
          </button>
        </p>
      </form>
    </DialogShell>
  );
}
