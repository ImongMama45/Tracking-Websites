import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "../lib/api.js";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      access: null,
      refresh: null,
      login: async (email, password) => {
        const { data } = await api.post("/api/v1/auth/login/", { email, password });
        set({ user: data.user, access: data.access, refresh: data.refresh });
      },
      register: async (payload) => {
        const { data } = await api.post("/api/v1/auth/register/", payload);
        set({ user: data.user, access: data.access, refresh: data.refresh });
      },
      loadProfile: async () => {
        if (!get().access) return;
        const { data } = await api.get("/api/v1/auth/profile/");
        set({ user: data });
      },
      logout: () => set({ user: null, access: null, refresh: null })
    }),
    { name: "pelec-auth" }
  )
);
