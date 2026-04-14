"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/lib/supabase";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/articles";
  const { user, loading } = useAuth();

  // Check if already logged in
  // Check if already logged in via Supabase
  useEffect(() => {
    if (!loading && user) {
      router.push(redirectUrl);
    }
  }, [user, loading, router, redirectUrl]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Felaktig e-post eller lösenord.");
    } else {
      window.dispatchEvent(new Event("enzy_auth_change"));
      router.push(redirectUrl);
      router.refresh();
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden transform hover:scale-[1.01] transition-all duration-300">
        
        {/* Header */}
        <div className="bg-brand-dark px-8 py-5 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-teal/20 rounded-full blur-3xl -mr-8 -mt-8"></div>
          <div className="relative z-10 flex items-center justify-center gap-4">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 shrink-0">
              <Image src="/logo.png" alt="Enzymatica" width={20} height={20} className="opacity-80" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-black text-white tracking-tight">Logga in</h1>
              <p className="text-brand-light/60 text-xs font-medium">Enzymatica-portalen</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="px-8 py-6 space-y-3">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-shake">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-postadress</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all text-sm font-bold"
              placeholder="din.epost@exempel.se"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Lösenord</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all text-sm font-bold"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-brand-teal hover:bg-brand-dark text-white py-3 rounded-xl text-sm font-black shadow-lg shadow-brand-teal/20 transform active:scale-95 transition-all mt-2 uppercase tracking-widest"
          >
            Logga in
          </button>
        </form>

        <div className="px-8 pb-5 text-center text-xs font-medium">
          <p className="text-gray-400 mb-1">Saknar du konto?</p>
          <button 
            type="button" 
            onClick={() => router.push('/')} 
            className="text-brand-teal font-black uppercase tracking-widest hover:underline"
          >
            Klicka här för att ansöka
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-brand-teal border-t-transparent animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
