"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
const RolesInfoModal = dynamic(() => import("./RolesInfoModal"), { ssr: false });
const MembershipModal = dynamic(() => import("./MembershipModal"), { ssr: false });
import { useAuth } from "./AuthContext";
import { fetchSettingsOnce } from "@/lib/settingsCache";

// ─── Cookie helpers (pure, no side-effects) ──────────────────────────────────
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() ?? null;
  return null;
}

function setCookie(name: string, value: string, minutes: number) {
  const date = new Date();
  date.setTime(date.getTime() + minutes * 60 * 1000);
  document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/; SameSite=Lax`;
}

// ─── Main component (wrapped in Suspense for useSearchParams) ────────────────
function SiteLockContent() {
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ── Settings ─────────────────────────────────────────────────────────────
  const [settings, setSettings] = useState<{
    siteLockActive: boolean;
    onboardingActive: boolean;
    siteCode: string;
    lockTimeoutMinutes: number;
    updatedAt: number;
  } | null>(null);

  // ── Optimistic unlock: read cookie immediately so there is NO flicker ──────
  // We'll validate the timestamp against settings.updatedAt once settings load.
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    if (typeof document === "undefined") return false;
    return getCookie("enzy_site_unlocked") === "true";
  });

  const [isClient, setIsClient] = useState(false);
  const [digits, setDigits] = useState(["", "", ""]);
  const [error, setError] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [selectedRoleForMembership, setSelectedRoleForMembership] =
    useState("Medlem");
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const inputs = useRef<HTMLInputElement[]>([]);
  const CORRECT_CODE = settings?.siteCode || "0000";

  // ── Fetch settings IMMEDIATELY — do NOT wait for auth ────────────────────
  // Auth state is only needed to decide the bypass, not to fetch settings.
  // Using the shared module-level cache means only ONE request is made
  // across SiteLock + Navbar + SocialShare, regardless of render order.
  useEffect(() => {
    setIsClient(true);
    fetchSettingsOnce().then((data) => {
      const s = data?.security ?? {
        siteLockActive: true,
        onboardingActive: true,
        siteCode: "0000",
        lockTimeoutMinutes: 60,
        updatedAt: 0,
      };
      setSettings(s);
      // Reset digits to match the code length
      setDigits(new Array(s.siteCode.length).fill(""));
    });
  }, []); // ← runs exactly ONCE on mount

  // ── Inactivity Tracking ──────────────────────────────────────────────────
  useEffect(() => {
    if (!unlocked || !settings?.siteLockActive) return;

    const resetTimer = () => {
      if (showTimeoutWarning) return; // Kräv explicit knapptryckning, ignorera bakgrundsaktivitet
      setLastActivity(Date.now());
    };

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    events.forEach((name) => document.addEventListener(name, resetTimer));

    return () => {
      events.forEach((name) => document.removeEventListener(name, resetTimer));
    };
  }, [unlocked, settings, showTimeoutWarning]);

  // ── Timeout Logic Loop ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!unlocked || !settings?.siteLockActive || !settings?.lockTimeoutMinutes) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeoutMs = settings.lockTimeoutMinutes * 60 * 1000;
      const elapsed = now - lastActivity;
      
      const remainingMs = timeoutMs - elapsed;
      const remainingSec = Math.ceil(remainingMs / 1000);

      if (remainingSec <= 0) {
        // LOCK SITE
        setUnlocked(false);
        // Clear cookies to prevent simple bypass
        setCookie("enzy_site_unlocked", "false", -1);
        setCookie("enzy_last_unlocked_at", "0", -1);
        setShowTimeoutWarning(false);
        setDigits(new Array(settings.siteCode.length).fill(""));
      } else if (remainingSec <= 30) {
        setShowTimeoutWarning(true);
        setCountdown(remainingSec);
      } else if (showTimeoutWarning) {
        setShowTimeoutWarning(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [unlocked, lastActivity, settings, showTimeoutWarning]);

  // ── Re-evaluate unlock whenever settings, user, or route change ───────────
  useEffect(() => {
    if (!settings) return;

    // Bypass: logged in
    if (user) {
      setUnlocked(true);
      setShowInfoModal(false);
      setShowMembershipModal(false);
      return;
    }

    // Bypass: invite/callback flow
    const isInvite =
      searchParams.get("type") === "invite" ||
      !!searchParams.get("code") ||
      pathname.startsWith("/auth/callback");
    if (isInvite) {
      setUnlocked(true);
      return;
    }

    // Lock is disabled in settings
    if (!settings.siteLockActive) {
      setUnlocked(true);
      return;
    }

    // Lock is enabled — validate cookie timestamp
    const cookieUnlocked = getCookie("enzy_site_unlocked") === "true";
    const lastUnlockedAt = parseInt(
      getCookie("enzy_last_unlocked_at") ?? "0",
      10
    );
    const isValid = cookieUnlocked && lastUnlockedAt >= settings.updatedAt;
    setUnlocked(isValid);

    // ROLLING ACCESS: If valid, refresh the 90 minute timer
    if (isValid) {
      setCookie("enzy_site_unlocked", "true", 90);
      setCookie("enzy_last_unlocked_at", Date.now().toString(), 90);
    }
  }, [pathname, searchParams, user, settings]);

  // ── Onboarding trigger (fires once after unlock, if not dismissed) ────────
  useEffect(() => {
    if (!settings?.onboardingActive || !unlocked || user || authLoading) return;

    const isInvite =
      searchParams.get("type") === "invite" ||
      !!searchParams.get("code") ||
      pathname.startsWith("/auth/callback");
    if (isInvite) return;

    if (getCookie("enzy_hide_role_info") === "true") return;

    const timer = setTimeout(() => setShowInfoModal(true), 300);
    return () => clearTimeout(timer);
  }, [unlocked, settings, pathname, searchParams, user, authLoading]);

  // ── Auto-focus first input when lock appears ──────────────────────────────
  useEffect(() => {
    if (!unlocked && settings?.siteLockActive && isClient) {
      const timer = setTimeout(() => {
        inputs.current[0]?.focus();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [unlocked, settings, isClient]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleUnlock = () => {
    // Set rolling 90 minute access automatically
    setCookie("enzy_site_unlocked", "true", 90);
    setCookie("enzy_last_unlocked_at", Date.now().toString(), 90);
    setUnlocked(true);
    setLastActivity(Date.now());
  };

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    setError(false);
    if (value && index < CORRECT_CODE.length - 1) inputs.current[index + 1].focus();
    if (newDigits.every((d) => d !== "")) {
      if (newDigits.join("") === CORRECT_CODE) handleUnlock();
      else setError(true);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0)
      inputs.current[index - 1].focus();
  };

  const handleApplyRole = (role: string) => {
    setSelectedRoleForMembership(role);
    setShowInfoModal(false);
    setShowMembershipModal(true);
  };

  // ── Render guards ─────────────────────────────────────────────────────────

  // Server-side: render nothing
  if (!isClient) return null;

  // Logged-in users: only render membership modal if relevant
  if (user) {
    if (!showMembershipModal) return null;
    return (
      <MembershipModal
        isOpen={showMembershipModal}
        onClose={() => setShowMembershipModal(false)}
        initialRole={selectedRoleForMembership}
      />
    );
  }

  // Settings not yet loaded: if cookie says unlocked show nothing (no flicker),
  // otherwise show nothing (don't flash the lock before we know settings).
  if (!settings) return null;

  // ── Modals-only block (shown after unlock) ────────────────────────────────
  const modalsOnly = (
    <>
      <AnimatePresence mode="wait">
        {showInfoModal && settings.onboardingActive && (
          <RolesInfoModal
            onClose={() => setShowInfoModal(false)}
            onApply={handleApplyRole}
            isLockActive={settings.siteLockActive}
          />
        )}
      </AnimatePresence>
      <MembershipModal
        isOpen={showMembershipModal}
        onClose={() => setShowMembershipModal(false)}
        initialRole={selectedRoleForMembership}
      />

      {/* Inactivity Warning Modal */}
      <AnimatePresence>
        {showTimeoutWarning && unlocked && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-brand-dark/95 backdrop-blur-2xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl border border-white/10 text-center space-y-8"
            >
              <div className="mx-auto w-24 h-24 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 relative">
                <span className="text-4xl animate-bounce">⏳</span>
                <div className="absolute inset-0 rounded-full border-2 border-amber-500/30 animate-ping" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-brand-dark dark:text-white uppercase italic tracking-tighter">
                  Ditt besök löper ut snart
                </h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] leading-relaxed">
                  På grund av inaktivitet kommer sajten att låsas om:
                </p>
              </div>

              <div className="text-6xl font-black text-brand-teal italic tabular-nums">
                {countdown}s
              </div>

              <div className="flex flex-col gap-4 mt-2">
                <button
                  onClick={() => {
                    setLastActivity(Date.now());
                    setShowTimeoutWarning(false);
                    setCountdown(30);
                  }}
                  className="w-full py-5 rounded-2xl bg-brand-teal text-white font-black text-sm uppercase tracking-widest hover:bg-brand-dark transition-all active:scale-95 shadow-xl shadow-brand-teal/20"
                >
                  Jag är kvar!
                </button>
                <button
                  onClick={() => {
                    setUnlocked(false);
                    setCookie("enzy_site_unlocked", "false", -1);
                    setCookie("enzy_last_unlocked_at", "0", -1);
                    setShowTimeoutWarning(false);
                    setDigits(new Array(settings?.siteCode.length || 0).fill(""));
                  }}
                  className="w-full py-5 rounded-2xl bg-gray-100 dark:bg-slate-800 text-gray-500 font-black text-sm uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                >
                  Lämna sidan
                </button>
              </div>

              <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest italic pt-2">
                Inställt på {settings?.lockTimeoutMinutes} {settings?.lockTimeoutMinutes === 1 ? 'minut' : 'minuter'} av administratören
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  if (unlocked && !showInfoModal && !showMembershipModal && !showTimeoutWarning) return null;
  if (unlocked) return modalsOnly;

  // ── Lock screen ───────────────────────────────────────────────────────────
  // Only reached if lock is active AND not unlocked
  return (
    <>
      <AnimatePresence>
        {!unlocked && settings.siteLockActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-4 bg-[#0a0c10] overflow-hidden"
          >
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div
                className="absolute inset-0 bg-[#0f1218]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 2px 2px, rgba(0, 203, 203, 0.1) 1px, transparent 0)",
                  backgroundSize: "40px 40px",
                }}
              />
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="relative z-10 text-center space-y-12"
            >
              <div className="space-y-4">
                <div className="mx-auto w-24 h-24 rounded-full bg-brand-teal/10 flex items-center justify-center border border-brand-teal/20 mb-8 mt-[-100px]">
                  <span className="text-4xl">🔐</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter">
                  Säkerhetskod
                </h1>
                <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px]">
                  Vänligen ange den {CORRECT_CODE.length}-siffriga koden för tillträde
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2 md:gap-4 max-w-full px-4">
                {digits.map((digit, i) => (
                  <motion.input
                    key={i}
                    ref={(el) => {
                      if (el) inputs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="new-password"
                    value={digit}
                    animate={error ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className={`w-10 h-14 sm:w-14 sm:h-20 md:w-20 md:h-24 bg-[#1a2030] rounded-2xl md:rounded-3xl border-2 text-center text-xl sm:text-2xl md:text-4xl font-black transition-all outline-none ${
                      error
                        ? "border-red-500 text-red-500"
                        : "border-white/5 text-brand-teal focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10"
                    }`}
                  />
                ))}
              </div>

              {error && (
                <motion.p className="text-red-500 text-[10px] font-black uppercase tracking-widest">
                  Felaktig kod. Försök igen.
                </motion.p>
              )}


            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInfoModal && settings.onboardingActive && !user && (
          <RolesInfoModal
            onClose={() => setShowInfoModal(false)}
            onApply={handleApplyRole}
            isLockActive={settings.siteLockActive}
          />
        )}
      </AnimatePresence>

      <MembershipModal
        isOpen={showMembershipModal}
        onClose={() => setShowMembershipModal(false)}
        initialRole={selectedRoleForMembership}
      />
    </>
  );
}

export default function SiteLock() {
  return (
    <Suspense fallback={null}>
      <SiteLockContent />
    </Suspense>
  );
}
