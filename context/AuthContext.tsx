"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  type User,
  onAuthStateChanged,
  signInWithPopup,
  signInAnonymously,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

// Curated presence colour palette — 10 distinct colours
const PRESENCE_COLORS = [
  "#6366F1", // indigo
  "#22D3EE", // cyan
  "#F59E0B", // amber
  "#22C55E", // green
  "#EC4899", // pink
  "#F97316", // orange
  "#8B5CF6", // violet
  "#14B8A6", // teal
  "#EF4444", // red
  "#84CC16", // lime
] as const;

function getRandomColor(): string {
  return PRESENCE_COLORS[Math.floor(Math.random() * PRESENCE_COLORS.length)]!;
}

interface AuthContextType {
  user: User | null;
  displayName: string;
  presenceColor: string;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [presenceColor, setPresenceColor] = useState<string>(getRandomColor());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setDisplayName(
          firebaseUser.displayName ??
            sessionStorage.getItem("guestDisplayName") ??
            "Anonymous"
        );
        const storedColor = sessionStorage.getItem("presenceColor");
        if (storedColor) setPresenceColor(storedColor);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const color = getRandomColor();
    setPresenceColor(color);
    sessionStorage.setItem("presenceColor", color);
    setDisplayName(result.user.displayName ?? "User");
  };

  const signInAsGuest = async (name: string) => {
    const result = await signInAnonymously(auth);
    await updateProfile(result.user, { displayName: name });
    const color = getRandomColor();
    setPresenceColor(color);
    sessionStorage.setItem("presenceColor", color);
    sessionStorage.setItem("guestDisplayName", name);
    setDisplayName(name);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    sessionStorage.removeItem("presenceColor");
    sessionStorage.removeItem("guestDisplayName");
    setDisplayName("");
  };

  return (
    <AuthContext.Provider
      value={{ user, displayName, presenceColor, loading, signInWithGoogle, signInAsGuest, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}