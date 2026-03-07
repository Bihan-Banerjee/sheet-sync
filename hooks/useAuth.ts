"use client";

import { useMemo } from "react";
import { useAuth as useAuthContext } from "@/context/AuthContext";
import type { AppUser } from "@/types";

/**
 * Thin wrapper over AuthContext that returns a typed AppUser object
 * alongside the raw auth actions. Use this hook in all components.
 */
export function useAppUser(): {
  appUser: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
} {
  const { user, displayName, presenceColor, loading, signInWithGoogle, signInAsGuest, signOut } =
    useAuthContext();

  const appUser = useMemo<AppUser | null>(() => {
    if (!user) return null;
    return {
      uid: user.uid,
      displayName,
      email: user.email,
      photoURL: user.photoURL,
      isAnonymous: user.isAnonymous,
      presenceColor,
    };
  }, [user, displayName, presenceColor]);

  return { appUser, loading, signInWithGoogle, signInAsGuest, signOut };
}