"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const { profile, loading: authLoading } = useAuth();
  const [strategy, setStrategy] = useState("comment");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    
    if (profile?.role !== 'Admin') {
      router.push("/articles");
      return;
    }

    // Fetch current settings with auth
    const fetchSettings = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch("/api/settings", {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.facebookPostStrategy) {
            setStrategy(data.facebookPostStrategy);
          }
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [profile, authLoading, router]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMessage({ type: "error", text: "Din session har gått ut. Logga in igen." });
        return;
      }

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ facebookPostStrategy: strategy })
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Inställningarna har sparats!" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errData = await res.json();
        setMessage({ type: "error", text: errData.error || "Kunde inte spara inställningarna." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Kunde inte spara inställningarna." });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 text-brand-teal font-black uppercase tracking-widest animate-pulse">
        Laddar inställningar...
      </div>
    );
  }

  if (profile?.role !== 'Admin') return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-12 md:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link 
          href="/admin" 
          className="inline-flex items-center gap-2 text-brand-teal font-black text-[10px] uppercase tracking-widest mb-12 hover:gap-4 transition-all"
        >
          <span>&larr;</span> Tillbaka till admin
        </Link>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800">
          {/* Header */}
          <div className="bg-brand-dark px-10 py-16 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-teal/20 rounded-full blur-3xl -mr-20 -mt-20" />
            <div className="relative z-10">
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase italic mb-4">
                Portalinställningar
              </h1>
              <p className="text-white/60 text-lg font-medium max-w-md mx-auto">
                Hantera hur Enzymatica-portalen interagerar med externa kanaler.
              </p>
            </div>
          </div>

          <div className="p-10 md:p-16 space-y-12">
            {/* Facebook Strategy */}
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-brand-dark dark:text-white uppercase italic tracking-tight">Facebook Post-strategi</h2>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">Välj hur artiklar ska visas på Facebook-sidan.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Option 1: Comment Strategy */}
                <button
                  onClick={() => setStrategy("comment")}
                  className={`relative p-8 rounded-[2rem] border-2 text-left transition-all duration-300 ${strategy === "comment" ? "border-brand-teal bg-brand-teal/5 shadow-xl shadow-brand-teal/10" : "border-gray-100 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"}`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <span className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${strategy === "comment" ? "border-brand-teal bg-brand-teal text-white" : "border-gray-200 dark:border-slate-800"}`}>
                      {strategy === "comment" ? "✓" : ""}
                    </span>
                    <span className="text-[10px] font-black text-brand-teal uppercase tracking-widest">Rekommenderad</span>
                  </div>
                  <h3 className="text-xl font-black text-brand-dark dark:text-white mb-2 uppercase italic">Länk i kommentar</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    Postar en stor bild med din korta text. Länken läggs i en separat kommentar. Bäst för räckvidd.
                  </p>
                </button>

                {/* Option 2: Direct Link */}
                <button
                  onClick={() => setStrategy("direct")}
                  className={`relative p-8 rounded-[2rem] border-2 text-left transition-all duration-300 ${strategy === "direct" ? "border-brand-teal bg-brand-teal/5 shadow-xl shadow-brand-teal/10" : "border-gray-100 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"}`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <span className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${strategy === "direct" ? "border-brand-teal bg-brand-teal text-white" : "border-gray-200 dark:border-slate-800"}`}>
                      {strategy === "direct" ? "✓" : ""}
                    </span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Enkel</span>
                  </div>
                  <h3 className="text-xl font-black text-brand-dark dark:text-white mb-2 uppercase italic">Direkt länkpost</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    Hela inlägget blir en klickbar länk. Facebook hämtar bild/titel automatiskt.
                  </p>
                </button>
              </div>
            </section>

            {message && (
              <div className={`p-6 rounded-2xl font-bold flex items-center gap-4 animate-in slide-in-from-top-4 duration-300 ${message.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
                <span className="text-xl">{message.type === "success" ? "✅" : "⚠️"}</span>
                {message.text}
              </div>
            )}

            <div className="pt-8 border-t border-gray-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-12 py-5 rounded-2xl bg-brand-teal text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-brand-teal/20 hover:bg-brand-dark hover:-translate-y-1 transition-all disabled:opacity-50 disabled:translate-y-0"
              >
                {isSaving ? "Sparar..." : "Spara inställningar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
