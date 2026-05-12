import { create } from "zustand";
import { api } from "../lib/api.js";

export const useDashboardStore = create((set, get) => ({
  websites: [],
  selectedWebsite: null,
  overview: null,
  traffic: [],
  loading: false,
  period: "30d",
  error: "",
  setPeriod: (period) => set({ period }),
  setSelectedWebsite: (website) => set({ selectedWebsite: website }),
  loadWebsites: async () => {
    try {
      const { data } = await api.get("/websites/");
      const websites = data.results || data;
      set({ websites, selectedWebsite: get().selectedWebsite || websites[0] || null, error: "" });
    } catch (error) {
      set({ error: error.response?.data?.detail || "Unable to load websites." });
      throw error;
    }
  },
  loadOverview: async () => {
    const website = get().selectedWebsite;
    if (!website) return;
    set({ loading: true });
    const period = get().period;
    try {
      const [overview, traffic] = await Promise.all([
        api.get(`/analytics/${website.id}/overview/?period=${period}`),
        api.get(`/analytics/${website.id}/traffic/?period=${period}`)
      ]);
      set({ overview: overview.data, traffic: traffic.data.data || [], loading: false, error: "" });
    } catch (error) {
      set({ loading: false, error: error.response?.data?.detail || "Unable to load analytics." });
      throw error;
    }
  }
}));
