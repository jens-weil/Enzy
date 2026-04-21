"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { SOCIAL_ICONS } from "./SocialShare";
import RichTextEditor from "./RichTextEditor";
import { Share2, ChevronDown, ChevronUp, Globe, FileText, Calendar, Type, Image as ImageIcon, Loader2 } from "lucide-react";
import MediaPicker from "./MediaPicker";

type Article = {
  id: string;
  title: string;
  type: string;
  date: string;
  imageUrl?: string;
  ingress?: string;
  content: string;
  socialMedia: {
    facebook: boolean;
    instagram: boolean;
    linkedin: boolean;
    tiktok: boolean;
    x: boolean;
  };
  socialLinks: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    tiktok?: string;
    x?: string;
  };
  facebookPostId?: string;
};

interface ArticleForm {
  title: string;
  type: string;
  date: string;
  ingress: string;
  content: string;
  imageUrl: string;
  socialMedia: {
    facebook: boolean;
    instagram: boolean;
    linkedin: boolean;
    tiktok: boolean;
    x: boolean;
  };
  socialLinks: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    tiktok?: string;
    x?: string;
  };
  facebookPostId?: string;
}

const initialFormState: ArticleForm = {
  title: "",
  type: "Artikel",
  date: new Date().toISOString().split("T")[0],
  ingress: "",
  content: "",
  imageUrl: "",
  socialMedia: { facebook: false, instagram: false, linkedin: false, tiktok: false, x: false },
  socialLinks: {},
};

interface ArticleEditModalProps {
  editingArticle: Article | null;
  accessToken: string | null;
  onClose: () => void;
  onSaved: (article: Article, isNew: boolean) => void;
}

