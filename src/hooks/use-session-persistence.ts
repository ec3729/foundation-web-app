const STORAGE_KEY = "wtc_canvassing_session";

export interface PersistedSessionState {
  currentStep: "welcome" | "zoneSelection" | "canvassing" | "complete";
  volunteerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    organization: string;
  };
  selectedZones: number[];
  currentZone: number | null;
  currentStorefrontIndex: number;
  currentBusinessIndexWithinStorefront: number;
  corrections: Record<string, any>;
  correctionsCount: number;
  progress: { completed: number; total: number };
  volunteerData: any;
  internalSessionId: number | null;
  sessionId: string | null;
  sessionStartTime: string | null;
  sessionStartTimeSet: boolean;
  savedAt: number;
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function saveSession(state: Omit<PersistedSessionState, "savedAt">) {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    try {
      const data: PersistedSessionState = { ...state, savedAt: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save session:", e);
    }
  }, 300);
}

export function loadSession(): PersistedSessionState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PersistedSessionState;
    // Only restore if saved within the last 24 hours
    if (Date.now() - data.savedAt > 24 * 60 * 60 * 1000) {
      clearSession();
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}
