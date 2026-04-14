import { create } from 'zustand';

interface AppState {
  isExpertMode: boolean;
  toggleExpertMode: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  isCopilotOpen: boolean;
  toggleCopilot: () => void;
  currentSessionId: string | null;
  setCurrentSessionId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isExpertMode: false,
  toggleExpertMode: () => set((state) => ({ isExpertMode: !state.isExpertMode })),
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  isCopilotOpen: false, // Closed by default
  toggleCopilot: () => set((state) => ({ isCopilotOpen: !state.isCopilotOpen })),
  currentSessionId: null,
  setCurrentSessionId: (id) => set({ currentSessionId: id }),
}));
