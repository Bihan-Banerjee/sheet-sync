"use client";

import { useMemo } from "react";
import { useAuth as useAuthContext } from "@/context/AuthContext";
import type { AppUser } from "@/types";

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