import { create } from 'zustand';

/**
 * Global App Store for LearnHub Platform
 */
export const useAppStore = create((set) => ({
  appName: 'LearnHub',
  activeModule: 'Module 1: Project Foundation and Initial Setup',
  systemStatus: {
    frontend: 'Running',
    backend: 'Checking...',
    details: null,
  },
  setBackendStatus: (status, details = null) =>
    set((state) => ({
      systemStatus: {
        ...state.systemStatus,
        backend: status,
        details,
      },
    })),
}));
