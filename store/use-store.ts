import { create } from "zustand";
import { Store, MOCK_STORES } from "../lib/mock-data";

interface AppState {
  isSidebarOpen: boolean;
  stores: Store[];
  toggleSidebar: () => void;
  closeSidebar: () => void;
  addStore: (store: Store) => void;
}

export const useStore = create<AppState>((set) => ({
  isSidebarOpen: false,
  stores: MOCK_STORES,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  closeSidebar: () => set({ isSidebarOpen: false }),
  addStore: (store) => set((state) => ({ stores: [store, ...state.stores] })),
}));
