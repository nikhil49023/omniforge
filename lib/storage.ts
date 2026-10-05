export interface UserSettings {
  groqApiKey: string;
  firecrawlUrl: string;
  model: string;
  useMockFallback: boolean;
}

const STORAGE_KEY = "omniforge_settings_v1";

export const DEFAULT_SETTINGS: UserSettings = {
  groqApiKey: "",
  firecrawlUrl: "http://localhost:3002",
  model: "llama-3.3-70b-versatile",
  useMockFallback: true,
};

export function loadSettings(): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Partial<UserSettings>): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  const current = loadSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save settings", e);
  }
  return updated;
}
