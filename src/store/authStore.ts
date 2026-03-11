import { create } from "zustand";
import { persist } from "zustand/middleware";

const LOCK_AFTER_MS = 5 * 60 * 1000; // 5 minutes

interface AuthState {
  apiKey: string | null;
  lockedAt: number | null;
  login: (key: string) => void;
  lock: () => void;
  isLocked: () => boolean;
  resetTimer: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      apiKey: null,
      lockedAt: null,

      login: (key) => set({ apiKey: key, lockedAt: Date.now() }),

      lock: () => set({ apiKey: null, lockedAt: null }),

      isLocked: () => {
        const { apiKey, lockedAt } = get();
        if (!apiKey || !lockedAt) return true;
        return Date.now() - lockedAt > LOCK_AFTER_MS;
      },

      resetTimer: () => set({ lockedAt: Date.now() }),
    }),
    { name: "quti-auth" }
  )
);
