/**
 * Module-level singleton cache for /api/settings.
 *
 * All client components (SiteLock, Navbar, SocialShare, etc.) call
 * `fetchSettingsOnce()`. The actual HTTP request is made exactly ONCE
 * per page load, regardless of how many components ask for it.
 *
 * The cache can be invalidated via `invalidateSettingsCache()` —
 * used by the admin panel after saving new settings.
 */

import { ThemeColors, THEME_PRESETS } from "./themes";

export type PublicSettings = {
  security: {
    inactivityActive: boolean;
    inactivityTimeoutMinutes: number;
    inactivityWarningSeconds: number;
    siteLockActive: boolean;
    onboardingActive: boolean;
    siteCode: string;
    visitorCookieLifetimeValue?: number;
    visitorCookieLifetimeUnit?: "days" | "minutes";
    updatedAt: number;
  };
  company: {
    name: string;
    logoUrl: string;
    description: string;
  };
  theme: {
    mode: "preset" | "custom";
    presetId: string;
    colors: ThemeColors;
  };
  stock: {
    isActive: boolean;
    ticker: string;
    shares: string;
    sector: string;
  };
  facebook: { isActive: boolean };
  instagram: { isActive: boolean };
  linkedin: { isActive: boolean };
  tiktok: { isActive: boolean };
  x: { isActive: boolean };
  translations?: Record<string, any>;
};

let _cache: PublicSettings | null = null;
let _promise: Promise<PublicSettings | null> | null = null;

export function fetchSettingsOnce(): Promise<PublicSettings | null> {
  if (_cache) return Promise.resolve(_cache);
  if (_promise) return _promise;

  _promise = fetch("/api/settings")
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      _cache = data;
      return data as PublicSettings | null;
    })
    .catch(() => null);

  return _promise;
}

/** Call this after the admin saves settings so all components re-fetch. */
export function invalidateSettingsCache() {
  _cache = null;
  _promise = null;
}

export function getSecurityDefaults() {
  return { 
    inactivityActive: true, 
    inactivityTimeoutMinutes: 60,
    inactivityWarningSeconds: 30,
    siteLockActive: false, 
    onboardingActive: true, 
    siteCode: "0000",
    visitorCookieLifetimeValue: 1,
    visitorCookieLifetimeUnit: "days",
    updatedAt: 0,
    company: {
      name: "Enzymatica",
      logoUrl: "/media/logo.png"
    },
    theme: {
      mode: "preset",
      presetId: THEME_PRESETS[0].id,
      colors: THEME_PRESETS[0].colors
    }
  };
}

if (typeof window !== "undefined") {
  window.addEventListener("settingsUpdated", invalidateSettingsCache);
}
