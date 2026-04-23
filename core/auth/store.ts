import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "firebase/auth";

interface AuthState {
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  } | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: true,
      setUser: (user) => set({ 
        user: user ? {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        } : null,
        loading: false 
      }),
      setLoading: (loading) => set({ loading }),
    }),
    {
      name: "motion-auth-storage",
    }
  )
);
