"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import ContactModal from "./ContactModal";


export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("Enzy");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const pathname = usePathname();


  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Profile form state
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem("enzy_auth");
    const storedName = localStorage.getItem("enzy_username");
    if (auth === "true") {
      setIsLoggedIn(true);
      setUsername(storedName || "Enzy");
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const storedPassword = localStorage.getItem("enzy_password") || "Enzy";
    const storedUsername = localStorage.getItem("enzy_username") || "Enzy";
    if (loginUsername === storedUsername && loginPassword === storedPassword) {
      localStorage.setItem("enzy_auth", "true");
      setIsLoggedIn(true);
      setUsername(storedUsername);
      setShowLoginModal(false);
      setLoginUsername("");
      setLoginPassword("");
      setIsMobileMenuOpen(false);
    } else {
      // Fallback: accept original "Enzy"/"Enzy" credentials too
      if (loginUsername === "Enzy" && loginPassword === (localStorage.getItem("enzy_password") || "Enzy")) {
        localStorage.setItem("enzy_auth", "true");
        localStorage.setItem("enzy_username", loginUsername);
        setIsLoggedIn(true);
        setUsername(loginUsername);
        setShowLoginModal(false);
        setLoginUsername("");
        setLoginPassword("");
        setIsMobileMenuOpen(false);
      } else {
        setLoginError("Felaktigt användarnamn eller lösenord.");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("enzy_auth");
    setIsLoggedIn(false);
    setShowProfileModal(false);
    setIsMobileMenuOpen(false);
    // Dispatch event so ArticleFeed also updates
    window.dispatchEvent(new Event("enzy_auth_change"));
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    if (newDisplayName.trim()) {
      localStorage.setItem("enzy_username", newDisplayName.trim());
      setUsername(newDisplayName.trim());
    }
    if (newPassword.trim()) {
      localStorage.setItem("enzy_password", newPassword.trim());
    }
    setProfileMessage({ type: "success", text: "Profilen har uppdaterats!" });
    setNewDisplayName("");
    setNewPassword("");
    setTimeout(() => {
      setProfileMessage(null);
      setShowProfileModal(false);
      setIsMobileMenuOpen(false);
    }, 1500);
  };

  const openProfile = () => {
    setNewDisplayName(username);
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
            <div className="hidden md:flex items-center space-x-2">
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

              <div className="pl-4 border-l border-gray-200 dark:border-gray-800 ml-2">
                {isLoggedIn ? (
                  <button
                    onClick={openProfile}
                    className="bg-brand-teal/10 hover:bg-brand-teal/20 text-brand-teal px-5 py-2.5 rounded-full font-bold transition-all text-sm uppercase tracking-widest flex items-center gap-2"
                  >
                    <span className="w-5 h-5 rounded-full bg-brand-teal text-white text-[10px] font-black flex items-center justify-center">
                      {username.charAt(0).toUpperCase()}
                    </span>
                    {username}
                  </button>
                ) : (
                  <button
                    onClick={() => { setShowLoginModal(true); setLoginError(""); }}
                    className="bg-brand-teal/10 hover:bg-brand-teal/20 text-brand-teal px-5 py-2.5 rounded-full font-bold transition-all text-sm uppercase tracking-widest"
                  >
                     Logga in
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center">
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
        <div className={`md:hidden absolute top-20 left-0 w-full bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 shadow-2xl transition-all duration-300 ease-in-out transform origin-top ${isMobileMenuOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 pointer-events-none'}`}>
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
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex flex-col space-y-4">
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
                <button
                  onClick={() => { setShowLoginModal(true); setLoginError(""); setIsMobileMenuOpen(false); }}
                  className="w-full bg-brand-light text-brand-teal px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-left"
                >
                  Logga in
                </button>
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
                  type="text"
                  value={loginUsername}
                  onChange={e => setLoginUsername(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all font-bold text-gray-900 dark:text-white"
                  placeholder="Enzy"
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
              <p className="text-center text-xs text-gray-400 font-medium pt-1">Endast för behörig personal.</p>
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
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-brand-dark px-10 py-10 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-teal/20 rounded-full blur-3xl -mr-10 -mt-10" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-brand-teal/30 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-brand-teal/50">
                  <span className="text-3xl font-black text-white">{username.charAt(0).toUpperCase()}</span>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">{username}</h2>
                <p className="text-white/60 mt-1 text-sm font-medium">Enzymatica Admin</p>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xl font-black transition-all"
              >
                ×
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleProfileSave} className="p-8 space-y-5">
              {profileMessage && (
                <div className={`p-3 rounded-xl text-sm font-bold border ${profileMessage.type === "success" ? "bg-green-50 dark:bg-green-900/30 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
                  {profileMessage.text}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nytt visningsnamn</label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={e => setNewDisplayName(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all font-bold text-gray-900 dark:text-white"
                  placeholder={username}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nytt lösenord</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all font-bold text-gray-900 dark:text-white"
                  placeholder="Lämna tomt för att behålla"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-brand-teal hover:bg-brand-dark text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg transition-all"
              >
                Spara ändringar
              </button>
              <Link
                href="/admin/settings"
                onClick={() => { setShowProfileModal(false); setIsMobileMenuOpen(false); }}
                className="w-full bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all border border-gray-100 dark:border-slate-800 flex items-center justify-center gap-2"
              >
                <span>⚙️</span> Inställningar
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-600 dark:text-red-400 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all border border-red-100 dark:border-red-800/50"
              >
                Logga ut
              </button>
            </form>
          </div>
        </div>
      )}

      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        isLoggedIn={isLoggedIn}
      />
    </>

  );
}
