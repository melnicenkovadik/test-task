import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../../../shared/lib/firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => Boolean(auth));

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!auth) {
      return {
        user: null,
        error: "Firebase is not configured. Please check your .env.local file.",
      };
    }
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      return { user: userCredential.user, error: null };
    } catch (error: unknown) {
      const errorCode =
        error && typeof error === "object" && "code" in error
          ? String(error.code)
          : "";
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "";
      let userFriendlyMessage = "Failed to sign in";
      if (errorCode === "auth/user-not-found") {
        userFriendlyMessage = "No account found with this email";
      } else if (errorCode === "auth/wrong-password") {
        userFriendlyMessage = "Incorrect password";
      } else if (errorCode === "auth/invalid-email") {
        userFriendlyMessage = "Invalid email address";
      } else if (errorCode === "auth/user-disabled") {
        userFriendlyMessage = "This account has been disabled";
      } else if (errorCode === "auth/invalid-credential") {
        userFriendlyMessage = "Invalid email or password";
      } else if (errorMessage) {
        userFriendlyMessage = errorMessage;
      }
      return { user: null, error: userFriendlyMessage };
    }
  };

  const signUp = async (email: string, password: string) => {
    if (!auth) {
      return {
        user: null,
        error: "Firebase is not configured. Please check your .env.local file.",
      };
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      return { user: userCredential.user, error: null };
    } catch (error: unknown) {
      const errorCode =
        error && typeof error === "object" && "code" in error
          ? String(error.code)
          : "";
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "";
      let userFriendlyMessage = "Failed to create account";
      if (errorCode === "auth/email-already-in-use") {
        userFriendlyMessage = "An account with this email already exists";
      } else if (errorCode === "auth/invalid-email") {
        userFriendlyMessage = "Invalid email address";
      } else if (errorCode === "auth/weak-password") {
        userFriendlyMessage = "Password is too weak. Use at least 6 characters";
      } else if (errorMessage) {
        userFriendlyMessage = errorMessage;
      }
      return { user: null, error: userFriendlyMessage };
    }
  };

  const signInWithGoogle = async () => {
    if (!auth) {
      return {
        user: null,
        error: "Firebase is not configured. Please check your .env.local file.",
      };
    }
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      return { user: userCredential.user, error: null };
    } catch (error: unknown) {
      const errorCode =
        error && typeof error === "object" && "code" in error
          ? String(error.code)
          : "";
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "";
      let userFriendlyMessage = "Failed to sign in with Google";
      if (errorCode === "auth/popup-closed-by-user") {
        userFriendlyMessage = "Sign-in popup was closed";
      } else if (errorCode === "auth/popup-blocked") {
        userFriendlyMessage =
          "Popup was blocked by browser. Please allow popups for this site";
      } else if (errorCode === "auth/cancelled-popup-request") {
        userFriendlyMessage = "Only one popup request is allowed at a time";
      } else if (errorMessage) {
        userFriendlyMessage = errorMessage;
      }
      return { user: null, error: userFriendlyMessage };
    }
  };

  const logout = async () => {
    if (!auth) {
      return { error: "Firebase is not configured." };
    }
    try {
      await signOut(auth);
      return { error: null };
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Failed to sign out";
      return { error: errorMessage };
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    isAuthenticated: !!user,
  };
}
