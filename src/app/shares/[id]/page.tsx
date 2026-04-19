"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/components/AuthContext";
import { fetchSettingsOnce } from "@/lib/settingsCache";

export default function ShareVerificationPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const { id } = params;
  const router = useRouter();
  const { user, session, profile, loading: authLoading, signOut } = useAuth();
  const [share, setShare] = useState<any>(null);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [issubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [authErrorType, setAuthErrorType] = useState<"not_logged_in" | "wrong_account" | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [company, setCompany] = useState({ name: "portalen" });

  useEffect(() => {
    fetchSettingsOnce().then(data => {
      if (data?.company?.name) setCompany({ name: data.company.name });
    });
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      setMessage({ type: "error", text: "Du måste vara inloggad för att komma åt denna post." });
      setAuthErrorType("not_logged_in");
      return;
    }

    async function fetchShare() {
      try {
        const res = await fetch(`/api/shares?id=${id}`, {
          headers: {
            "Authorization": `Bearer ${session?.access_token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setShare(data);
          if (data.share_url) setUrl(data.share_url);
        } else if (res.status === 403) {
          setMessage({ type: "error", text: "Du är inte inloggad med kontot som äger denna post." });
          setAuthErrorType("wrong_account");
        } else {
          setMessage({ type: "error", text: "Kunde inte hitta delningsposten." });
        }
      } catch (e) {
        setMessage({ type: "error", text: "Ett fel uppstod vid laddning." });
      } finally {
        setLoading(false);
      }
    }
    fetchShare();
  }, [id, authLoading, user, router, session?.access_token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/shares", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ id, share_url: url })
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Din delning har registrerats! Tack för ditt engagemang." });
        setTimeout(() => router.push("/articles"), 3000);
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Kunde inte spara länken." });
      }
    } catch (e) {
      setMessage({ type: "error", text: "Ett tekniskt fel uppstod." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="w-8 h-8 rounded-full border-4 border-brand-teal border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-20">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 pt-[61px] md:pt-[93px]">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
          <button
            onClick={() => router.push('/articles')}
            className="absolute top-6 right-6 w-10 h-10 bg-black/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors z-20 backdrop-blur-sm"
            title="Stäng och gå till nyhetsflödet"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <div className="bg-brand-teal p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <h1 className="text-3xl font-black text-white uppercase italic tracking-tight mb-2">Registrera din delning</h1>
            <p className="text-white/80 text-sm font-medium uppercase tracking-widest">Verifiering av socialt engagemang</p>
          </div>

          <div className="p-10 md:p-14 space-y-8">
            {share && (
              <div className="p-6 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-brand-teal/10 text-brand-teal flex items-center justify-center text-xl">
                    {share.platform === 'facebook' ? '🔵' : share.platform === 'linkedin' ? '🟦' : '📱'}
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Plattform</span>
                    <span className="text-sm font-black text-brand-dark dark:text-white uppercase italic">{share.platform}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  Tack för att du delat {company.name}-portalen! Klistra in den publika länken till ditt inlägg nedan så att vi kan verifiera din delning.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between ml-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Länk till inlägget</label>
                  <button
                    type="button"
                    onClick={() => setShowHelp(!showHelp)}
                    className="text-[10px] font-black text-brand-teal uppercase tracking-widest flex items-center gap-1 hover:underline focus:outline-none"
                  >
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={`w-3 h-3 transition-transform ${showHelp ? 'rotate-180' : ''}`}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                    Hur hittar jag länken?
                  </button>
                </div>

                {showHelp && share && (
                  <div className="mx-2 p-5 rounded-2xl bg-brand-light/30 border border-brand-teal/20 text-xs text-gray-700 dark:text-gray-300 font-medium animate-in fade-in slide-in-from-top-2">
                    <p className="font-bold mb-3">Så här kopierar du länken från <span className="capitalize">{share.platform}</span>:</p>

                    {share.platform.toLowerCase() === 'facebook' ? (
                      <ul className="list-decimal pl-5 space-y-1.5 mb-4">
                        <li>Gå till din profil och leta fram inlägget.</li>
                        <li>Klicka på <strong>tidsstämpeln</strong> (t.ex. &quot;Just nu&quot; eller &quot;2 tim&quot;) precis under ditt namn.</li>
                        <li>Inlägget öppnas på en egen sida. <strong>Kopiera webbadressen (URL:en)</strong> direkt från adressfältet högst upp.</li>
                        <li className="text-[10px] text-gray-500"><em>(På mobilen: Tryck på &quot;Dela&quot; längst ner på inlägget och välj &quot;Kopiera länk&quot;)</em></li>
                      </ul>
                    ) : share.platform.toLowerCase() === 'linkedin' ? (
                      <ul className="list-decimal pl-5 space-y-1.5 mb-4">
                        <li>Hitta inlägget under <em>Aktivitet &gt; Inlägg</em> på din profil.</li>
                        <li>Klicka på de tre prickarna <strong>(...)</strong> uppe till höger på inlägget.</li>
                        <li>Välj <strong>&quot;Kopiera länk till inlägg&quot;</strong>.</li>
                      </ul>
                    ) : share.platform.toLowerCase() === 'x' || share.platform.toLowerCase() === 'twitter' ? (
                      <ul className="list-decimal pl-5 space-y-1.5 mb-4">
                        <li>Leta fram inlägget på din tidslinje.</li>
                        <li>Klicka på <strong>Dela-ikonen</strong> (pil/share) under inlägget.</li>
                        <li>Välj <strong>&quot;Kopiera länk till X/Tweet&quot;</strong>.</li>
                      </ul>
                    ) : (
                      <ul className="list-decimal pl-5 space-y-1.5 mb-4">
                        <li>Öppna inlägget på vald plattform.</li>
                        <li>Leta efter <strong>Dela</strong> eller prickarna <strong>(...)</strong> vid inlägget.</li>
                        <li>Välj <strong>&quot;Kopiera länk&quot;</strong>.</li>
                      </ul>
                    )}

                    <div className="flex gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl mt-4 text-brand-dark dark:text-white font-bold shadow-sm border border-red-500/20">
                      <span className="text-sm">⚠️</span>
                      <p className="text-[10px] leading-relaxed uppercase tracking-widest text-red-600 dark:text-red-400">
                        Viktigt: Ditt inlägg måste vara inställt på <strong>&quot;Offentligt&quot; (Public)</strong> för att länken ska fungera och din delning ska kunna godkännas. Dela aldrig en länk till ett privat inlägg.
                      </p>
                    </div>
                  </div>
                )}

                <input
                  required
                  type="url"
                  placeholder="https://www.social.com/share/..."
                  //value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-brand-teal outline-none transition-all font-bold text-gray-900 dark:text-white"
                />
              </div>

              {message && (
                <div className={`p-5 rounded-2xl font-black text-xs uppercase tracking-widest flex flex-col items-start gap-4 ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                  <span className="leading-relaxed">{message.text}</span>

                  {authErrorType === "not_logged_in" && (
                    <button
                      onClick={(e) => { e.preventDefault(); router.push(`/login?redirect=/shares/${id}`); }}
                      className="px-5 py-2.5 bg-red-700 text-white rounded-xl shadow-md hover:bg-red-800 transition-colors"
                    >
                      Logga in
                    </button>
                  )}
                  {authErrorType === "wrong_account" && (
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        setLoading(true);
                        await signOut();
                        router.push(`/login?redirect=/shares/${id}`);
                      }}
                      className="px-5 py-2.5 bg-red-700 text-white rounded-xl shadow-md hover:bg-red-800 transition-colors"
                    >
                      Logga in som en annan användare
                    </button>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => router.push('/articles')}
                  className="flex-1 py-5 rounded-2xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-black text-sm uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Avbryt
                </button>
                <button
                  disabled={issubmitting || !url || !share}
                  type="submit"
                  className="flex-1 py-5 rounded-2xl bg-brand-teal text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-brand-teal/20 hover:bg-brand-dark transition-all disabled:opacity-50 hover:-translate-y-1 active:translate-y-0"
                >
                  {issubmitting ? "Sparar..." : "Spara"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
