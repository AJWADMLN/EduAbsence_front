/**
 * useDayLock — manages "validated" (locked) dates per etaId.
 *
 * Data is stored in localStorage under the key "dayLocks" as:
 *   { "<etaId>_<YYYY-MM-DD>": true, ... }
 *
 * The directeur "validates" today → locks it.
 * The admin can "unlock" any date for any directeur's etaId.
 */
import { useState, useCallback } from "react";

const STORAGE_KEY = "dayLocks";

function readLocks(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeLocks(locks: Record<string, boolean>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(locks));
}

function makeKey(etaId: number | undefined, date: string): string {
  return `${etaId ?? 0}_${date}`;
}

export function useDayLock() {
  // Keep a state counter so components re-render after lock changes
  const [, setTick] = useState(0);
  const forceUpdate = useCallback(() => setTick(t => t + 1), []);

  const isLocked = useCallback(
    (etaId: number | undefined, date: string): boolean => {
      return !!readLocks()[makeKey(etaId, date)];
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const lockDate = useCallback(
    (etaId: number | undefined, date: string) => {
      const locks = readLocks();
      locks[makeKey(etaId, date)] = true;
      writeLocks(locks);
      forceUpdate();
    },
    [forceUpdate]
  );

  const unlockDate = useCallback(
    (etaId: number | undefined, date: string) => {
      const locks = readLocks();
      delete locks[makeKey(etaId, date)];
      writeLocks(locks);
      forceUpdate();
    },
    [forceUpdate]
  );

  /** Returns all locked dates for a given etaId */
  const getLockedDates = useCallback((etaId: number | undefined): string[] => {
    const prefix = `${etaId ?? 0}_`;
    return Object.keys(readLocks())
      .filter(k => k.startsWith(prefix))
      .map(k => k.slice(prefix.length));
  }, []);

  return { isLocked, lockDate, unlockDate, getLockedDates };
}
