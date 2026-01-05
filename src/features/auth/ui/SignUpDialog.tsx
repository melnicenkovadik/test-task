import { useState } from "react";
import { DialogShell } from "../../../shared/ui/DialogShell";
import { buttonStyles } from "../../../shared/ui/styles";
import { useAuth } from "../model/useAuth";
import { toast } from "sonner";

interface SignUpDialogProps {
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export function SignUpDialog({ onClose, onSwitchToLogin }: SignUpDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password);
    setLoading(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success("Account created successfully");
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
      title="Create account"
      description="Sign up to start organizing your documents"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="signup-email"
            className="block text-sm font-medium text-ink mb-1"
          >
            Email
          </label>
          <input
            id="signup-email"
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
            htmlFor="signup-password"
            className="block text-sm font-medium text-ink mb-1"
          >
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-4 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
            placeholder="••••••••"
            required
            disabled={loading}
            minLength={6}
          />
          <p className="text-xs text-muted mt-1">At least 6 characters</p>
        </div>

        <div>
          <label
            htmlFor="confirm-password"
            className="block text-sm font-medium text-ink mb-1"
          >
            Confirm Password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? "Creating account..." : "Create account"}
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
            Sign up with Google
          </button>
        </div>

        <p className="text-xs text-center text-muted">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-accent hover:underline font-medium"
          >
            Sign in
          </button>
        </p>
      </form>
    </DialogShell>
  );
}
