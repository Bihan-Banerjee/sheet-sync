"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  doc,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GRID_CONSTANTS } from "@/types";
import type { PresenceData, PresenceMap, CellId, AppUser } from "@/types";

interface UsePresenceReturn {
  presenceMap: PresenceMap;
  otherUsers: PresenceData[];
  updateActiveCell: (cellId: CellId | null) => void;
}

export function usePresence(
  docId: string,
  appUser: AppUser | null
): UsePresenceReturn {
  const [presenceMap, setPresenceMap] = useState<PresenceMap>({});
  const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeCellRef = useRef<CellId | null>(null);
  const hasRegistered = useRef(false);

  // ── Write own presence ───────────────────────────────────────────────────
  const writePresence = useCallback(
    async (cellId: CellId | null) => {
      if (!appUser || !docId) return;
      const presenceRef = doc(
        db,
        "documents",
        docId,
        "presence",
        appUser.uid
      );
      await setDoc(presenceRef, {
        uid: appUser.uid,
        displayName: appUser.displayName,
        color: appUser.presenceColor,
        activeCellId: cellId,
        lastSeen: serverTimestamp(),
      } satisfies Omit<PresenceData, "lastSeen"> & { lastSeen: ReturnType<typeof serverTimestamp> });
    },
    [appUser, docId]
  );

  // ── Remove own presence ──────────────────────────────────────────────────
  const removePresence = useCallback(async () => {
    if (!appUser || !docId) return;
    const presenceRef = doc(
      db,
      "documents",
      docId,
      "presence",
      appUser.uid
    );
    try {
      await deleteDoc(presenceRef);
    } catch {
      // Best-effort cleanup
    }
  }, [appUser, docId]);

  // ── Register presence on mount ───────────────────────────────────────────
  useEffect(() => {
    if (!appUser || !docId || hasRegistered.current) return;
    hasRegistered.current = true;

    void writePresence(null);

    // Heartbeat — keeps presence alive every 5s
    heartbeatTimer.current = setInterval(() => {
      void writePresence(activeCellRef.current);
    }, GRID_CONSTANTS.HEARTBEAT_INTERVAL_MS);

    // Cleanup on tab close / navigation
    const handleUnload = () => { void removePresence(); };
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
      window.removeEventListener("beforeunload", handleUnload);
      void removePresence();
      hasRegistered.current = false;
    };
  }, [appUser, docId, writePresence, removePresence]);

  // ── Listen to all presence entries ──────────────────────────────────────
  useEffect(() => {
    if (!appUser || !docId) return;
    const presenceRef = collection(db, "documents", docId, "presence");

    const unsub = onSnapshot(presenceRef, (snap) => {
      const now = Date.now();
      const map: PresenceMap = {};

      snap.docs.forEach((d) => {
        const data = d.data() as PresenceData;

        // Filter stale entries
        const lastSeen =
          data.lastSeen instanceof Timestamp
            ? data.lastSeen.toMillis()
            : now;

        if (now - lastSeen < GRID_CONSTANTS.PRESENCE_TIMEOUT_MS) {
          map[d.id] = data;
        }
      });

      setPresenceMap(map);
    });

    return () => unsub();
  }, [appUser, docId]);

  // ── Update active cell ───────────────────────────────────────────────────
  const updateActiveCell = useCallback(
    (cellId: CellId | null) => {
      activeCellRef.current = cellId;
      void writePresence(cellId);
    },
    [writePresence]
  );

  // ── Derive other users (exclude self) ────────────────────────────────────
  const otherUsers = Object.values(presenceMap).filter(
    (p) => p.uid !== appUser?.uid
  );

  return { presenceMap, otherUsers, updateActiveCell };
}