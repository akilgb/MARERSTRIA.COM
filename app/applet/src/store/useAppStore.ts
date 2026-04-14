import { create } from 'zustand';

interface AppState {
  isExpertMode: boolean;
  toggleExpertMode: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  isCopilotOpen: boolean;
  toggleCopilot: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isExpertMode: false,
  toggleExpertMode: () => set((state) => ({ isExpertMode: !state.isExpertMode })),
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  isCopilotOpen: true, // Open by default to show it off
  toggleCopilot: () => set((state) => ({ isCopilotOpen: !state.isCopilotOpen })),
}));
