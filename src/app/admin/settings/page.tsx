"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/lib/supabase";
import { THEME_PRESETS } from "@/lib/themes";

export default function SettingsPage() {
  const { profile, loading: authLoading } = useAuth();
  const [facebook, setFacebook] = useState({ isActive: true, postStrategy: "comment", pageId: "", accessToken: "", appId: "" });
  const [instagram, setInstagram] = useState({ isActive: false, accountId: "", accessToken: "" });
  const [linkedin, setLinkedin] = useState({ isActive: false, authorUrn: "", accessToken: "" });
  const [tiktok, setTiktok] = useState({ isActive: false, openId: "", accessToken: "" });
  const [x, setX] = useState({ isActive: false, accessToken: "" });
  const [stock, setStock] = useState({ isActive: true, ticker: "", shares: "", sector: "" });
  const [brevo, setBrevo] = useState({ isActive: false, apiKey: "", senderName: "", senderEmail: "" });
  const [security, setSecurity] = useState<any>({ inactivityActive: true, inactivityTimeoutMinutes: 60, inactivityWarningSeconds: 30, siteLockActive: false, onboardingActive: true, siteCode: "0000", visitorCookieLifetimeValue: 1, visitorCookieLifetimeUnit: "days" });
  const [company, setCompany] = useState<any>({ name: "", logoUrl: "/media/logo.png", description: "", address: "", email: "", phone: "" });
  const [theme, setTheme] = useState<any>({ mode: "preset", presetId: THEME_PRESETS[0].id, colors: THEME_PRESETS[0].colors });
  const [hero, setHero] = useState<any>({ 
    mode: "slideshow", 
    interval: 8, 
    useIndividualText: true, 
    globalHeadline: "", 
    globalHighlight: "", 
    description: "", 
    slides: [] 
  });
  
  // Media Picker state
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number | null>(null);
  
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    
    if (profile?.role !== 'Admin' && profile?.role !== 'Editor' && profile?.role !== 'Redaktör') {
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
          if (data.facebook) setFacebook((prev: any) => ({ ...prev, ...data.facebook }));
          if (data.instagram) setInstagram((prev: any) => ({ ...prev, ...data.instagram }));
          if (data.linkedin) setLinkedin((prev: any) => ({ ...prev, ...data.linkedin }));
          if (data.tiktok) setTiktok((prev: any) => ({ ...prev, ...data.tiktok }));
          if (data.x) setX((prev: any) => ({ ...prev, ...data.x }));
          if (data.stock) setStock((prev: any) => ({ ...prev, ...data.stock }));
          if (data.brevo) setBrevo((prev: any) => ({ ...prev, ...data.brevo }));
          if (data.security) setSecurity((prev: any) => ({ ...prev, ...data.security }));
          if (data.company) setCompany((prev: any) => ({ ...prev, ...data.company }));
          if (data.theme) setTheme((prev: any) => ({ ...prev, ...data.theme }));
          if (data.hero) setHero((prev: any) => ({ ...prev, ...data.hero }));
        }

        // Fetch images for the picker
        const imgRes = await fetch("/api/images", {
          headers: { 'Authorization': `Bearer ${session?.access_token}` }
        });
        if (imgRes.ok) {
          const imgData = await imgRes.json();
          setAvailableImages(imgData.images || []);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [profile, authLoading, router]);

  // Live Theme Preview
  useEffect(() => {
    if (theme?.colors) {
      const root = document.documentElement;
      root.style.setProperty('--brand-primary', theme.colors.primary);
      root.style.setProperty('--brand-secondary', theme.colors.secondary);
      root.style.setProperty('--brand-dark', theme.colors.dark);
      root.style.setProperty('--brand-accent', theme.colors.accent);
      root.style.setProperty('--brand-light', theme.colors.light);
    }
  }, [theme.colors]);

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
        body: JSON.stringify({ facebook, instagram, linkedin, tiktok, x, stock, brevo, security, hero, company, theme })
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Inställningarna har sparats!" });
        window.dispatchEvent(new CustomEvent('settingsUpdated'));
        setTimeout(() => {
          setMessage(null);
          router.back();
        }, 1500);
      } else {
        const errData = await res.json();
        setMessage({ type: "error", text: errData.error || "Kunde inte spara inställningarna." });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/images", { 
        method: "POST", 
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
        body 
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableImages((prev: any) => [...prev, data.url]);
        if (activeSlideIndex === -1) {
          setCompany((p: any) => ({ ...p, logoUrl: data.url }));
          setShowMediaPicker(false);
        } else if (activeSlideIndex !== null) {
          const newSlides = [...hero.slides];
          newSlides[activeSlideIndex].src = data.url;
          setHero({ ...hero, slides: newSlides });
          setShowMediaPicker(false);
        }
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  const addSlide = () => {
    const newSlide = {
      id: Math.random().toString(36).substr(2, 9),
      src: "/media/logo.png",
      alt: "Ny bild",
      headline: "Ny rubrik",
      highlight: "Framhävd text"
    };
    setHero({ ...hero, slides: [...hero.slides, newSlide] });
  };

  const removeSlide = (index: number) => {
    if (hero.slides.length <= 1) return;
    const newSlides = hero.slides.filter((_: any, i: number) => i !== index);
    setHero({ ...hero, slides: newSlides });
  };

  const updateSlide = (index: number, field: string, value: string) => {
    const newSlides = [...hero.slides];
    newSlides[index] = { ...newSlides[index], [field]: value };
    setHero({ ...hero, slides: newSlides });
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 text-brand-teal font-black uppercase tracking-widest animate-pulse">
        Laddar inställningar...
      </div>
    );
  }

  if (profile?.role !== 'Admin' && profile?.role !== 'Editor' && profile?.role !== 'Redaktör') return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-10 md:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {message && (
          <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[300] p-6 rounded-2xl font-bold flex items-center gap-4 shadow-2xl animate-in slide-in-from-top-8 duration-500 backdrop-blur-xl ${message.type === "success" ? "bg-white/90 dark:bg-slate-900/90 text-green-600 border border-green-100" : "bg-white/90 dark:bg-slate-900/90 text-red-600 border border-red-100"}`}>
            <span className="text-xl">{message.type === "success" ? "✅" : "⚠️"}</span>
            <span className="uppercase text-[10px] tracking-widest font-black">{message.text}</span>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800">
          {/* Compressed Header */}
          <div className="bg-brand-dark px-10 py-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-teal/20 rounded-full blur-[100px] -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-teal/10 rounded-full blur-[80px] -ml-20 -mb-20" />
            <div className="relative z-10">
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic">
                Inställningar
              </h1>
            </div>
          </div>

          <div className="p-8 md:p-12 space-y-16">
            {/* General Settings Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-8 mb-4 px-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-100 dark:bg-slate-800 text-gray-500">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-7 h-7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter text-brand-dark dark:text-white">
                    Allmänna Inställningar
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-1">
                    Hantera Hero, Marknad, E-post & Säkerhet
                  </p>
                </div>
              </div>
              
              <div className="space-y-6">
                {[
                  {
                    id: "company_info",
                    title: "Företagsinformation",
                    subtitle: "Hantera företagsnamn och logotyp",
                    state: { isActive: true },
                    setter: null,
                    icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    ),
                    color: "text-brand-teal bg-brand-light dark:bg-brand-teal/20"
                  },
                  {
                    id: "theme",
                    title: "Tema & Utseende",
                    subtitle: "Byt färgschema eller anpassa profilfärger",
                    state: { isActive: true },
                    setter: null,
                    icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a1 1 0 001-1h2a1 1 0 001 1h4a2 2 0 012 2v12a4 4 0 01-4 4H7zM7 21h10a4 4 0 004-4v-1M7 21a4 4 0 00-4-4V5M7 21V5a2 2 0 012-2h4a1 1 0 001-1h2a1 1 0 001 1h4a2 2 0 012 2v12a4 4 0 01-4 4" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 8a2 2 0 11-4 0 2 2 0 014 0zM17 12a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    ),
                    color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20"
                  },
                  {
                    id: "hero",
                    title: "Hero & Bakgrund",
                    subtitle: "Styr sajtens huvudbild, bildspel och texter",
                    state: { isActive: true },
                    setter: null,
                    icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    ),
                    color: "text-brand-teal bg-brand-light dark:bg-brand-teal/20"
                  },
                  {
                    id: "stock",
                    title: "Marknad & Aktier",
                    subtitle: "Styr vilken aktie som visas i portalen",
                    state: stock,
                    setter: setStock,
                    icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18" />
                      </svg>
                    ),
                    color: "text-brand-teal bg-brand-light dark:bg-brand-teal/20"
                  },
                  {
                    id: "brevo",
                    title: "E-Post tjänst",
                    subtitle: "Mailutskick vid delning",
                    state: brevo,
                    setter: setBrevo,
                    icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    ),
                    color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                  },
                  {
                    id: "security",
                    title: "Säkerhet & Tillgänglighet",
                    subtitle: "Hantera sajt-lås och onboarding",
                    state: { isActive: true },
                    setter: null,
                    icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    ),
                    color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20"
                  }
                ].filter(channel => profile?.role === "Admin" || (channel.id !== "stock" && channel.id !== "security")).map((channel) => (
                  <div key={channel.id} className="bg-white dark:bg-slate-900 rounded-[1.5rem] overflow-hidden border border-gray-100 dark:border-slate-800 shadow-xl transition-all hover:border-brand-teal/30">
                    <div 
                      onClick={() => setExpandedSection(expandedSection === channel.id ? null : channel.id)}
                      className={`flex items-center justify-between p-8 cursor-pointer transition-all ${channel.state.isActive ? 'bg-white dark:bg-slate-900' : 'bg-gray-50/50 dark:bg-slate-900/50 opacity-80'}`}
                    >
                      <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform ${expandedSection === channel.id ? 'scale-110 shadow-lg shadow-brand-teal/10' : ''} ${channel.state.isActive ? channel.color : 'bg-gray-100 text-gray-400 dark:bg-slate-800'}`}>
                          {channel.icon}
                        </div>
                        <div>
                          <h2 className={`text-xl font-black uppercase italic tracking-tight ${channel.state.isActive ? 'text-brand-dark dark:text-white' : 'text-gray-400'}`}>
                            {channel.title}
                          </h2>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">
                            {channel.subtitle}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        {channel.setter && (
                          <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={channel.state.isActive}
                              onChange={(e) => {
                                if (channel.setter) {
                                  (channel.setter as React.Dispatch<React.SetStateAction<Record<string, unknown>>>)((prev) => ({ ...prev, isActive: e.target.checked }));
                                }
                                if (!e.target.checked && expandedSection === channel.id) setExpandedSection(null);
                              }}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-teal"></div>
                          </label>
                        )}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 dark:bg-slate-800 transition-transform ${expandedSection === channel.id ? 'rotate-180 bg-brand-teal text-white' : 'text-gray-400'}`}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {expandedSection === channel.id && channel.state.isActive && (
                      <div className="p-10 pt-0 border-t border-gray-50 dark:border-slate-800/50 bg-gray-50/30 dark:bg-slate-800/20 animate-in slide-in-from-top-4 duration-500">
                        {channel.id === 'company_info' && (
                          <div className="space-y-10 mt-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                              {/* --- FÖRETAGSNAMN --- */}
                              <div className="space-y-6">
                                  <label className="space-y-3 block">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Företagsnamn</span>
                                    <input 
                                      type="text" 
                                      value={company.name} 
                                      onChange={e => setCompany((p: any) => ({ ...p, name: e.target.value }))} 
                                      className="w-full px-6 py-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-brand-teal outline-none font-black text-lg dark:text-white transition-all shadow-sm" 
                                      placeholder="Ex: Mitt Företag AB"
                                    />
                                  </label>

                                  <label className="space-y-3 block">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Besöksadress</span>
                                    <input 
                                      type="text" 
                                      value={company.address || ""} 
                                      onChange={e => setCompany((p: any) => ({ ...p, address: e.target.value }))} 
                                      className="w-full px-6 py-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-brand-teal outline-none font-bold text-sm dark:text-white transition-all shadow-sm" 
                                      placeholder="Gata, Postnummer, Ort"
                                    />
                                  </label>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <label className="space-y-3 block">
                                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Kontakt-epost</span>
                                      <input 
                                        type="email" 
                                        value={company.email || ""} 
                                        onChange={e => setCompany((p: any) => ({ ...p, email: e.target.value }))} 
                                        className="w-full px-6 py-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-brand-teal outline-none font-bold text-sm dark:text-white transition-all shadow-sm" 
                                        placeholder="info@foretag.se"
                                      />
                                    </label>
                                    <label className="space-y-3 block">
                                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Telefonnummer</span>
                                      <input 
                                        type="text" 
                                        value={company.phone || ""} 
                                        onChange={e => setCompany((p: any) => ({ ...p, phone: e.target.value }))} 
                                        className="w-full px-6 py-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-brand-teal outline-none font-bold text-sm dark:text-white transition-all shadow-sm" 
                                        placeholder="+46 (0)00 000 00 00"
                                      />
                                    </label>
                                  </div>
                                  
                                  <label className="space-y-3 block">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Om företaget (beskrivning)</span>
                                    <textarea 
                                      value={company.description} 
                                      onChange={e => setCompany((p: any) => ({ ...p, description: e.target.value }))} 
                                      rows={4}
                                      className="w-full px-6 py-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-brand-teal outline-none font-bold text-sm dark:text-white transition-all shadow-sm resize-none" 
                                      placeholder="Skriv en kort text om företaget..."
                                    />
                                  </label>
                                </div>

                              {/* --- LOGOTYP --- */}
                              <div className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-xl flex flex-col items-center justify-center space-y-6">
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest self-start">Logotyp</div>
                                <div className="relative group w-32 h-32 rounded-2xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center p-4 border border-dashed border-gray-200 dark:border-slate-700">
                                  {company.logoUrl ? (
                                    <Image src={company.logoUrl} alt="Logo Preview" width={80} height={80} className="object-contain" />
                                  ) : (
                                    <span className="text-3xl">🖼️</span>
                                  )}
                                  <button 
                                    onClick={() => { setActiveSlideIndex(-1); setShowMediaPicker(true); }}
                                    className="absolute inset-0 bg-brand-teal/80 opacity-0 group-hover:opacity-100 transition-all rounded-2xl flex flex-col items-center justify-center text-white gap-2"
                                  >
                                    <span className="text-2xl">📸</span>
                                    <span className="text-[8px] font-black uppercase tracking-widest">Byt Logga</span>
                                  </button>
                                </div>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest text-center">
                                  Logotypen används i Navbaren och i huvudet på alla dialogfönster.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {channel.id === 'theme' && (
                          <div className="space-y-12 mt-10">
                            {/* --- PRESETS --- */}
                            <div className="space-y-6">
                              <div className="flex items-center justify-between px-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Fördefinierade teman</label>
                                <button 
                                  onClick={() => setTheme({ ...theme, mode: "custom" })}
                                  className={`text-[8px] font-black uppercase tracking-widest px-4 py-2 rounded-full transition-all ${theme.mode === "custom" ? "bg-brand-teal text-white shadow-lg" : "bg-gray-100 dark:bg-slate-800 text-gray-400 hover:text-brand-dark dark:hover:text-white"}`}
                                >
                                  Anpassad färg
                                </button>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                {THEME_PRESETS.map((preset) => (
                                  <div 
                                    key={preset.id}
                                    onClick={() => setTheme({ mode: "preset", presetId: preset.id, colors: preset.colors })}
                                    className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer group hover:-translate-y-1 ${theme.mode === "preset" && theme.presetId === preset.id ? "border-brand-teal bg-white dark:bg-slate-900 shadow-xl ring-4 ring-brand-teal/5" : "border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 opacity-70 hover:opacity-100"}`}
                                  >
                                    <div className="flex gap-1 mb-3">
                                      <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: preset.colors.primary }} />
                                      <div className="w-4 h-4 rounded-full shadow-inner -ml-1 border border-white dark:border-slate-900" style={{ backgroundColor: preset.colors.secondary }} />
                                      <div className="w-4 h-4 rounded-full shadow-inner -ml-1 border border-white dark:border-slate-900" style={{ backgroundColor: preset.colors.accent }} />
                                    </div>
                                    <div className={`text-[9px] font-black uppercase tracking-tighter transition-colors ${theme.mode === "preset" && theme.presetId === preset.id ? "text-brand-teal" : "text-gray-500 group-hover:text-brand-dark dark:group-hover:text-white"}`}>
                                      {preset.name}
                                    </div>
                                    {theme.mode === "preset" && theme.presetId === preset.id && (
                                      <div className="absolute top-2 right-2 text-brand-teal">
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                          <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* --- CUSTOM COLORS --- */}
                            {theme.mode === "custom" && (
                              <div className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-brand-teal/20 shadow-2xl animate-in zoom-in-95 duration-500 space-y-8">
                                <div>
                                  <h3 className="text-sm font-black text-brand-dark dark:text-white uppercase italic tracking-widest">Anpassat Färgschema</h3>
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Skapa din helt egna profil genom att välja färgkoder</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                  {[
                                    { label: "Primärfärg", key: "primary", desc: "Huvudfärg för logotyper & detaljer" },
                                    { label: "Sekundärfärg", key: "secondary", desc: "Komplementfärg för effekter" },
                                    { label: "Accentfärg", key: "accent", desc: "Färg för knappar & interaktion" },
                                    { label: "Mörk Bas", key: "dark", desc: "Bakgrundston i dark mode" },
                                    { label: "Ljus Bas", key: "light", desc: "Bakgrundston i light mode" }
                                  ].map((c) => (
                                    <div key={c.key} className="space-y-3">
                                      <div className="flex items-center justify-between px-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{c.label}</label>
                                        <span className="text-[8px] font-bold text-gray-300 uppercase font-mono tracking-widest">{(theme.colors as any)[c.key]}</span>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <input 
                                          type="color" 
                                          value={(theme.colors as any)[c.key]} 
                                          onChange={e => setTheme({ ...theme, colors: { ...theme.colors, [c.key]: e.target.value } })}
                                          className="w-12 h-12 rounded-xl bg-transparent border-none cursor-pointer overflow-hidden p-0"
                                        />
                                        <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest leading-tight">{c.desc}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {channel.id === 'hero' && (
                          <div className="space-y-12 mt-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 p-8 bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-xl">
                              <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-2">Visningsläge</label>
                                <div className="flex bg-gray-100 dark:bg-slate-800 rounded-2xl p-1.5">
                                  <button
                                    onClick={() => setHero({ ...hero, mode: "single" })}
                                    className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${hero.mode === "single" ? "bg-white dark:bg-slate-700 text-brand-teal shadow-xl" : "text-gray-400 hover:text-brand-dark dark:hover:text-white"}`}
                                  >
                                    Enstaka bild
                                  </button>
                                  <button
                                    onClick={() => setHero({ ...hero, mode: "slideshow" })}
                                    className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${hero.mode === "slideshow" ? "bg-white dark:bg-slate-700 text-brand-teal shadow-xl" : "text-gray-400 hover:text-brand-dark dark:hover:text-white"}`}
                                  >
                                    Bildspel
                                  </button>
                                </div>
                              </div>
                              
                              {hero.mode === "slideshow" && (
                                <div className="space-y-4 animate-in fade-in duration-500">
                                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-2">Rotation (sekunder: {hero.interval}s)</label>
                                  <div className="space-y-6 pt-4">
                                    <input
                                      type="range"
                                      min="3"
                                      max="12"
                                      step="1"
                                      value={hero.interval}
                                      onChange={(e) => setHero({ ...hero, interval: parseInt(e.target.value) })}
                                      className="w-full h-2 bg-gray-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-teal"
                                    />
                                    <div className="flex justify-between text-[8px] font-black text-gray-300 uppercase tracking-widest">
                                      <span>Snabb (3s)</span>
                                      <span>Långsam (12s)</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="space-y-8 p-10 bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-xl relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-teal/5 rounded-full -mr-16 -mt-16" />
                              <div className="flex items-center justify-between relative z-10">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Globala Texter</h3>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest transition-colors group-hover:text-brand-teal">Använd unik text per bild</span>
                                  <input 
                                    type="checkbox" 
                                    checked={hero.useIndividualText} 
                                    onChange={e => setHero({ ...hero, useIndividualText: e.target.checked })}
                                    className="w-5 h-5 rounded-lg border-2 border-gray-200 checked:bg-brand-teal transition-all"
                                  />
                                </label>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                <label className="space-y-2">
                                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Huvudrubrik</span>
                                  <input type="text" value={hero.globalHeadline} onChange={e => setHero({ ...hero, globalHeadline: e.target.value })} className="w-full px-5 py-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:border-brand-teal outline-none font-black text-sm dark:text-white transition-all focus:ring-4 ring-brand-teal/5" />
                                </label>
                                <label className="space-y-2">
                                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Highlight</span>
                                  <input type="text" value={hero.globalHighlight} onChange={e => setHero({ ...hero, globalHighlight: e.target.value })} className="w-full px-5 py-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:border-brand-teal outline-none font-black text-sm text-brand-teal transition-all focus:ring-4 ring-brand-teal/5" />
                                </label>
                                <label className="space-y-2 md:col-span-2">
                                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Beskrivning</span>
                                  <textarea 
                                    value={hero.description} 
                                    onChange={e => setHero({ ...hero, description: e.target.value })} 
                                    className="w-full px-5 py-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:border-brand-teal outline-none font-medium text-xs dark:text-white h-24 resize-none transition-all focus:ring-4 ring-brand-teal/5" 
                                    placeholder="Skriv en engagerande ingress..."
                                  />
                                </label>
                              </div>
                            </div>

                            <div className="space-y-8">
                              <div className="flex justify-between items-center px-4">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{hero.mode === 'single' ? 'Hantering av bild' : 'Hantering av bilder'}</h3>
                                {hero.mode !== 'single' && (
                                  <button 
                                    onClick={addSlide}
                                    className="px-6 py-3 rounded-2xl bg-brand-teal text-white text-[10px] font-black uppercase tracking-widest hover:bg-brand-dark transition-all shadow-lg shadow-brand-teal/20"
                                  >
                                    + Lägg till bild
                                  </button>
                                )}
                              </div>

                              <div className="space-y-6">
                                {(hero.mode === 'single' ? hero.slides.slice(0, 1) : hero.slides).map((slide: any, idx: number) => (
                                  <div key={slide.id} className="group bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-gray-100 dark:border-slate-800 flex flex-col md:flex-row gap-10 shadow-xl hover:shadow-2xl hover:border-brand-teal/20 transition-all relative overflow-hidden animate-in zoom-in-95 duration-500">
                                    <div className="absolute top-0 left-0 w-2 h-full bg-brand-teal opacity-0 group-hover:opacity-100 transition-opacity" />
                                    
                                    <div 
                                      onClick={() => { setActiveSlideIndex(idx); setShowMediaPicker(true); }}
                                      className="relative w-full md:w-64 h-40 rounded-2xl overflow-hidden cursor-pointer flex-shrink-0 ring-4 ring-transparent group-hover:ring-brand-teal/20 shadow-inner transition-all"
                                     >
                                      <Image src={slide.src} alt={slide.alt || "Cover"} fill className="object-cover" />
                                      <div className="absolute inset-0 bg-brand-dark/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                                         <span className="text-[10px] font-black text-white uppercase tracking-widest bg-brand-teal px-4 py-2 rounded-full shadow-xl">Byt bild</span>
                                      </div>
                                    </div>

                                    <div className="flex-1 space-y-6">
                                       <div className="flex justify-between items-start">
                                         <label className="flex-1 max-w-sm space-y-2">
                                           <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Alt-text (SEO)</span>
                                           <input type="text" value={slide.alt || ""} onChange={e => updateSlide(idx, 'alt', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-50 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:border-brand-teal outline-none text-[10px] font-black dark:text-white" placeholder="Beskriv bilden för Google..." />
                                         </label>
                                         
                                         {hero.slides.length > 1 && hero.mode !== 'single' && (
                                           <button 
                                             onClick={() => removeSlide(idx)}
                                             className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                           >
                                             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-4 h-4">
                                               <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                             </svg>
                                           </button>
                                         )}
                                       </div>
                                      
                                       {hero.useIndividualText && (
                                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in slide-in-from-bottom-2">
                                           <label className="space-y-2">
                                               <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Unik Rubrik</span>
                                               <input type="text" value={slide.headline || ""} onChange={e => updateSlide(idx, 'headline', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:border-brand-teal outline-none text-[10px] font-black dark:text-white" />
                                           </label>
                                           <label className="space-y-2">
                                               <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Unik Highlight</span>
                                               <input type="text" value={slide.highlight || ""} onChange={e => updateSlide(idx, 'highlight', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:border-brand-teal outline-none text-[10px] font-black text-brand-teal" />
                                           </label>
                                         </div>
                                       )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {channel.id === 'stock' && (
                          <div className="space-y-10 mt-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-10 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-xl">
                              <label className="space-y-3 block">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Ticker Symbol (Yahoo Finance)</span>
                                <input 
                                  type="text" 
                                  value={stock.ticker} 
                                  onChange={e => setStock((p: any) => ({ ...p, ticker: e.target.value.toUpperCase() }))} 
                                  className="w-full px-6 py-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:border-brand-teal outline-none font-black text-lg dark:text-white transition-all" 
                                  placeholder="ENZY.ST"
                                />
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest ml-2 italic">Exempel: ENZY.ST eller AAPL</p>
                              </label>
                              <label className="space-y-3 block">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Sektor / Bransch</span>
                                <input 
                                  type="text" 
                                  value={stock.sector} 
                                  onChange={e => setStock((p: any) => ({ ...p, sector: e.target.value }))} 
                                  className="w-full px-6 py-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:border-brand-teal outline-none font-black text-sm dark:text-white transition-all" 
                                  placeholder="Hälsovård"
                                />
                              </label>
                              <label className="space-y-3 md:col-span-2 block">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Antal utestående aktier</span>
                                <input 
                                  type="text" 
                                  value={stock.shares} 
                                  onChange={e => setStock((p: any) => ({ ...p, shares: e.target.value }))} 
                                  className="w-full px-6 py-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:border-brand-teal outline-none font-black text-sm dark:text-white transition-all" 
                                  placeholder="142 823 696"
                                />
                              </label>
                            </div>
                          </div>
                        )}

                        {channel.id === 'brevo' && (
                          <div className="space-y-10 mt-10">
                            <div className="p-10 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-xl space-y-8">
                              <label className="space-y-3 block">
                                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Brevo API Key (v3)</span>
                                 <input 
                                   type="password" 
                                   value={brevo.apiKey} 
                                   onChange={e => setBrevo((p: any) => ({ ...p, apiKey: e.target.value }))} 
                                   className="w-full px-6 py-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:border-brand-teal outline-none font-mono text-xs dark:text-white transition-all" 
                                   placeholder="xkeysib-..."
                                 />
                              </label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <label className="space-y-3">
                                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Avsändarnamn</span>
                                   <input 
                                     type="text" 
                                     value={brevo.senderName} 
                                     onChange={e => setBrevo((p: any) => ({ ...p, senderName: e.target.value }))} 
                                     className="w-full px-6 py-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:border-brand-teal outline-none font-black text-sm dark:text-white transition-all" 
                                   />
                                </label>
                                <label className="space-y-3">
                                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Avsändar-epost</span>
                                   <input 
                                     type="email" 
                                     value={brevo.senderEmail} 
                                     onChange={e => setBrevo((p: any) => ({ ...p, senderEmail: e.target.value }))} 
                                     className="w-full px-6 py-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:border-brand-teal outline-none font-black text-sm dark:text-white transition-all" 
                                   />
                                </label>
                              </div>
                            </div>
                          </div>
                        )}

                        {channel.id === 'security' && (
                          <div className="space-y-12 mt-10">
                            {/* Step 1: Sessioner */}
                            <div className="space-y-6">
                              <div className="flex items-center gap-4 mb-2">
                                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-xs">1</div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-dark dark:text-white italic">Steg 1: Sessioner</h4>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                                <button
                                  onClick={() => setSecurity((prev: any) => ({ ...prev, inactivityActive: !prev.inactivityActive }))}
                                  className={`group p-8 rounded-[2rem] border-2 text-left transition-all h-full ${security.inactivityActive ? "border-amber-500 bg-white dark:bg-slate-900 shadow-2xl" : "border-transparent bg-gray-100 dark:bg-slate-800/50 opacity-60 hover:opacity-100"}`}
                                >
                                  <div className="flex justify-between items-start mb-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-transform group-hover:scale-110 ${security.inactivityActive ? 'bg-amber-500/10 text-amber-500' : 'bg-gray-200 text-gray-400'}`}>
                                      {security.inactivityActive ? "⌛" : "♾️"}
                                    </div>
                                    <div className={`w-3 h-3 rounded-full ${security.inactivityActive ? "bg-amber-500 animate-pulse" : "bg-gray-300"}`} />
                                  </div>
                                  <h3 className="font-black text-brand-dark dark:text-white uppercase italic text-sm mb-1">Aktivitetstimer</h3>
                                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.1em] leading-tight">Global sessionskontroll</p>
                                </button>

                                <div className={`p-8 bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-xl space-y-6 h-full flex flex-col justify-center transition-all duration-500 ${!security.inactivityActive ? 'opacity-20 grayscale pointer-events-none scale-95 blur-[2px]' : ''}`}>
                                  <label className="space-y-4 block">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 text-center block">Timeout (minuter)</span>
                                    <div className="relative">
                                      <input 
                                        type="number" 
                                        min="1"
                                        disabled={!security.inactivityActive}
                                        value={security.inactivityTimeoutMinutes || 60} 
                                        onChange={e => setSecurity((p: any) => ({ ...p, inactivityTimeoutMinutes: parseInt(e.target.value) || 1 }))}
                                        className="w-full px-5 py-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:border-brand-teal outline-none font-black text-xl text-center dark:text-white transition-all shadow-inner" 
                                      />
                                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase tracking-widest pointer-events-none">MIN</div>
                                    </div>
                                  </label>
                                </div>

                                <div className={`p-8 bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-xl space-y-6 h-full flex flex-col justify-center transition-all duration-500 ${!security.inactivityActive ? 'opacity-20 grayscale pointer-events-none scale-95 blur-[2px]' : ''}`}>
                                  <label className="space-y-4 block">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 text-center block">Varningstid (sekunder)</span>
                                    <div className="relative">
                                      <input 
                                        type="number" 
                                        min="5"
                                        max="120"
                                        disabled={!security.inactivityActive}
                                        value={security.inactivityWarningSeconds || 30} 
                                        onChange={e => setSecurity((p: any) => ({ ...p, inactivityWarningSeconds: parseInt(e.target.value) || 5 }))}
                                        className="w-full px-5 py-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:border-brand-teal outline-none font-black text-xl text-center dark:text-white transition-all shadow-inner" 
                                      />
                                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase tracking-widest pointer-events-none">SEK</div>
                                    </div>
                                  </label>
                                </div>
                              </div>
                            </div>

                            {/* Step 2: Tillträde */}
                            <div className={`space-y-6 transition-all duration-500 ${!security.inactivityActive ? 'opacity-20 grayscale pointer-events-none blur-[2px]' : ''}`}>
                              <div className="flex items-center gap-4 mb-2">
                                <div className="w-8 h-8 rounded-full bg-brand-teal text-white flex items-center justify-center font-black text-xs">2</div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-dark dark:text-white italic">Steg 2: Tillträde</h4>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                                <button
                                  disabled={!security.inactivityActive}
                                  onClick={() => setSecurity((prev: any) => ({ ...prev, siteLockActive: !prev.siteLockActive }))}
                                  className={`group p-8 rounded-[2rem] border-2 text-left transition-all h-full ${security.siteLockActive ? "border-brand-teal bg-white dark:bg-slate-900 shadow-2xl" : "border-transparent bg-gray-100 dark:bg-slate-800/50 opacity-60 hover:opacity-100"}`}
                                >
                                  <div className="flex justify-between items-start mb-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-transform group-hover:scale-110 ${security.siteLockActive ? 'bg-brand-teal/10 text-brand-teal' : 'bg-gray-200 text-gray-400'}`}>
                                      {security.siteLockActive ? "🔒" : "🔓"}
                                    </div>
                                    <div className={`w-3 h-3 rounded-full ${security.siteLockActive ? "bg-brand-teal animate-pulse" : "bg-gray-300"}`} />
                                  </div>
                                  <h3 className="font-black text-brand-dark dark:text-white uppercase italic text-sm mb-1">Sajtlås Active</h3>
                                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.1em] leading-tight">Portvakt för anonyma</p>
                                </button>

                                <div className={`md:col-span-2 p-8 bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-xl space-y-6 h-full flex flex-col justify-center transition-all duration-500 ${(!security.siteLockActive || !security.inactivityActive) ? 'opacity-20 grayscale pointer-events-none scale-95 blur-[2px]' : ''}`}>
                                  <label className="space-y-4 block w-full">
                                    <div className="flex justify-between items-center px-2">
                                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Säkerhetskod (3-8 siffror)</span>
                                      <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${security.siteCode?.length >= 3 && security.siteCode?.length <= 8 ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
                                        {security.siteCode?.length || 0} tecken
                                      </span>
                                    </div>
                                    <input 
                                      type="text" 
                                      disabled={!security.siteLockActive || !security.inactivityActive}
                                      value={security.siteCode || ""} 
                                      onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                                        setSecurity((p: any) => ({ ...p, siteCode: val }));
                                      }} 
                                      className="w-full px-5 py-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:border-brand-teal outline-none font-black text-2xl tracking-[0.5em] text-center dark:text-white transition-all shadow-inner" 
                                      placeholder="0000"
                                    />
                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest text-center italic">Krävs för att låsa upp portalen</p>
                                  </label>
                                </div>
                              </div>
                            </div>

                            {/* Step 3: Välkomnande */}
                            <div className="space-y-6">
                              <div className="flex items-center gap-4 mb-2">
                                <div className="w-8 h-8 rounded-full bg-brand-teal text-white flex items-center justify-center font-black text-xs">3</div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-dark dark:text-white italic">Steg 3: Välkomnande</h4>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                                <button
                                  onClick={() => setSecurity((prev: any) => ({ ...prev, onboardingActive: !prev.onboardingActive }))}
                                  className={`group p-8 rounded-[2rem] border-2 text-left transition-all h-full ${security.onboardingActive ? "border-brand-teal bg-white dark:bg-slate-900 shadow-2xl" : "border-transparent bg-gray-100 dark:bg-slate-800/50 opacity-60 hover:opacity-100"}`}
                                >
                                  <div className="flex justify-between items-start mb-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-transform group-hover:scale-110 ${security.onboardingActive ? 'bg-brand-teal/10 text-brand-teal' : 'bg-gray-200 text-gray-400'}`}>
                                      {security.onboardingActive ? "✨" : "🚫"}
                                    </div>
                                    <div className={`w-3 h-3 rounded-full ${security.onboardingActive ? "bg-brand-teal animate-pulse" : "bg-gray-300"}`} />
                                  </div>
                                  <h3 className="font-black text-brand-dark dark:text-white uppercase italic text-sm mb-1">Onboarding Active</h3>
                                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.1em] leading-tight">Visa välkomstguide</p>
                                </button>

                                <div className="md:col-span-2 p-8 bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-xl space-y-6 h-full flex flex-col justify-center">
                                  <div className="space-y-4">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Visa onboarding var...</span>
                                    <div className="flex gap-4">
                                      <div className="relative flex-1">
                                        <input 
                                          type="number" 
                                          min="1"
                                          value={security.visitorCookieLifetimeValue || 1} 
                                          onChange={e => setSecurity((p: any) => ({ ...p, visitorCookieLifetimeValue: parseInt(e.target.value) || 1 }))}
                                          className="w-full px-5 py-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:border-brand-teal outline-none font-black text-xl text-center dark:text-white transition-all shadow-inner" 
                                        />
                                      </div>
                                      <select 
                                        value={security.visitorCookieLifetimeUnit || "days"}
                                        onChange={e => setSecurity((p: any) => ({ ...p, visitorCookieLifetimeUnit: e.target.value }))}
                                        className="w-40 px-5 py-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:border-brand-teal outline-none font-black text-sm uppercase tracking-widest dark:text-white transition-all shadow-inner cursor-pointer"
                                      >
                                        <option value="days">Dagar</option>
                                        <option value="minutes">Minuter</option>
                                      </select>
                                    </div>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest text-center italic">Styr hur ofta samma besökare ser guiden</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="p-8 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100/50 dark:border-amber-900/20 rounded-3xl">
                              <p className="text-[10px] text-amber-700 dark:text-amber-500 font-bold uppercase tracking-widest leading-loose flex items-start gap-3">
                                <span className="text-xl">💡</span>
                                <span>Notera: Ändring av sajtlås tvingar alla anonyma besökare att ange koden på nytt vid nästa besök.</span>
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Social Media Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-8 mb-4 px-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-brand-teal text-white shadow-2xl shadow-brand-teal/20">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-7 h-7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a4 4 0 014-4h2a4 4 0 014 4v2" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter text-brand-dark dark:text-white">
                    Sociala Medier
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-1">
                    Integreringar för FB, IG, LinkedIn, TikTok & X
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {[
                  {
                    id: "facebook",
                    title: "Facebook",
                    subtitle: "Publiceringsalternativ & API",
                    state: facebook,
                    setter: setFacebook,
                    icon: (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    ),
                    color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                  },
                  {
                    id: "instagram",
                    title: "Instagram",
                    subtitle: "Profil-ID & Åtkomst",
                    state: instagram,
                    setter: setInstagram,
                    icon: (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.984 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.058.935 20.39.522 19.6 0.31c.296-.058 1.636-.261 2.913-.072C15.667 0.015 15.26 0 12 0zm0 2.16c3.203 0 3.58.016 4.85.074 1.17.054 1.802.249 2.227.415.562.217.96.477 1.381.896.419.42.679.819.896 1.381.166.425.361 1.057.415 2.227.058 1.27.074 1.647.074 4.85s-.016 3.58-.074 4.85c-.054 1.17-.249 1.802-.415 2.227-.217.562-.477.96-.896 1.381-.42.419-.819.679-1.381.896-.425.166-1.057.361-2.227.415-1.27.058-1.647.074-4.85.074s-3.58-.016-4.85-.074c-1.17-.054-1.802-.249-2.227-.415-.562-.217-.96-.477-1.381-.896-.419-.42-.679-.819-.896-1.381-.166-.425-.361-1.057-.415-2.227C2.176 15.58 2.16 15.203 2.16 12s.016-3.58.074-4.85c.054-1.17.249-1.802.415-2.227.217-.562.477-.96.896-1.381.42-.419.819-.679 1.381-.896.425-.166 1.057-.361 2.227-.415 1.27-.058 1.647-.074 4.85-.074zm0 3.678c-3.413 0-6.162 2.748-6.162 6.162 0 3.413 2.749 6.162 6.162 6.162 3.413 0 6.162-2.749 6.162-6.162 0-3.414-2.749-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.645-1.44-1.44 0-.794.645-1.439 1.44-1.439.794 0 1.44.645 1.44 1.439z"/>
                      </svg>
                    ),
                    color: "text-pink-600 bg-pink-50 dark:bg-pink-900/20"
                  },
                  {
                    id: "linkedin",
                    title: "LinkedIn",
                    subtitle: "Företagsprofil & URN",
                    state: linkedin,
                    setter: setLinkedin,
                    icon: (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/>
                      </svg>
                    ),
                    color: "text-blue-700 bg-blue-50 dark:bg-blue-900/40"
                  },
                  {
                    id: "tiktok",
                    title: "TikTok",
                    subtitle: "Integrering & API",
                    state: tiktok,
                    setter: setTiktok,
                    icon: (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.536.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.12-3.44-3.17-3.61-5.46-.02-.84.05-1.68.27-2.48.5-1.65 1.63-3.08 3.13-3.86 1.48-.75 3.2-.88 4.79-.44.62.19 1.2.49 1.73.86.01-1.37-.02-2.74.02-4.11-.79-.31-1.63-.44-2.48-.41-1.74.01-3.48.51-4.91 1.51-1.89 1.34-3.16 3.44-3.32 5.76-.11 1.79.44 3.59 1.5 5.01 1.19 1.59 2.99 2.62 4.96 2.89 1.83.25 3.73-.02 5.3-1.07 1.96-1.29 3.24-3.41 3.4-5.76.08-3.02.02-6.04.03-9.06z"/>
                      </svg>
                    ),
                    color: "text-black bg-gray-100 dark:text-white dark:bg-slate-800"
                  },
                  {
                    id: "x",
                    title: "X (Twitter)",
                    subtitle: "Direct Share API",
                    state: x,
                    setter: setX,
                    icon: (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.294 19.497h2.039L6.482 3.239H4.293l13.314 17.411z"/>
                      </svg>
                    ),
                    color: "text-black bg-gray-100 dark:text-white dark:bg-slate-800"
                  }
                ].map((sub) => (
                  <div key={sub.id} className="bg-white dark:bg-slate-900 rounded-[1.5rem] overflow-hidden border border-gray-100 dark:border-slate-800 shadow-xl transition-all hover:border-brand-teal/30">
                    <div 
                      onClick={() => setExpandedSection(expandedSection === sub.id ? null : sub.id)}
                      className={`flex items-center justify-between p-8 cursor-pointer transition-all ${expandedSection === sub.id ? 'bg-white dark:bg-slate-900' : 'bg-gray-50/50 dark:bg-slate-900/50'}`}
                    >
                      <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform ${expandedSection === sub.id ? 'scale-110 shadow-lg shadow-brand-teal/10' : ''} ${sub.state.isActive ? sub.color : 'bg-gray-100 text-gray-400 dark:bg-slate-800'}`}>
                          {sub.icon}
                        </div>
                        <div>
                          <h3 className={`text-xl font-black uppercase italic tracking-tight ${sub.state.isActive ? 'text-brand-dark dark:text-white' : 'text-gray-400'}`}>
                            {sub.title}
                          </h3>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">
                            {sub.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={sub.state.isActive}
                            onChange={(e) => {
                              if (sub.setter) {
                                (sub.setter as React.Dispatch<React.SetStateAction<Record<string, unknown>>>)((prev) => ({ ...prev, isActive: e.target.checked }));
                              }
                              if (!e.target.checked && expandedSection === sub.id) setExpandedSection(null);
                            }}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-teal"></div>
                        </label>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 dark:bg-slate-800 transition-transform ${expandedSection === sub.id ? 'rotate-180 bg-brand-teal text-white' : 'text-gray-400'}`}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {expandedSection === sub.id && (
                      <div className="p-10 pt-0 border-t border-gray-50 dark:border-slate-800/50 bg-gray-50/30 dark:bg-slate-800/20 animate-in slide-in-from-top-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10">
                          {sub.id === 'facebook' && (
                            <div className="space-y-8 md:col-span-2">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <button
                                  onClick={() => setFacebook((prev: any) => ({ ...prev, postStrategy: "comment" }))}
                                  className={`p-8 rounded-2xl border-2 text-left transition-all relative overflow-hidden ${facebook.postStrategy === "comment" ? "border-brand-teal bg-white dark:bg-slate-900 shadow-2xl" : "border-transparent bg-gray-100 dark:bg-slate-800/40 opacity-50 hover:opacity-100"}`}
                                >
                                  {facebook.postStrategy === "comment" && <div className="absolute top-0 right-0 w-8 h-8 bg-brand-teal text-white flex items-center justify-center text-xs font-black">✓</div>}
                                  <h4 className="font-black text-brand-dark dark:text-white uppercase italic text-xs mb-1">Länk i kommentar</h4>
                                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">Bästa räckvidden pga algoritmen</p>
                                </button>
                                <button
                                  onClick={() => setFacebook((prev: any) => ({ ...prev, postStrategy: "direct" }))}
                                  className={`p-8 rounded-2xl border-2 text-left transition-all relative overflow-hidden ${facebook.postStrategy === "direct" ? "border-brand-teal bg-white dark:bg-slate-900 shadow-2xl" : "border-transparent bg-gray-100 dark:bg-slate-800/40 opacity-50 hover:opacity-100"}`}
                                >
                                  {facebook.postStrategy === "direct" && <div className="absolute top-0 right-0 w-8 h-8 bg-brand-teal text-white flex items-center justify-center text-xs font-black">✓</div>}
                                  <h4 className="font-black text-brand-dark dark:text-white uppercase italic text-xs mb-1">Länk i inlägg</h4>
                                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">Fler klick direkt på bannern</p>
                                </button>
                              </div>
                              <label className="space-y-3 block">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Facebook Page ID</span>
                                <input type="text" value={facebook.pageId} onChange={e => setFacebook((p: any) => ({ ...p, pageId: e.target.value }))} className="w-full px-6 py-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:border-brand-teal outline-none font-black text-sm dark:text-white transition-all focus:ring-4 ring-brand-teal/5" placeholder="1234567890" />
                              </label>

                              <label className="space-y-3 block">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Facebook App ID</span>
                                <input type="text" value={facebook.appId} onChange={e => setFacebook((p: any) => ({ ...p, appId: e.target.value }))} className="w-full px-6 py-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:border-brand-teal outline-none font-black text-sm dark:text-white transition-all focus:ring-4 ring-brand-teal/5" placeholder="Ex: 1285187810374426" />
                              </label>
                            </div>
                          )}

                          {sub.id === 'instagram' && (
                            <label className="space-y-3 md:col-span-2">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Instagram Business Account ID</span>
                              <input type="text" value={instagram.accountId} onChange={e => setInstagram((p: any) => ({ ...p, accountId: e.target.value }))} className="w-full px-6 py-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:border-brand-teal outline-none font-black text-sm dark:text-white transition-all focus:ring-4 ring-brand-teal/5" />
                            </label>
                          )}

                          {sub.id === 'linkedin' && (
                            <label className="space-y-3 md:col-span-2">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">LinkedIn Organization / Author URN</span>
                              <input type="text" value={linkedin.authorUrn} onChange={e => setLinkedin((p: any) => ({ ...p, authorUrn: e.target.value }))} className="w-full px-6 py-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:border-brand-teal outline-none font-black text-sm dark:text-white transition-all focus:ring-4 ring-brand-teal/5" placeholder="urn:li:organization:12345" />
                            </label>
                          )}
                          
                          {sub.id === 'tiktok' && (
                            <label className="space-y-3 md:col-span-2">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">TikTok Creator OpenID</span>
                              <input type="text" value={tiktok.openId} onChange={e => setTiktok((p: any) => ({ ...p, openId: e.target.value }))} className="w-full px-6 py-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:border-brand-teal outline-none font-black text-sm dark:text-white transition-all focus:ring-4 ring-brand-teal/5" />
                            </label>
                          )}

                          {/* Universal Access Token Field for all SoMe */}
                          <label className="space-y-3 md:col-span-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                              Access Token
                              <span className="text-[8px] bg-brand-teal text-white px-2 py-0.5 rounded-full font-black">CRITICAL</span>
                            </span>
                            <input 
                              type="password" 
                              value={sub.state.accessToken as string || ""} 
                              onChange={e => (sub.setter as any)((p: any) => ({ ...p, accessToken: e.target.value }))} 
                              className="w-full px-6 py-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:border-brand-teal outline-none font-mono text-sm dark:text-white transition-all focus:ring-4 ring-brand-teal/5" 
                              placeholder="••••••••••••••••••••••••••••••••"
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Final Actions Footer */}
            <div className="pt-12 border-t border-gray-100 dark:border-slate-800">
              <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                <button
                  onClick={() => router.back()}
                  className="w-full md:w-48 py-5 rounded-2xl bg-gray-100 dark:bg-slate-800 text-gray-500 font-black text-sm uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full md:w-64 py-5 rounded-2xl bg-brand-teal text-white font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-brand-teal/30 hover:bg-brand-dark transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 group"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-5 h-5 transition-transform group-hover:scale-125">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  <span>{isSaving ? "Sparar..." : "Spara"}</span>
                </button>
              </div>
              
              <div className="mt-8 text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 animate-pulse">
                  Ändringar slår igenom omedelbart för besökare
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Branding Footer */}
        <div className="mt-12 text-center pb-20">
           <div className="flex items-center justify-center gap-4 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Secured by</span>
              <div className="w-24 h-6 bg-brand-dark rounded flex items-center justify-center">
                <span className="text-[8px] font-black text-white italic tracking-tighter uppercase px-2">{company.name || "COMPANY"} CORE</span>
              </div>
           </div>
        </div>
      </div>

      {/* Global Media Picker Modal */}
      {showMediaPicker && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 md:p-12 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-brand-dark/95 backdrop-blur-2xl" onClick={() => setShowMediaPicker(false)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-6xl max-h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden relative z-10 border border-white/10">
            <div className="p-8 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50">
              <div>
                <h3 className="text-3xl font-black text-brand-dark dark:text-white uppercase italic tracking-tighter">Mediebibliotek</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2">Välj sajtens nästa bakgrund eller ladda upp ny bild</p>
              </div>
              <button 
                onClick={() => setShowMediaPicker(false)} 
                className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-2xl flex items-center justify-center text-xl font-black hover:bg-brand-teal hover:text-white transition-all hover:rotate-90 active:scale-90"
              >
                &times;
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                <label className="relative aspect-[4/5] rounded-2xl border-4 border-dashed border-brand-teal/20 flex flex-col items-center justify-center cursor-pointer hover:bg-brand-teal/5 hover:border-brand-teal/40 transition-all group overflow-hidden">
                  <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                  {uploading ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-brand-teal/20 border-t-brand-teal rounded-full animate-spin" />
                      <span className="text-[8px] font-black uppercase text-brand-teal">Laddar upp...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-brand-teal/10 text-brand-teal flex items-center justify-center transition-transform group-hover:scale-125">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Ny Bild</span>
                    </div>
                  )}
                </label>
                
                {availableImages.map((img, i) => (
                  <div 
                    key={i} 
                    onClick={() => {
                      if (activeSlideIndex === -1) {
                        setCompany((p: any) => ({ ...p, logoUrl: img }));
                        setShowMediaPicker(false);
                      } else if (activeSlideIndex !== null) {
                        const newSlides = [...hero.slides];
                        newSlides[activeSlideIndex].src = img;
                        setHero({ ...hero, slides: newSlides });
                        setShowMediaPicker(false);
                      }
                    }} 
                    className="relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer group shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 ring-4 ring-transparent hover:ring-brand-teal/50"
                  >
                    <Image src={img} alt="Media Asset" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-brand-teal/40 opacity-0 group-hover:opacity-100 transition-all flex items-end p-6 duration-500">
                      <span className="text-[8px] font-black text-white uppercase tracking-widest bg-brand-dark/80 px-3 py-2 rounded-full backdrop-blur-md">Använd Bild</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
