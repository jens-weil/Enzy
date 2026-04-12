"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const { profile, loading: authLoading } = useAuth();
  const [facebook, setFacebook] = useState({ isActive: true, postStrategy: "comment", pageId: "", accessToken: "", appId: "" });
  const [instagram, setInstagram] = useState({ isActive: false, accountId: "", accessToken: "" });
  const [linkedin, setLinkedin] = useState({ isActive: false, authorUrn: "", accessToken: "" });
  const [tiktok, setTiktok] = useState({ isActive: false, openId: "", accessToken: "" });
  const [x, setX] = useState({ isActive: false, accessToken: "" });
  const [stock, setStock] = useState({ ticker: "ENZY.ST" });
  
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
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
          if (data.facebook) setFacebook(prev => ({ ...prev, ...data.facebook }));
          if (data.instagram) setInstagram(prev => ({ ...prev, ...data.instagram }));
          if (data.linkedin) setLinkedin(prev => ({ ...prev, ...data.linkedin }));
          if (data.tiktok) setTiktok(prev => ({ ...prev, ...data.tiktok }));
          if (data.x) setX(prev => ({ ...prev, ...data.x }));
          if (data.stock) setStock(prev => ({ ...prev, ...data.stock }));
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
        body: JSON.stringify({ facebook, instagram, linkedin, tiktok, x, stock })
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
            {/* Social Media Accordions */}
            {[
              {
                id: "facebook",
                title: "Facebook",
                subtitle: "Inställningar för Facebook-publicering",
                state: facebook,
                setter: setFacebook,
                icon: (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                ),
                color: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30"
              },
              {
                id: "instagram",
                title: "Instagram",
                subtitle: "API-åtkomst för Instagram",
                state: instagram,
                setter: setInstagram,
                icon: (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.984 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.058.935 20.39.522 19.6 0.31c.296-.058 1.636-.261 2.913-.072C15.667 0.015 15.26 0 12 0zm0 2.16c3.203 0 3.58.016 4.85.074 1.17.054 1.802.249 2.227.415.562.217.96.477 1.381.896.419.42.679.819.896 1.381.166.425.361 1.057.415 2.227.058 1.27.074 1.647.074 4.85s-.016 3.58-.074 4.85c-.054 1.17-.249 1.802-.415 2.227-.217.562-.477.96-.896 1.381-.42.419-.819.679-1.381.896-.425.166-1.057.361-2.227.415-1.27.058-1.647.074-4.85.074s-3.58-.016-4.85-.074c-1.17-.054-1.802-.249-2.227-.415-.562-.217-.96-.477-1.381-.896-.419-.42-.679-.819-.896-1.381-.166-.425-.361-1.057-.415-2.227C2.176 15.58 2.16 15.203 2.16 12s.016-3.58.074-4.85c.054-1.17.249-1.802.415-2.227.217-.562.477-.96.896-1.381.42-.419.819-.679 1.381-.896.425-.166 1.057-.361 2.227-.415 1.27-.058 1.647-.074 4.85-.074zm0 3.678c-3.413 0-6.162 2.748-6.162 6.162 0 3.413 2.749 6.162 6.162 6.162 3.413 0 6.162-2.749 6.162-6.162 0-3.414-2.749-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.645-1.44-1.44 0-.794.645-1.439 1.44-1.439.794 0 1.44.645 1.44 1.439z"/>
                  </svg>
                ),
                color: "text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-900/30"
              },
              {
                id: "linkedin",
                title: "LinkedIn",
                subtitle: "Inte ännu lanserad",
                state: linkedin,
                setter: setLinkedin,
                icon: (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/>
                  </svg>
                ),
                color: "text-blue-700 dark:text-blue-500 bg-blue-50 dark:bg-blue-900/40"
              },
              {
                id: "tiktok",
                title: "TikTok",
                subtitle: "Inte ännu lanserad",
                state: tiktok,
                setter: setTiktok,
                icon: (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.536.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.12-3.44-3.17-3.61-5.46-.02-.84.05-1.68.27-2.48.5-1.65 1.63-3.08 3.13-3.86 1.48-.75 3.2-.88 4.79-.44.62.19 1.2.49 1.73.86.01-1.37-.02-2.74.02-4.11-.79-.31-1.63-.44-2.48-.41-1.74.01-3.48.51-4.91 1.51-1.89 1.34-3.16 3.44-3.32 5.76-.11 1.79.44 3.59 1.5 5.01 1.19 1.59 2.99 2.62 4.96 2.89 1.83.25 3.73-.02 5.3-1.07 1.96-1.29 3.24-3.41 3.4-5.76.08-3.02.02-6.04.03-9.06z"/>
                  </svg>
                ),
                color: "text-black dark:text-white bg-gray-200 dark:bg-gray-800"
              },
              {
                id: "x",
                title: "X (Twitter)",
                subtitle: "Dela på X",
                state: x,
                setter: setX,
                icon: (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.294 19.497h2.039L6.482 3.239H4.293l13.314 17.411z"/>
                  </svg>
                ),
                color: "text-black dark:text-white bg-gray-200 dark:bg-gray-800"
              },
              {
                id: "stock",
                title: "Marknad & Aktie",
                subtitle: "Styr vilken aktiesymbol som visas",
                state: { isActive: true }, // Always consider active for layout
                setter: (val: any) => {}, // Dummy setter to satisfy TS
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18" />
                  </svg>
                ),
                color: "text-brand-teal bg-brand-light dark:bg-brand-teal/20"
              }
            ].map((channel, i) => (
              <section key={channel.id} className="border border-gray-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 transition-all">
                {/* Header / Accordion trigger */}
                <div 
                  onClick={() => setExpandedSection(expandedSection === channel.id ? null : channel.id)}
                  className={`flex items-center justify-between p-6 md:p-8 cursor-pointer transition-all ${channel.state.isActive ? 'bg-white dark:bg-slate-900' : 'bg-gray-50/50 dark:bg-slate-900/50 opacity-80'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${channel.state.isActive ? channel.color : 'bg-gray-100 text-gray-400 dark:bg-slate-800'}`}>
                      {channel.icon}
                    </div>
                    <div>
                      <h2 className={`text-xl font-black uppercase italic tracking-tight ${channel.state.isActive ? 'text-brand-dark dark:text-white' : 'text-gray-400'}`}>
                        {channel.title}
                      </h2>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        {channel.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6" onClick={(e) => e.stopPropagation()}>
                    {/* Active Toggle Switch */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={channel.state.isActive}
                        disabled={channel.id === 'stock'}
                        onChange={(e) => {
                          if (channel.setter) {
                            channel.setter((prev: any) => ({ ...prev, isActive: e.target.checked }));
                          }
                          if (!e.target.checked && expandedSection === channel.id) setExpandedSection(null);
                        }}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-teal"></div>
                      <span className={`ml-3 text-[10px] font-black uppercase tracking-widest ${channel.state.isActive ? 'text-brand-teal' : 'text-gray-400'}`}>
                        {channel.id === 'stock' ? "Alltid aktiv" : (channel.state.isActive ? "Aktiv" : "Inaktiv")}
                      </span>
                    </label>

                    {/* Chevron icon */}
                    {channel.state.isActive && (
                      <div className="hidden sm:block">
                        <svg className={`w-6 h-6 text-gray-400 transition-transform ${expandedSection === channel.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedSection === channel.id && channel.state.isActive && (
                  <div className="p-6 md:p-8 pt-0 border-t border-gray-50 dark:border-slate-800/50 bg-gray-50 dark:bg-slate-800/20">
                    
                    {/* Facebook specific fields */}
                    {channel.id === 'facebook' && (
                      <div className="space-y-8 mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <button
                            onClick={() => setFacebook(prev => ({ ...prev, postStrategy: "comment" }))}
                            className={`p-6 rounded-2xl border-2 text-left transition-all ${facebook.postStrategy === "comment" ? "border-brand-teal bg-white dark:bg-slate-800 shadow-md" : "border-transparent bg-white dark:bg-slate-800 opacity-60 hover:opacity-100"}`}
                          >
                            <h3 className="font-black text-brand-dark dark:text-white uppercase italic text-sm mb-1">✓ Länk i kommentar</h3>
                            <p className="text-xs text-gray-500">Större bild, bäst räckvidd.</p>
                          </button>
                          <button
                            onClick={() => setFacebook(prev => ({ ...prev, postStrategy: "direct" }))}
                            className={`p-6 rounded-2xl border-2 text-left transition-all ${facebook.postStrategy === "direct" ? "border-brand-teal bg-white dark:bg-slate-800 shadow-md" : "border-transparent bg-white dark:bg-slate-800 opacity-60 hover:opacity-100"}`}
                          >
                            <h3 className="font-black text-brand-dark dark:text-white uppercase italic text-sm mb-1">✓ Direkt klickbar</h3>
                            <p className="text-xs text-gray-500">Klickbar banner.</p>
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <label className="space-y-2">
                             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Page ID</span>
                             <input type="text" value={facebook.pageId} onChange={e => setFacebook(p => ({ ...p, pageId: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-brand-teal outline-none" />
                          </label>
                          <label className="space-y-2">
                             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">App ID</span>
                             <input type="text" value={facebook.appId} onChange={e => setFacebook(p => ({ ...p, appId: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-brand-teal outline-none" />
                          </label>
                          <label className="space-y-2 md:col-span-2">
                             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Page Access Token</span>
                             <input type="password" value={facebook.accessToken} onChange={e => setFacebook(p => ({ ...p, accessToken: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-brand-teal outline-none font-mono text-sm" />
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Instagram/LinkedIn/TikTok/X generic fields based on state mapping */}
                    {(channel.id === 'instagram' || channel.id === 'linkedin' || channel.id === 'tiktok' || channel.id === 'x') && (
                      <div className="grid grid-cols-1 gap-6 mt-6">
                        {channel.id !== 'x' && (
                          <label className="space-y-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
                              {channel.id === 'instagram' ? 'Account ID' : channel.id === 'linkedin' ? 'Author URN' : 'Open ID'}
                            </span>
                            <input 
                              type="text" 
                              value={(channel.state as any).accountId || (channel.state as any).authorUrn || (channel.state as any).openId || ""} 
                              onChange={e => {
                                const key = channel.id === 'instagram' ? 'accountId' : channel.id === 'linkedin' ? 'authorUrn' : 'openId';
                                if (channel.setter) {
                                  channel.setter((p: any) => ({ ...p, [key]: e.target.value }));
                                }
                              }} 
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-brand-teal outline-none dark:text-white" 
                            />
                          </label>
                        )}
                        <label className="space-y-2">
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Access Token</span>
                           <input 
                             type="password" 
                             value={(channel.state as any).accessToken || ""} 
                             onChange={e => {
                               if (channel.setter) {
                                 channel.setter((p: any) => ({ ...p, accessToken: e.target.value }));
                               }
                             }} 
                             className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-brand-teal outline-none font-mono text-sm dark:text-white" 
                           />
                        </label>
                      </div>
                    )}
                    
                    {channel.id === 'stock' && (
                      <div className="grid grid-cols-1 gap-6 mt-6">
                        <label className="space-y-4">
                           <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Tickersymbol (Yahoo Finance ID)</span>
                              <span className="text-[10px] font-bold text-brand-teal/60 italic">Exempel: ENZY.ST eller AAPL</span>
                           </div>
                           <input 
                             type="text" 
                             value={stock.ticker} 
                             onChange={e => setStock(p => ({ ...p, ticker: e.target.value.toUpperCase() }))} 
                             className="w-full px-4 py-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-brand-teal outline-none font-black text-lg tracking-widest dark:text-white" 
                             placeholder="ENZY.ST"
                           />
                           <p className="text-[10px] text-gray-400 font-medium ml-2 uppercase italic leading-loose">
                              Detta styr vilken aktie som visas i navbarens ticker och tillhörande graf.
                           </p>
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </section>
            ))}

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