export default function ArticleEditModal({ editingArticle, accessToken, onClose, onSaved }: ArticleEditModalProps) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const isEditing = editingArticle !== null;
  const [formData, setFormData] = useState<ArticleForm>(
    editingArticle
      ? {
          title: editingArticle.title,
          type: editingArticle.type,
          date: editingArticle.date.split("T")[0],
          ingress: editingArticle.ingress || "",
          content: editingArticle.content,
          imageUrl: editingArticle.imageUrl || "",
          socialMedia: { ...editingArticle.socialMedia },
          socialLinks: editingArticle.socialLinks ? { ...editingArticle.socialLinks } : {},
        }
      : initialFormState
  );

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showStreamingPicker, setShowStreamingPicker] = useState(false);
  const [mediaInsertMode, setMediaInsertMode] = useState(false);
  const [editorRef, setEditorRef] = useState<any>(null);
  const [showSocialDropdown, setShowSocialDropdown] = useState(false);

  // New state for channel visibility (from global settings)
  const [channelSettings, setChannelSettings] = useState<any>(null);

  useEffect(() => {
    import("@/lib/settingsCache").then(({ fetchSettingsOnce }) => {
      fetchSettingsOnce().then(data => {
        if (data) setChannelSettings(data);
      });
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      socialMedia: { ...prev.socialMedia, [name]: checked }
    }));
  };

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [name]: value }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/articles", {
        method: isEditing ? "PATCH" : "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify(isEditing ? { ...formData, id: editingArticle.id } : formData),
      });

      if (res.ok) {
        const { article: saved } = await res.json();
        setMessage({ type: "success", text: isEditing ? "Artikeln har uppdaterats!" : "Artikeln har publicerats!" });
        setTimeout(() => {
          onSaved(saved, !isEditing);
          onClose();
        }, 1000);
      } else {
        const err = await res.json();
        setMessage({ type: "error", text: err.error || "Något gick fel." });
      }
    } catch {
      setMessage({ type: "error", text: "Kunde inte kommunicera med servern." });
    } finally {
      setLoading(false);
    }
  };

  const handleMediaSelect = (url: string) => {
    if (mediaInsertMode) {
      // Insert into editor
      editorRef?.chain().focus().setImage({ src: url }).run();
      setMediaInsertMode(false);
    } else {
      // Set featured image
      setFormData(prev => ({ ...prev, imageUrl: url }));
    }
    setShowMediaPicker(false);
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-md flex items-center justify-center p-2 md:p-8" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[calc(100vh-1rem)] md:max-h-[min(92vh,1200px)] rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/20"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-[160] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-6 md:px-10 py-4 md:py-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-brand-teal/10 flex items-center justify-center text-brand-teal">
              <FileText size={20} className="md:w-6 md:h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-2xl font-black text-brand-dark dark:text-white uppercase italic tracking-tight">
                {isEditing ? "Redigera artikel" : "Skapa ny"}
              </h2>
              <p className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                Layout & arkitektur
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-400 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 transition-all group"
          >
            <span className="text-2xl md:text-3xl font-light group-hover:scale-110 transition-transform">&times;</span>
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-8 md:space-y-10 overflow-y-auto flex-1 scroll-smooth">
          
          {/* 1. TOP BAR: SOCIAL DROPDOWN */}
          <div className="relative z-[155]">
            <button
              type="button"
              onClick={() => setShowSocialDropdown(!showSocialDropdown)}
              className={`w-full flex items-center justify-between p-5 rounded-3xl border-2 transition-all ${
                showSocialDropdown 
                  ? "bg-brand-teal text-white border-brand-teal shadow-xl shadow-brand-teal/20" 
                  : "bg-gray-50 dark:bg-slate-800 border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
              }`}
            >
              <div className="flex items-center gap-4">
               <Share2 size={20} className={showSocialDropdown ? "animate-pulse" : ""} />
                <div className="text-left">
                  <span className="text-[10px] font-black uppercase tracking-widest block opacity-70">Publiceringstjänster</span>
                  <span className="font-bold text-sm">Aktiva kanaler och sociala inställningar</span>
                </div>
              </div>
              {showSocialDropdown ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            <AnimatePresence>
              {showSocialDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 5, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="absolute top-full left-0 right-0 overflow-hidden bg-white dark:bg-slate-900 border-2 border-brand-teal rounded-3xl shadow-2xl p-4 md:p-6 grid grid-cols-3 sm:grid-cols-5 gap-3 md:gap-4 mt-2"
                >
                  {["facebook", "linkedin", "instagram", "tiktok", "x"]
                  .sort((a, b) => {
                    const aActive = channelSettings?.[a]?.isActive ?? (a === 'facebook');
                    const bActive = channelSettings?.[b]?.isActive ?? (b === 'facebook');
                    return (aActive === bActive) ? 0 : aActive ? -1 : 1;
                  })
                  .map(platform => {
                    const isActive = channelSettings?.[platform]?.isActive ?? (platform === 'facebook');
                    const isSelected = formData.socialMedia[platform as keyof typeof formData.socialMedia];

                    return (
                      <div key={platform} className="space-y-4 flex flex-col items-center">
                        <div 
                          onClick={() => {
                            if (isActive) {
                              setFormData(prev => ({
                                ...prev,
                                socialMedia: { ...prev.socialMedia, [platform]: !isSelected }
                              }));
                            }
                          }}
                          className={`w-full flex flex-col items-center justify-center p-4 md:p-8 rounded-2xl md:rounded-3xl border-2 transition-all gap-2 md:gap-4 ${
                            !isActive ? 'opacity-30 grayscale cursor-not-allowed border-transparent' :
                            isSelected
                              ? "bg-brand-teal/10 border-brand-teal text-brand-teal cursor-pointer shadow-xl shadow-brand-teal/10 scale-[1.05]"
                              : "bg-gray-50 dark:bg-slate-800 border-transparent text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 hover:scale-[1.02]"
                          }`}
                        >
                          <div className={`w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center p-2.5 md:p-3.5 transition-all duration-500 ${
                              isSelected 
                              ? "bg-brand-teal text-white shadow-lg shadow-brand-teal/40 rotate-[360deg]" 
                              : "bg-gray-200 dark:bg-slate-700 text-gray-500"
                          }`}>
                            <div className="w-full h-full">{SOCIAL_ICONS[platform]}</div>
                          </div>
                        </div>

                        {/* Helper texts / Link inputs */}
                        <div className="w-full text-center px-2">
                          {isActive && isSelected ? (
                            platform === 'facebook' || platform === 'instagram' ? (
                              <p className="text-[8px] font-black uppercase text-brand-teal italic opacity-70 animate-in fade-in slide-in-from-top-1">Länk genereras automatiskt</p>
                            ) : (
                              <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                                <p className="text-[8px] font-black uppercase text-gray-400 italic">Klistra in länk nedan</p>
                                <input
                                  type="url"
                                  name={platform}
                                  value={formData.socialLinks[platform as keyof typeof formData.socialLinks] || ''}
                                  onChange={handleLinkChange}
                                  placeholder="https://..."
                                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-brand-teal/20 focus:border-brand-teal outline-none transition-all font-bold text-[8px] text-gray-600 dark:text-gray-300 placeholder:text-gray-400 text-center"
                                />
                              </div>
                            )
                          ) : !isActive ? (
                            <p className="text-[8px] font-black uppercase text-red-400 italic opacity-60">Ej aktiverad</p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 2. METADATA SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left: Metadata */}
            <div className="lg:col-span-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-black text-brand-teal uppercase tracking-widest"><Type size={12}/> Titel</label>
                  <input
                    required
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Artikelrubrik..."
                    className="w-full px-5 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/5 outline-none transition-all font-bold text-base md:text-lg"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:space-y-3">
                    <label className="flex items-center gap-2 text-[10px] font-black text-brand-teal uppercase tracking-widest"><Globe size={12}/> Kategori</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full px-5 py-3 md:py-4 rounded-xl md:rounded-2xl bg-gray-50 dark:bg-slate-800 border-transparent focus:border-brand-teal outline-none transition-all font-bold"
                    >
                      <option value="Artikel">Artikel</option>
                      <option value="PM">PM</option>
                      <option value="Nyhet">Nyhet</option>
                    </select>
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <label className="flex items-center gap-2 text-[10px] font-black text-brand-teal uppercase tracking-widest"><Calendar size={12}/> Datum</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      className="w-full px-5 py-3 md:py-4 rounded-xl md:rounded-2xl bg-gray-50 dark:bg-slate-800 border-transparent focus:border-brand-teal outline-none transition-all font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* 3. INGRESS - NOW BEFORE ARTICLE BODY */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-brand-teal uppercase tracking-widest ml-1"><FileText size={12}/> Ingress</label>
                <textarea
                  name="ingress"
                  value={formData.ingress}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Skriv en slagkraftig inledning som sammanfattar artikeln..."
                  className="w-full px-6 py-5 rounded-3xl bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/5 outline-none transition-all font-bold italic text-lg leading-relaxed placeholder:font-normal placeholder:not-italic"
                />
              </div>
            </div>

            {/* Right: Featured Image */}
            <div className="lg:col-span-4 space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-brand-teal uppercase tracking-widest"><ImageIcon size={12}/> Huvudbild</label>
              <div className="relative aspect-square rounded-[2rem] overflow-hidden border-4 border-gray-50 dark:border-slate-800 group cursor-pointer" onClick={() => setShowMediaPicker(true)}>
                <Image
                  src={formData.imageUrl || "/media/logo.png"}
                  alt="Featured"
                  fill
                  className={`object-cover transition-transform group-hover:scale-105 duration-700 ${!formData.imageUrl && "p-12 opacity-10"}`}
                />
                <div className="absolute inset-0 bg-brand-dark/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                  <span className="bg-white/90 px-4 py-2 rounded-full text-[10px] font-black uppercase text-brand-dark">Byt bild</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. MAIN BODY EDITOR */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-[10px] font-black text-brand-teal uppercase tracking-widest ml-1"><FileText size={12}/> Brödtext (Artikelinnehåll)</label>
            <div className="rounded-[2.5rem] bg-gray-50/50 dark:bg-slate-800/30 p-1">
              <RichTextEditor 
                content={formData.content} 
                onChange={(html) => setFormData(prev => ({ ...prev, content: html }))}
                onMediaClick={() => { setMediaInsertMode(true); setShowMediaPicker(true); }}
                onVideoClick={() => { setMediaInsertMode(true); setShowStreamingPicker(true); }}
                //@ts-ignore
                ref={(r) => { if (r?.editor) setEditorRef(r.editor); }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-10 border-t border-gray-100 dark:border-slate-800">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-brand-teal text-white py-4 md:py-6 rounded-2xl md:rounded-3xl font-black text-xs md:text-sm uppercase tracking-widest hover:bg-brand-dark transition-all shadow-xl shadow-brand-teal/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Publicerar...</span>
                </>
              ) : isEditing ? "Spara ändringar" : "Publicera artikel"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 md:px-10 bg-gray-50 dark:bg-slate-800 text-gray-500 py-4 md:py-6 rounded-2xl md:rounded-3xl font-black text-xs md:text-sm uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-slate-700 transition-all outline-none"
            >
              Avbryt
            </button>
          </div>
        </form>

        {/* Message Overlay */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className={`fixed bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl font-bold shadow-2xl backdrop-blur-md border ${
                message.type === "success" ? "bg-green-500/90 border-green-400 text-white" : "bg-red-500/90 border-red-400 text-white"
              }`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <MediaPicker 
        isOpen={showMediaPicker}
        onClose={() => { setShowMediaPicker(false); setMediaInsertMode(false); }}
        onSelect={handleMediaSelect}
        title="Mediebibliotek"
        description={mediaInsertMode ? "Välj en bild att infoga i artikeln" : "Välj huvudbild för artikeln"}
      />
    </div>
  );
}
