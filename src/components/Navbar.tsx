"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import ContactModal from "./ContactModal";
import StockTicker from "./StockTicker";
import StockChartModal from "./StockChartModal";
import { useAuth } from "./AuthContext";
import { supabase } from "@/lib/supabase";
import MembershipModal from "./MembershipModal";

export default function Navbar() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const isLoggedIn = !!user;
  const username = profile?.display_name || user?.email?.split("@")[0] || "Användare";

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [showStockChart, setShowStockChart] = useState(false);
  const pathname = usePathname();

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Profile form state
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newLinkedinUrl, setNewLinkedinUrl] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [tickerSymbol, setTickerSymbol] = useState("ENZY.ST");
  const [isTickerActive, setIsTickerActive] = useState(true);

  const fetchSettings = () => {
    fetch("/api/settings")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.stock?.ticker) {
          setTickerSymbol(data.stock.ticker);
          setIsTickerActive(data.stock.isActive ?? true);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchSettings();

    // Listen for settings updates from Admin
    const handleUpdate = () => fetchSettings();
    window.addEventListener('settingsUpdated', handleUpdate);
    return () => window.removeEventListener('settingsUpdated', handleUpdate);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      setLoginError("Felaktigt e-post eller lösenord.");
    } else {
      setShowLoginModal(false);
      setLoginEmail("");
      setLoginPassword("");
      setIsMobileMenuOpen(false);
      window.dispatchEvent(new Event("enzy_auth_change"));
    }
  };

  const handleLogout = async () => {
    await signOut();
    setShowProfileModal(false);
    setIsMobileMenuOpen(false);
    window.dispatchEvent(new Event("enzy_auth_change"));
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);

    if (!user) return;

    try {
      const trimmedName = newDisplayName.trim();

      // Update profile via server-side API (bypasses Supabase RLS)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Ingen aktiv session.");

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          display_name: newDisplayName.trim(),
          full_name: newFullName.trim(),
          company: newCompany.trim(),
          phone: newPhone.trim(),
          linkedin_url: newLinkedinUrl.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Kunde inte uppdatera profilen.");
      }

      // Password update goes through Supabase Auth directly (not affected by RLS)
      if (newPassword.trim()) {
        const { error } = await supabase.auth.updateUser({ password: newPassword.trim() });
        if (error) throw error;
      }

      setProfileMessage({ type: "success", text: "Profilen har uppdaterats!" });
      setNewPassword("");
      // Re-fetch profile from DB so navbar name updates immediately
      await refreshProfile();
      setTimeout(() => {
        setProfileMessage(null);
        setShowProfileModal(false);
      }, 1500);
    } catch (err: any) {
      setProfileMessage({ type: "error", text: err.message || "Ett fel uppstod." });
    }
  };

  const openProfile = () => {
    setNewDisplayName(profile?.display_name || "");
    setNewFullName(profile?.full_name || "");
    setNewCompany(profile?.company || "");
    setNewPhone(profile?.phone || "");
    setNewLinkedinUrl(profile?.linkedin_url || "");
    setNewPassword("");
    setProfileMessage(null);
    setShowProfileModal(true);
  };

  return (
    <>
      <nav className="fixed top-0 w-full z-50 glassmorphism border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-3">
                <Image src="/logo.png" alt="Enzymatica" width={80} height={80} className="object-contain" />
                <span className="text-2xl font-bold text-brand-dark dark:text-white tracking-tight">
                  Enzymatica
                </span>
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-2">
              <Link
                href="/"
                className={`px-5 py-2.5 rounded-full font-bold transition-all text-sm uppercase tracking-widest ${pathname === "/" ? "bg-brand-teal text-white shadow-lg shadow-brand-teal/20" : "text-gray-600 dark:text-gray-300 hover:text-brand-teal hover:bg-brand-light dark:hover:bg-slate-800"}`}
              >
                Hem
              </Link>
              <Link
                href="/articles"
                className={`px-5 py-2.5 rounded-full font-bold transition-all text-sm uppercase tracking-widest ${pathname.startsWith("/articles") ? "bg-brand-teal text-white shadow-lg shadow-brand-teal/20" : "text-gray-600 dark:text-gray-300 hover:text-brand-teal hover:bg-brand-light dark:hover:bg-slate-800"}`}
              >
                Nyheter
              </Link>
              <Link
                href="/investerare"
                className={`px-5 py-2.5 rounded-full font-bold transition-all text-sm uppercase tracking-widest ${pathname.startsWith("/investerare") ? "bg-brand-teal text-white shadow-lg shadow-brand-teal/20" : "text-gray-600 dark:text-gray-300 hover:text-brand-teal hover:bg-brand-light dark:hover:bg-slate-800"}`}
              >
                Investerare
              </Link>
              <button
                onClick={() => setShowContactModal(true)}
                className={`px-5 py-2.5 rounded-full font-bold transition-all text-sm uppercase tracking-widest ${showContactModal ? "bg-brand-teal text-white shadow-lg shadow-brand-teal/20" : "text-gray-600 dark:text-gray-300 hover:text-brand-teal hover:bg-brand-light dark:hover:bg-slate-800"}`}
              >
                Kontakt
              </button>

              {isLoggedIn && profile?.role === "Partner" && (
                <Link
                  href="/partner"
                  className={`px-5 py-2.5 rounded-full font-bold transition-all text-sm uppercase tracking-widest ${pathname.startsWith("/partner") ? "bg-brand-teal text-white shadow-lg shadow-brand-teal/20" : "text-brand-teal bg-brand-teal/10 hover:bg-brand-teal hover:text-white"}`}
                >
                  Partner Portal
                </Link>
              )}

              <div className="pl-4 border-l border-gray-200 dark:border-gray-800 ml-2 flex items-center gap-2">
                {isLoggedIn && (profile?.role === "Admin" || profile?.role === "Editor" || profile?.role === "Redaktör") && (
                  <div className="relative">
                    <button
                      onClick={() => setShowAdminMenu(!showAdminMenu)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${showAdminMenu ? 'bg-brand-teal text-white shadow-lg shadow-brand-teal/20' : 'bg-gray-50 dark:bg-slate-800 text-gray-400 hover:text-brand-teal hover:bg-brand-teal/10'}`}
                      title="Adminverktyg"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={`w-5 h-5 transition-transform duration-500 ${showAdminMenu ? 'rotate-90' : ''}`}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>

                    {showAdminMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowAdminMenu(false)} />
                        <div className="absolute right-0 mt-4 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                          {profile?.role === "Admin" && (
                            <>
                              <Link
                                href="/admin/users"
                                onClick={() => setShowAdminMenu(false)}
                                className="flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-brand-light dark:hover:bg-slate-800 hover:text-brand-teal transition-colors"
                              >
                                <span className="text-lg">👥</span>
                                Användare
                              </Link>
                              <Link
                                href="/admin/shares"
                                onClick={() => setShowAdminMenu(false)}
                                className="flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-brand-light dark:hover:bg-slate-800 hover:text-brand-teal transition-colors"
                              >
                                <span className="text-lg">📢</span>
                                Delningar
                              </Link>
                            </>
                          )}
                          <Link
                            href="/admin/settings"
                            onClick={() => setShowAdminMenu(false)}
                            className="flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-brand-light dark:hover:bg-slate-800 hover:text-brand-teal transition-colors"
                          >
                            <span className="text-lg">⚙️</span>
                            Inställningar
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {isLoggedIn ? (
                  <div className="flex items-center gap-1 group/nav">
                    <button
                      onClick={openProfile}
                      className="bg-brand-teal/10 hover:bg-brand-teal/20 text-brand-teal px-4 py-2.5 rounded-full font-bold transition-all text-sm uppercase tracking-widest flex items-center gap-2"
                    >
                      <span className="w-5 h-5 rounded-full bg-brand-teal text-white text-[10px] font-black flex items-center justify-center">
                        {username.charAt(0).toUpperCase()}
                      </span>
                      {username}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover/nav:opacity-100"
                      title="Logga ut"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setShowLoginModal(true); setLoginError(""); }}
                    className="bg-brand-teal/10 hover:bg-brand-teal/20 text-brand-teal px-5 py-2.5 rounded-full font-bold transition-all text-sm uppercase tracking-widest"
                  >
                    Logga in
                  </button>
                )}
              </div>
              {isTickerActive && (
                <StockTicker
                  onOpenChart={() => setShowStockChart(true)}
                  ticker={tickerSymbol}
                  className="hidden lg:flex ml-4"
                />
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex lg:hidden items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-600 dark:text-gray-300 hover:text-brand-teal p-2 focus:outline-none"
              >
                <div className="w-6 h-5 relative flex flex-col justify-between overflow-hidden">
                  <span className={`w-full h-0.5 bg-current rounded-full transition-all duration-300 transform ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                  <span className={`w-full h-0.5 bg-current rounded-full transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0 translate-x-3' : ''}`} />
                  <span className={`w-full h-0.5 bg-current rounded-full transition-all duration-300 transform ${isMobileMenuOpen ? '-rotate-45 -translate-y-2.5' : ''}`} />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        <div className={`lg:hidden absolute top-20 left-0 w-full bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 shadow-2xl transition-all duration-300 ease-in-out transform origin-top ${isMobileMenuOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 pointer-events-none'}`}>
          <div className="px-6 py-8 space-y-6">
            <div className="flex flex-col space-y-4">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`p-4 rounded-2xl text-lg font-bold transition-all flex items-center gap-4 ${pathname === "/" ? "bg-brand-light text-brand-teal" : "text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800"}`}
              >
                Hem
              </Link>
              <Link
                href="/articles"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`p-4 rounded-2xl text-lg font-bold transition-all flex items-center gap-4 ${pathname.startsWith("/articles") ? "bg-brand-light text-brand-teal" : "text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800"}`}
              >
                Nyheter
              </Link>
              <Link
                href="/investerare"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`p-4 rounded-2xl text-lg font-bold transition-all flex items-center gap-4 ${pathname.startsWith("/investerare") ? "bg-brand-light text-brand-teal" : "text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800"}`}
              >
                Investerare
              </Link>
              <button
                onClick={() => { setShowContactModal(true); setIsMobileMenuOpen(false); }}
                className={`p-4 rounded-2xl text-lg font-bold transition-all flex items-center gap-4 text-left ${showContactModal ? "bg-brand-light text-brand-teal" : "text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800"}`}
              >
                Kontakt
              </button>

              {isTickerActive && (
                <div className="pt-2 pb-4">
                  <StockTicker
                    onOpenChart={() => { setShowStockChart(true); setIsMobileMenuOpen(false); }}
                    ticker={tickerSymbol}
                    className="flex !w-full"
                  />
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex flex-col space-y-4">
              {isLoggedIn && (profile?.role === "Admin" || profile?.role === "Editor" || profile?.role === "Redaktör") && (
                <div className="grid grid-cols-3 gap-3 mb-2">
                  {profile?.role === "Admin" && (
                    <>
                      <Link
                        href="/admin/users"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-brand-teal/5 text-brand-teal font-black text-[9px] uppercase tracking-widest border border-brand-teal/10 active:bg-brand-teal active:text-white transition-all text-center"
                      >
                        <span className="text-xl mb-1">👥</span>
                        Användare
                      </Link>
                      <Link
                        href="/admin/shares"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-brand-teal/5 text-brand-teal font-black text-[9px] uppercase tracking-widest border border-brand-teal/10 active:bg-brand-teal active:text-white transition-all text-center"
                      >
                        <span className="text-xl mb-1">📢</span>
                        Delningar
                      </Link>
                    </>
                  )}
                  <Link
                    href="/admin/settings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 font-black text-[9px] uppercase tracking-widest border border-gray-100 dark:border-slate-800 active:bg-brand-teal active:text-white transition-all text-center"
                  >
                    <span className="text-xl mb-1">⚙️</span>
                    Inställningar
                  </Link>
                </div>
              )}
              {isLoggedIn ? (
                <button
                  onClick={() => { openProfile(); setIsMobileMenuOpen(false); }}
                  className="w-full bg-brand-teal/10 text-brand-teal px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-brand-teal text-white flex items-center justify-center">
                      {username.charAt(0).toUpperCase()}
                    </span>
                    <span>{username}</span>
                  </div>
                  <span className="text-brand-teal/40">Profil &rarr;</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => { setShowMembershipModal(true); setIsMobileMenuOpen(false); }}
                    className="w-full bg-brand-teal text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-left shadow-lg shadow-brand-teal/20"
                  >
                    Ansök om medlemskap
                  </button>
                  <button
                    onClick={() => { setShowLoginModal(true); setLoginError(""); setIsMobileMenuOpen(false); }}
                    className="w-full bg-brand-light text-brand-teal px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-left"
                  >
                    Logga in
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Login Lightbox ── */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={(e) => { if (e.target === e.currentTarget) setShowLoginModal(false); }}
        >
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-brand-dark px-10 py-10 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-teal/20 rounded-full blur-3xl -mr-10 -mt-10" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-5 border border-white/20">
                  <Image src="/logo.png" alt="Enzymatica" width={32} height={32} className="opacity-80" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">Logga in</h2>
                <p className="text-white/60 mt-1 text-sm font-medium">Enzymatica Admin</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="p-8 space-y-5">
              {loginError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-sm font-bold">
                  {loginError}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Användarnamn</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all font-bold text-gray-900 dark:text-white"
                  placeholder="din@e-post.se"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lösenord</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all font-bold text-gray-900 dark:text-white"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-brand-teal hover:bg-brand-dark text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg transition-all mt-2"
              >
                Logga in
              </button>
              <div className="pt-4 border-t border-gray-100 dark:border-slate-800 mt-4 text-center">
                <p className="text-xs text-gray-400 font-medium mb-3">Saknar du konto?</p>
                <button
                  type="button"
                  onClick={() => { setShowLoginModal(false); setShowMembershipModal(true); }}
                  className="text-brand-teal text-xs font-black uppercase tracking-widest hover:underline"
                >
                  Ansök om medlemskap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Profile Lightbox ── */}
      {showProfileModal && (
        <div
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={(e) => { if (e.target === e.currentTarget) setShowProfileModal(false); }}
        >
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-brand-dark px-6 py-4 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-teal/20 rounded-full blur-3xl -mr-10 -mt-10" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-brand-teal/30 rounded-full flex items-center justify-center mx-auto mb-1 border-2 border-brand-teal/50">
                  <span className="text-xl font-black text-white">{username.charAt(0).toUpperCase()}</span>
                </div>
                <h2 className="text-xl font-black text-white tracking-tight leading-tight">{username}</h2>
                <p className="text-white/60 text-sm font-medium leading-tight">{profile?.role || "Medlem"}</p>
                <span className={`text-[10px] font-black uppercase tracking-widest ${profile?.membership_status === 'Approved' ? 'text-green-500' : 'text-orange-500'}`}>
                  {profile?.membership_status === 'Approved' ? 'Verifierad' : 'Väntar på godkännande'}
                </span>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/30 text-white flex items-center justify-center text-xl font-black transition-all hover:scale-110 active:scale-95 z-20"
              >
                ×
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleProfileSave} className="p-6 space-y-4">
              {profileMessage && (
                <div className={`p-4 rounded-2xl text-sm font-bold border animate-in slide-in-from-top duration-300 ${profileMessage.type === "success" ? "bg-green-50 dark:bg-green-900/40 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300" : "bg-red-50 dark:bg-red-900/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"}`}>
                  {profileMessage.text}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Visningsnamn</label>
                  <input
                    type="text"
                    value={newDisplayName}
                    onChange={e => setNewDisplayName(e.target.value)}
                    className="w-full px-6 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-transparent focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all font-bold text-gray-900 dark:text-white"
                    placeholder="Välj ett namn..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Fullständigt namn</label>
                  <input
                    type="text"
                    value={newFullName}
                    onChange={e => setNewFullName(e.target.value)}
                    className="w-full px-6 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-transparent focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all font-bold text-gray-900 dark:text-white"
                    placeholder="För- och efternamn..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Företag / Organisation</label>
                  <input
                    type="text"
                    value={newCompany}
                    onChange={e => setNewCompany(e.target.value)}
                    className="w-full px-6 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-transparent focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all font-bold text-gray-900 dark:text-white"
                    placeholder="Din arbetsplats..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Telefonnummer</label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="w-full px-6 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-transparent focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all font-bold text-gray-900 dark:text-white"
                    placeholder="070-000 00 00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">LinkedIn URL</label>
                  <input
                    type="url"
                    value={newLinkedinUrl}
                    onChange={e => setNewLinkedinUrl(e.target.value)}
                    className="w-full px-6 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-transparent focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all font-bold text-gray-900 dark:text-white"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Byt lösenord</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-6 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-transparent focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all font-bold text-gray-900 dark:text-white"
                    placeholder="Minst 6 tecken..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-600 dark:text-red-400 px-6 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-red-100 dark:border-red-800/50"
                >
                  Logga ut
                </button>
                <div className="flex-1"></div>
                <button
                  type="submit"
                  className="bg-brand-teal hover:bg-brand-dark text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.1em] shadow-lg shadow-brand-teal/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Spara ändringar
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      <MembershipModal
        isOpen={showMembershipModal}
        onClose={() => setShowMembershipModal(false)}
      />

      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        canEdit={profile?.role === "Admin" || profile?.role === "Editor" || profile?.role === "Redaktör"}
      />

      <StockChartModal
        isOpen={showStockChart}
        onClose={() => setShowStockChart(false)}
        ticker={tickerSymbol}
      />
    </>

  );
}
