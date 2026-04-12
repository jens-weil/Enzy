"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./AuthContext";
import { supabase } from "@/lib/supabase";
import SocialShare, { SOCIAL_ICONS } from "./SocialShare";

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

const FB_PROTOTYPE_LINK = "https://www.facebook.com/groups/208466683777810/permalink/1598041428153655/";

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

interface ArticleFeedProps {
  initialArticles: Article[];
}



function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("sv-SE", { year: "numeric", month: "long", day: "numeric" });
}

function getTypeColor(type: string) {
  switch (type.toLowerCase()) {
    case "pm": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800/50";
    case "news":
    case "nyhet": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800/50";
    case "article":
    case "artikel": return "bg-brand-light text-brand-dark dark:bg-brand-teal/20 dark:text-brand-light border-brand-teal/20";
    default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700";
  }
}

// ─── Article Read Modal ───────────────────────────────────────────────────────
interface ArticleModalProps {
  article: Article;
  isAdmin: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit: (article: Article) => void;
}

function ArticleModal({ article, isAdmin, onClose, onDelete, onEdit }: ArticleModalProps) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 flex items-start justify-center p-4 md:p-8 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[1.5rem] shadow-2xl flex flex-col relative animate-in slide-in-from-bottom-5 duration-500 my-auto"
        onClick={e => e.stopPropagation()}
        style={{ minHeight: "842px" }}
      >
        <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center rounded-t-[1.5rem]">
          <div className="flex items-center gap-4">
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest ${getTypeColor(article.type)}`}>
              {article.type.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <>
                <button
                  onClick={() => { onClose(); onEdit(article); }}
                  className="px-5 py-2 rounded-xl bg-brand-teal text-white font-black text-[10px] uppercase tracking-widest shadow-md hover:bg-brand-dark transition-all"
                >
                  Redigera
                </button>
                <button
                  onClick={() => onDelete(article.id)}
                  className="px-5 py-2 rounded-xl bg-red-500 text-white font-black text-[10px] uppercase tracking-widest shadow-md hover:bg-red-600 transition-all"
                >
                  Radera
                </button>
              </>
            )}
            <button
              className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-700 transition-all text-2xl font-black"
              onClick={onClose}
            >
              &times;
            </button>
          </div>
        </div>

        <div className="p-8 md:p-16 flex-1 space-y-12 max-w-3xl mx-auto w-full pb-24">
          {article.imageUrl && (
            <div className="relative w-full aspect-video rounded-[2rem] overflow-hidden shadow-2xl mb-12 transform hover:scale-[1.01] transition-transform duration-500 group">
              <Image src={article.imageUrl} alt={article.title} fill className="object-cover" />
              
              {/* Social Post Overlay (Admin Only) */}
              {isAdmin && (
                <div className="absolute top-6 right-6 flex gap-2 z-20">
                  {["facebook", "linkedin", "instagram", "tiktok", "x"].map(p => {
                    const link = article.socialLinks[p as keyof typeof article.socialLinks];
                    if (!link || link === "#" || link === "") return null;
                    return (
                      <button
                        key={p}
                        onClick={(e) => { e.stopPropagation(); window.open(link, "_blank"); }}
                        className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-brand-teal hover:scale-110 transition-all shadow-lg"
                        title={`Visa inlägg på ${p}`}
                      >
                        <div className="w-5 h-5">{SOCIAL_ICONS[p]}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-black text-brand-dark dark:text-white leading-[1.1] uppercase italic">
                {article.title}
              </h1>
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-12 bg-brand-teal rounded-full" />
                <time className="text-[11px] font-black text-gray-400 uppercase tracking-widest italic">{formatDate(article.date)}</time>
              </div>
            </div>

            {article.ingress && (
              <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-relaxed border-l-4 border-brand-teal pl-8 italic mb-8">
                {article.ingress}
              </div>
            )}
            
            {/* Social Media - Always visible now */}
            <SocialShare 
              articleId={article.id}
              articleTitle={article.title}
              socialMedia={article.socialMedia}
              socialLinks={article.socialLinks}
              size="md"
              showLabel={true}
              hideAdminLinks={true}
            />
          </div>
          <div
            className="article-rich-content text-gray-600 dark:text-gray-300 text-lg leading-[1.8] font-medium space-y-8"
            dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, "<br/>") }}
          />
          <div className="pt-16 border-t border-gray-100 dark:border-slate-800 flex justify-end items-center">
            <button onClick={onClose} className="group px-8 py-3 rounded-2xl bg-brand-dark text-white font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-brand-teal transition-all">
              <span className="group-hover:-translate-x-1 transition-transform">←</span> Tillbaka till listan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Article Edit / Create Lightbox ──────────────────────────────────────────
interface ArticleEditModalProps {
  editingArticle: Article | null; // null = create new
  accessToken: string | null;
  onClose: () => void;
  onSaved: (article: Article, isNew: boolean) => void;
}

function ArticleEditModal({ editingArticle, accessToken, onClose, onSaved }: ArticleEditModalProps) {
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
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [showStreamingPicker, setShowStreamingPicker] = useState(false);
  const [streamData, setStreamData] = useState({ service: "youtube", url: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; title: string; thumbnail: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [channelSettings, setChannelSettings] = useState<any>(null);

  useEffect(() => {
    fetch("/api/settings", { 
      headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {} 
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => data && setChannelSettings(data))
      .catch(console.error);

    fetch("/api/images")
      .then(r => r.ok ? r.json() : { images: [] })
      .then(d => setAvailableImages(d.images || []))
      .catch(() => {});
  }, [accessToken]);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    try {
      const res = await fetch("/api/images", { method: "POST", body });
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, imageUrl: data.url }));
        setAvailableImages(prev => [...prev, data.url]);
        setShowMediaPicker(false);
      }
    } catch {
      setMessage({ type: "error", text: "Kunde inte ladda upp bild." });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!accessToken) {
      setMessage({ type: "error", text: "Ingen aktiv session. Logga in igen." });
      setLoading(false);
      return;
    }

    // Filter out inactive channels before sending to API
    const finalSocialMedia = { ...formData.socialMedia };
    if (channelSettings) {
      Object.keys(finalSocialMedia).forEach(p => {
        const platform = p as keyof typeof finalSocialMedia;
        const isActive = channelSettings?.[platform]?.isActive ?? (platform === 'facebook');
        if (!isActive) {
          finalSocialMedia[platform] = false;
        }
      });
    }

    try {
      const res = await fetch("/api/articles", {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(isEditing ? { ...formData, socialMedia: finalSocialMedia, id: editingArticle!.id } : { ...formData, socialMedia: finalSocialMedia }),
      });
      if (res.ok) {
        const data = await res.json();
        const saved: Article = data.article;
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/videos/search?service=${streamData.service}&q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.videos || []);
      }
    } catch (e) {
      console.error("Search failed", e);
    } finally {
      setSearching(false);
    }
  };

  const insertHtml = (tag: string, endTag?: string) => {
    const textarea = document.getElementById("article-content-editor") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selection = text.substring(start, end);
    const replacement = endTag ? `${tag}${selection}${endTag}` : tag;
    const newValue = text.substring(0, start) + replacement + text.substring(end);
    setFormData(prev => ({ ...prev, content: newValue }));
    
    // Set focus back and adjust cursor
    setTimeout(() => {
      textarea.focus();
      const cursorPos = start + tag.length + (endTag ? selection.length : 0);
      textarea.setSelectionRange(cursorPos, cursorPos);
    }, 0);
  };

  const getEmbedHtml = (service: string, url: string) => {
    let videoId = "";
    if (service === "youtube") {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      videoId = (match && match[2].length === 11) ? match[2] : url;
      return `<div class="aspect-video w-full rounded-2xl overflow-hidden shadow-lg my-8"><iframe src="https://www.youtube.com/embed/${videoId}" class="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
    } else if (service === "vimeo") {
      const regExp = /vimeo\.com\/(?:video\/)?(\d+)/;
      const match = url.match(regExp);
      videoId = match ? match[1] : url;
      return `<div class="aspect-video w-full rounded-2xl overflow-hidden shadow-lg my-8"><iframe src="https://player.vimeo.com/video/${videoId}" class="w-full h-full border-0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
    }
    return "";
  };

  return (
    <div
      className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 md:p-8 overflow-y-auto animate-in fade-in duration-300"
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[2rem] shadow-2xl flex flex-col my-auto overflow-hidden animate-in slide-in-from-bottom-5 duration-500"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-8 py-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-brand-dark dark:text-white uppercase italic">
              {isEditing ? "Redigera artikel" : "Skapa ny artikel"}
            </h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
              Administrera innehåll – stödjer HTML-formatering
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-700 text-2xl font-black transition-all"
          >
            &times;
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-7">
          {/* Image - Moved to Top */}
          <div className="space-y-4 p-6 bg-gray-50 dark:bg-slate-800/50 rounded-3xl border border-gray-100 dark:border-slate-800">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Huvudbild</label>
            <div className="flex items-center gap-6">
              <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 flex-shrink-0">
                <Image
                  src={formData.imageUrl || "/logo.png"}
                  alt="Preview"
                  fill
                  className={`object-cover ${!formData.imageUrl && "p-6 opacity-20"}`}
                />
              </div>
              <div className="space-y-3">
                <p className="text-sm font-bold text-gray-600 dark:text-gray-400">Välj en representativ bild för din artikel.</p>
                <button
                  type="button"
                  onClick={() => setShowMediaPicker(true)}
                  className="px-6 py-3 rounded-2xl bg-brand-teal text-white font-black text-xs uppercase tracking-widest hover:bg-brand-dark transition-all shadow-lg shadow-brand-teal/20"
                >
                  Välj från bibliotek +
                </button>
              </div>
            </div>
          </div>

          {/* Title + Type + Date */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Titel</label>
              <input
                required
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Ange en rubrik..."
                className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all font-bold text-gray-900 dark:text-white text-lg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kategori</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-brand-teal outline-none transition-all font-bold text-gray-900 dark:text-white text-lg"
              >
                <option value="Artikel">Artikel</option>
                <option value="PM">Pressmeddelande (PM)</option>
                <option value="Nyhet">Nyhet</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Datum</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-brand-teal outline-none transition-all font-bold text-gray-900 dark:text-white text-lg"
              />
            </div>
          </div>

          {/* Ingress */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ingress</label>
            <textarea
              name="ingress"
              value={formData.ingress}
              onChange={handleChange}
              rows={3}
              placeholder="Skriv en kraftfull ingress..."
              className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-brand-teal outline-none transition-all font-bold text-gray-900 dark:text-white italic text-base"
            />
          </div>

          {/* Content with Toolbar and Preview */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Brödtext (Rich Text Editor)</label>
              <div className="flex bg-gray-100 dark:bg-slate-800 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setIsPreview(false)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!isPreview ? "bg-white dark:bg-slate-700 shadow-sm text-brand-teal" : "text-gray-400"}`}
                >
                  Redigering
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreview(true)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isPreview ? "bg-white dark:bg-slate-700 shadow-sm text-brand-teal" : "text-gray-400"}`}
                >
                  Visning
                </button>
              </div>
            </div>

            {!isPreview ? (
              <div className="space-y-2">
                {/* Rich Text Toolbar */}
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-t-2xl border-x border-t border-gray-100 dark:border-slate-700">
                  <button type="button" onClick={() => insertHtml("<b>", "</b>")} className="w-10 h-10 rounded-lg bg-white dark:bg-slate-700 font-bold border border-gray-100 dark:border-slate-600 hover:border-brand-teal transition-all">B</button>
                  <button type="button" onClick={() => insertHtml("<i>", "</i>")} className="w-10 h-10 rounded-lg bg-white dark:bg-slate-700 italic border border-gray-100 dark:border-slate-600 hover:border-brand-teal transition-all">I</button>
                  <button type="button" onClick={() => insertHtml("<h2>", "</h2>")} className="px-3 h-10 rounded-lg bg-white dark:bg-slate-700 font-black border border-gray-100 dark:border-slate-600 hover:border-brand-teal transition-all text-xs">H2</button>
                  <button type="button" onClick={() => insertHtml("<h3>", "</h3>")} className="px-3 h-10 rounded-lg bg-white dark:bg-slate-700 font-black border border-gray-100 dark:border-slate-600 hover:border-brand-teal transition-all text-xs">H3</button>
                   <button type="button" onClick={() => insertHtml("<ul>\n  <li>", "</li>\n</ul>")} className="w-10 h-10 rounded-lg bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 hover:border-brand-teal transition-all">List</button>
                  <button type="button" onClick={() => insertHtml('<a href="#" target="_blank">', "</a>")} className="w-10 h-10 rounded-lg bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 hover:border-brand-teal transition-all">Länk</button>
                  <button type="button" onClick={() => insertHtml('<img src="/logo.png" alt="Bild" />')} className="px-3 h-10 rounded-lg bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 hover:border-brand-teal transition-all text-[10px] font-black">MEDIA</button>
                  <button type="button" onClick={() => setShowStreamingPicker(true)} className="px-3 h-10 rounded-lg bg-brand-teal text-white border border-brand-teal hover:bg-brand-dark transition-all text-[10px] font-black uppercase">STREAM</button>
                </div>
                <textarea
                  id="article-content-editor"
                  required
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  rows={15}
                  placeholder="Skriv din artikeltext här..."
                  className="w-full px-5 py-4 rounded-b-2xl bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-brand-teal outline-none transition-all font-bold text-gray-900 dark:text-white resize-none leading-relaxed text-base"
                />
              </div>
            ) : (
              <div className="w-full px-5 py-8 rounded-2xl bg-gray-50 dark:bg-slate-800 min-h-[400px]">
                <div
                  className="article-rich-content text-gray-600 dark:text-gray-300 text-lg leading-[1.8] font-medium space-y-8"
                  dangerouslySetInnerHTML={{ __html: formData.content.replace(/\n/g, "<br/>") }}
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Delad via</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {["facebook", "linkedin", "instagram", "tiktok", "x"]
              .sort((a, b) => {
                const isLoaded = channelSettings !== null;
                if (!isLoaded) return 0;
                const aActive = channelSettings?.[a]?.isActive ?? (a === 'facebook');
                const bActive = channelSettings?.[b]?.isActive ?? (b === 'facebook');
                return (aActive === bActive) ? 0 : aActive ? -1 : 1;
              })
              .map(platform => {
                const isLoaded = channelSettings !== null;
                const isActive = channelSettings?.[platform]?.isActive ?? (platform === 'facebook');

                return (
                  <div key={platform} className="space-y-2">
                    <label
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        !isLoaded ? 'opacity-50 cursor-wait' :
                        !isActive ? 'opacity-40 cursor-not-allowed bg-gray-50 dark:bg-slate-800 border-transparent grayscale' :
                        formData.socialMedia[platform as keyof typeof formData.socialMedia]
                          ? "bg-brand-teal/5 border-brand-teal text-brand-teal cursor-pointer"
                          : "bg-gray-50 dark:bg-slate-800 border-transparent text-gray-400 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-slate-700 flex items-center justify-center p-1.5">
                          {SOCIAL_ICONS[platform]}
                        </span>
                        <span className="font-black text-[10px] uppercase tracking-widest">{platform}</span>
                      </div>
                      <input
                        type="checkbox"
                        name={platform}
                        checked={isActive ? formData.socialMedia[platform as keyof typeof formData.socialMedia] : false}
                        onChange={handleSocialChange}
                        disabled={!isLoaded || !isActive}
                        className="w-5 h-5 rounded-lg border-gray-300 text-brand-teal focus:ring-brand-teal disabled:opacity-50"
                      />
                    </label>
                    
                    {!isLoaded ? null : !isActive ? (
                      <p className="text-[8px] font-black uppercase text-red-400 px-2 italic">Aktivera i inställningar</p>
                    ) : formData.socialMedia[platform as keyof typeof formData.socialMedia] && (platform !== 'facebook' && platform !== 'instagram') ? (
                      <div className="animate-in slide-in-from-top-2 duration-300">
                        <input
                          type="url"
                          name={platform}
                          value={formData.socialLinks[platform as keyof typeof formData.socialLinks] || ''}
                          onChange={handleLinkChange}
                          placeholder={`Länk till ${platform}-inlägg...`}
                          className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-brand-teal/20 focus:border-brand-teal outline-none transition-all font-bold text-[8px] text-gray-600 dark:text-gray-300 placeholder:text-gray-400"
                        />
                      </div>
                    ) : (platform === 'facebook' || platform === 'instagram') && formData.socialMedia[platform as keyof typeof formData.socialMedia] ? (
                      <p className="text-[8px] font-black uppercase text-brand-teal px-2 italic opacity-60">Länk genereras automatiskt vid publicering</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status message */}
          {message && (
            <div className={`p-4 rounded-2xl font-bold text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {message.text}
            </div>
          )}

          {/* Submit */}
          <div className="pt-8 grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={onClose}
              className="py-5 rounded-2xl bg-gray-50 dark:bg-slate-800 text-brand-dark dark:text-white font-black text-base tracking-widest uppercase hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
            >
              Avbryt
            </button>
            <button
              disabled={loading}
              type="submit"
              className="py-5 rounded-2xl bg-brand-teal text-white font-black text-base tracking-widest uppercase shadow-xl hover:bg-brand-dark transition-all disabled:opacity-50"
            >
              {loading ? "Sparar..." : isEditing ? "Spara ändringar" : "Publicera nu"}
            </button>
          </div>
        </form>
      </div>

      {/* Media Picker sub-modal */}
      {showMediaPicker && (
        <div
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowMediaPicker(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-7 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-xl font-black text-brand-dark dark:text-white uppercase italic">Mediebibliotek</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Välj en befintlig bild eller ladda upp en ny</p>
              </div>
              <button
                onClick={() => setShowMediaPicker(false)}
                className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 shadow-md flex items-center justify-center text-2xl font-black text-gray-400 hover:text-brand-teal transition-all"
              >
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-7">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <label className="relative aspect-square rounded-2xl border-2 border-dashed border-brand-teal/30 flex flex-col items-center justify-center cursor-pointer hover:bg-brand-teal/5 hover:border-brand-teal transition-all group">
                  <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                  {uploading ? (
                    <div className="text-center animate-pulse">
                      <div className="w-7 h-7 rounded-full border-4 border-brand-teal border-t-transparent animate-spin mx-auto mb-2" />
                      <span className="text-[8px] font-black uppercase text-brand-teal">Laddar...</span>
                    </div>
                  ) : (
                    <>
                      <span className="text-4xl text-brand-teal mb-1">+</span>
                      <span className="text-[8px] font-black uppercase text-gray-400 group-hover:text-brand-teal">Ladda upp</span>
                    </>
                  )}
                </label>
                {["/logo.png", ...availableImages].map((img, i) => (
                  <div
                    key={i}
                    onClick={() => { setFormData(p => ({ ...p, imageUrl: img })); setShowMediaPicker(false); }}
                    className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer transition-all ${
                      formData.imageUrl === img ? "ring-4 ring-brand-teal ring-offset-4 dark:ring-offset-slate-900" : "opacity-80 hover:opacity-100 hover:scale-[1.02]"
                    }`}
                  >
                    <Image src={img} alt="Media" fill className="object-cover" />
                    <div className={`absolute inset-0 bg-brand-teal/20 transition-opacity ${formData.imageUrl === img ? "opacity-100" : "opacity-0 hover:opacity-40"}`} />
                  </div>
                ))}
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 dark:border-slate-800 text-center bg-gray-50/30 dark:bg-slate-800/30">
              <button
                onClick={() => setShowMediaPicker(false)}
                className="px-8 py-3 rounded-2xl bg-brand-dark text-white font-black text-xs uppercase tracking-widest hover:bg-brand-teal transition-all"
              >
                Stäng bibliotek
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Streaming Picker sub-modal */}
      {showStreamingPicker && (
        <div
          className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowStreamingPicker(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-7 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-xl font-black text-brand-dark dark:text-white uppercase italic">Bädda in Video</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">YouTube eller Vimeo</p>
              </div>
              <button
                type="button"
                onClick={() => setShowStreamingPicker(false)}
                className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 shadow-md flex items-center justify-center text-2xl font-black text-gray-400 hover:text-brand-teal transition-all"
              >
                &times;
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex gap-4 p-1 bg-gray-100 dark:bg-slate-800 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setStreamData(p => ({ ...p, service: "youtube" }))}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${streamData.service === "youtube" ? "bg-white dark:bg-slate-700 text-brand-teal shadow-md" : "text-gray-400"}`}
                >
                  YouTube
                </button>
                <button
                  type="button"
                  onClick={() => setStreamData(p => ({ ...p, service: "vimeo" }))}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${streamData.service === "vimeo" ? "bg-white dark:bg-slate-700 text-brand-teal shadow-md" : "text-gray-400"}`}
                >
                  Vimeo
                </button>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Sök eller ange URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={streamData.service === "youtube" ? "Sök på YouTube eller klistra in länk..." : "Sök på Vimeo eller klistra in länk..."}
                    className="flex-1 px-5 py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border-2 border-transparent focus:border-brand-teal outline-none font-bold italic"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleSearch())}
                  />
                  <button
                    type="button"
                    onClick={handleSearch}
                    disabled={searching || !searchQuery}
                    className="px-6 rounded-2xl bg-brand-dark text-white font-black text-[10px] uppercase tracking-widest hover:bg-brand-teal transition-all disabled:opacity-50"
                  >
                    {searching ? "..." : "Sök"}
                  </button>
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Sökresultat</label>
                  <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto p-1">
                    {searchResults.map(video => (
                      <div
                        key={video.id}
                        onClick={() => {
                          const url = streamData.service === "youtube" 
                            ? `https://www.youtube.com/watch?v=${video.id}`
                            : `https://vimeo.com/${video.id}`;
                          setStreamData(p => ({ ...p, url }));
                          setSearchQuery("");
                          setSearchResults([]);
                        }}
                        className={`group relative aspect-video rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                          streamData.url.includes(video.id) ? "border-brand-teal shadow-lg" : "border-transparent hover:border-brand-teal/50"
                        }`}
                      >
                        <Image src={video.thumbnail} alt={video.title} fill className="object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-[8px] font-black text-white uppercase line-clamp-1">{video.title}</p>
                        </div>
                        {streamData.url.includes(video.id) && (
                          <div className="absolute inset-0 bg-brand-teal/20 flex items-center justify-center">
                            <span className="w-8 h-8 rounded-full bg-brand-teal text-white flex items-center justify-center text-xl shadow-lg">✓</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Vald Video URL / ID</label>
                <input
                  type="text"
                  placeholder="https://..."
                  className="w-full px-5 py-3 rounded-xl bg-gray-50/50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 font-bold text-xs"
                  value={streamData.url}
                  onChange={e => setStreamData(p => ({ ...p, url: e.target.value }))}
                />
              </div>

              {streamData.url && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Förhandsvisning</label>
                  <div 
                    className="preview-embed aspect-video rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800"
                    dangerouslySetInnerHTML={{ __html: getEmbedHtml(streamData.service, streamData.url) }}
                  />
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-slate-800 flex gap-4">
              <button
                type="button"
                onClick={() => setShowStreamingPicker(false)}
                className="flex-1 py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 text-brand-dark dark:text-white font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all"
              >
                Avbryt
              </button>
              <button
                type="button"
                disabled={!streamData.url}
                onClick={() => {
                  insertHtml(getEmbedHtml(streamData.service, streamData.url));
                  setShowStreamingPicker(false);
                  setStreamData({ service: "youtube", url: "" });
                }}
                className="flex-1 py-4 rounded-2xl bg-brand-teal text-white font-black text-xs uppercase tracking-widest hover:bg-brand-dark transition-all disabled:opacity-50 shadow-xl shadow-brand-teal/20"
              >
                Infoga Video +
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main ArticleFeed Component ───────────────────────────────────────────────
export default function ArticleFeed({ initialArticles }: ArticleFeedProps) {
  const { user, profile } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<string>("Alla");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [socialFilters, setSocialFilters] = useState({ facebook: false, instagram: false, linkedin: false, tiktok: false, x: false });
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [articles, setArticles] = useState(initialArticles);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Derive admin status from Supabase profile role
  const isAdmin = profile?.role === "Admin" || profile?.role === "Editor";

  // Edit / Create lightbox
  const [editingArticle, setEditingArticle] = useState<Article | null | "new">(undefined as any);
  const [showEditModal, setShowEditModal] = useState(false);

  const openCreateModal = () => { setEditingArticle(null); setShowEditModal(true); };
  const openEditModal = (article: Article) => { setEditingArticle(article); setShowEditModal(true); };

  useEffect(() => {
    // Fetch and cache the session token whenever the user changes
    if (user) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setAccessToken(session?.access_token ?? null);
      });
    } else {
      setAccessToken(null);
    }
  }, [user]);

  useEffect(() => { setArticles(initialArticles); }, [initialArticles]);

  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      if (filterType !== "Alla" && article.type.toLowerCase() !== filterType.toLowerCase()) return false;
      const articleDate = new Date(article.date);
      if (startDate && articleDate < new Date(startDate)) return false;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (articleDate > end) return false;
      }
      const selectedPlatforms = Object.entries(socialFilters).filter(([, v]) => v).map(([k]) => k);
      for (const platform of selectedPlatforms) {
        if (!article.socialMedia?.[platform as keyof typeof article.socialMedia]) return false;
      }
      return true;
    });
  }, [articles, filterType, startDate, endDate, socialFilters]);

  const toggleSocial = (platform: keyof typeof socialFilters) => {
    setSocialFilters(prev => ({ ...prev, [platform]: !prev[platform] }));
  };

  const hasActiveFilters = filterType !== "Alla" || startDate || endDate || Object.values(socialFilters).some(v => v);

  const deleteArticle = async (id: string) => {
    if (!accessToken) {
      alert("Ingen aktiv session. Logga in igen.");
      return;
    }
    try {
      const response = await fetch(`/api/articles?id=${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${accessToken}` },
      });
      if (response.ok) {
        setArticles(prev => prev.filter(a => a.id !== id));
        setDeletingId(null);
      } else {
        alert("Kunde inte radera artikeln.");
      }
    } catch {
      alert("Ett fel uppstod vid radering.");
    }
  };

  const handleArticleSaved = (saved: Article, isNew: boolean) => {
    if (isNew) {
      setArticles(prev => [saved, ...prev]);
    } else {
      setArticles(prev => prev.map(a => a.id === saved.id ? saved : a));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        {hasActiveFilters && (
          <h2 className="text-2xl font-black text-brand-dark dark:text-white uppercase italic">
            Resultat
          </h2>
        )}
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest bg-brand-teal text-white shadow-lg hover:bg-brand-dark transition-all"
            >
              + Skapa artikel
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
              showFilters || hasActiveFilters
                ? "bg-brand-teal text-white shadow-lg"
                : "bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 hover:border-brand-teal"
            }`}
          >
            {showFilters ? "Stäng filter" : hasActiveFilters ? "Ändra filter" : "Filtrera"}
            <span className="text-lg">×</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={`bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-slate-800 transition-all duration-500 overflow-hidden ${
        showFilters ? "p-8 opacity-100 max-h-[1000px] mb-8" : "p-0 opacity-0 max-h-0 pointer-events-none"
      }`}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="space-y-3">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Kategori</label>
            <div className="flex flex-wrap gap-2">
              {["Alla", "PM", "Nyhet", "Artikel"].map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    filterType === t ? "bg-brand-teal text-white border-brand-teal" : "bg-gray-50 dark:bg-slate-800 text-gray-500 border-transparent"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Från</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-slate-800 font-bold text-xs outline-none focus:ring-2 focus:ring-brand-teal/50" />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Till</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-slate-800 font-bold text-xs outline-none focus:ring-2 focus:ring-brand-teal/50" />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Sociala medier</label>
            <div className="flex gap-2">
              {["facebook", "linkedin", "x", "instagram", "tiktok"].map(p => (
                <button
                  key={p}
                  onClick={() => toggleSocial(p as any)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black border transition-all ${
                    socialFilters[p as keyof typeof socialFilters] ? "bg-brand-teal text-white border-transparent shadow-md scale-110" : "bg-gray-50 dark:bg-slate-800 text-gray-400 border-transparent opacity-50 hover:opacity-100"
                  }`}
                >
                  <div className="w-6 h-6">
                    {SOCIAL_ICONS[p]}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Article Grid */}
      <motion.div 
        layout
        className="grid gap-8 sm:gap-10 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"
      >
        <AnimatePresence mode="popLayout">
          {filteredArticles.map((article, index) => (
            <motion.article
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              key={article.id}
              className="group flex flex-col bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all duration-700 cursor-pointer h-full"
              onClick={(e) => {
                // If the click is on a social icon or its container, don't open the article modal
                const target = e.target as HTMLElement;
                if (target.closest(".social-share-container")) {
                  return;
                }
                setSelectedArticle(article);
              }}
            >
              {/* Image Section */}
              <div className="relative w-full aspect-video overflow-hidden bg-gray-50 dark:bg-slate-800 flex-shrink-0">
                <Image
                  src={article.imageUrl || "/logo.png"}
                  alt={article.title}
                  fill
                  className={`object-cover transition-transform duration-1000 group-hover:scale-105 ${!article.imageUrl && "p-12 object-contain opacity-40"}`}
                />
                <div className="absolute top-5 left-5 z-10">
                  <span className={`px-5 py-2 rounded-full text-[9px] font-black tracking-widest shadow-xl backdrop-blur-md ${getTypeColor(article.type)}`}>
                    {article.type.toUpperCase()}
                  </span>
                </div>
                {/* Subtle overlay on hover */}
                <div className="absolute inset-0 bg-brand-teal/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Social Post Overlay (Admin Only) */}
                {isAdmin && (
                  <div className="absolute top-4 right-4 flex gap-1.5 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    {["facebook", "linkedin", "instagram", "tiktok", "x"].map(p => {
                      const link = article.socialLinks[p as keyof typeof article.socialLinks];
                      if (!link || link === "#" || link === "") return null;
                      return (
                        <button
                          key={p}
                          onClick={(e) => { e.stopPropagation(); window.open(link, "_blank"); }}
                          className="w-7 h-7 rounded-full bg-black/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-brand-teal transition-all shadow-lg"
                          title={`Visa inlägg på ${p}`}
                        >
                          <div className="w-3.5 h-3.5">{SOCIAL_ICONS[p]}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* White Content Section */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col bg-white dark:bg-slate-900">
                <div className="flex items-center gap-3 mb-2 transition-transform duration-500 group-hover:translate-x-1">
                   <div className="h-[2px] w-8 bg-brand-teal rounded-full" />
                   <time className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">{formatDate(article.date)}</time>
                </div>
                
                <h2 
                  className="text-xl font-black text-brand-dark dark:text-white mb-3 line-clamp-2 leading-[1.2] uppercase italic group-hover:text-brand-teal transition-colors duration-300"
                  title={article.title}
                >
                  {article.title}
                </h2>
                
                {/* Ingress - restored but limited */}
                <div 
                  className="article-rich-content text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 leading-relaxed text-sm font-medium opacity-80"
                  dangerouslySetInnerHTML={{ __html: article.ingress || "" }}
                />

                <div className="mt-auto pt-4 border-t border-gray-50 dark:border-slate-800/50 flex items-center justify-end">
                  <div className="social-share-container transition-opacity duration-500">
                    <SocialShare 
                      articleId={article.id}
                      articleTitle={article.title}
                      socialMedia={article.socialMedia}
                      socialLinks={article.socialLinks}
                      size="sm"
                      showLabel={false}
                      hideAdminLinks={true}
                    />
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
        >
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 text-center animate-in zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-8">
              <span className="text-4xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-black text-brand-dark dark:text-white uppercase mb-4 italic">Radera artikel?</h2>
            <p className="text-gray-500 dark:text-gray-400 font-bold text-sm mb-10 leading-relaxed">
              Är du säker på att du vill radera denna artikel? Denna åtgärd går inte att ångra.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setDeletingId(null)}
                className="py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 text-brand-dark dark:text-white font-black text-xs uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
              >
                Avbryt
              </button>
              <button
                onClick={() => deletingId && deleteArticle(deletingId)}
                className="py-4 rounded-2xl bg-red-500 text-white font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
              >
                Ja, radera
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Article Read Modal */}
      {selectedArticle && (
        <ArticleModal
          article={selectedArticle}
          isAdmin={isAdmin}
          onClose={() => setSelectedArticle(null)}
          onDelete={id => { setSelectedArticle(null); setDeletingId(id); }}
          onEdit={article => { setSelectedArticle(null); openEditModal(article); }}
        />
      )}

      {/* Article Edit / Create Lightbox */}
      {showEditModal && (
        <ArticleEditModal
          editingArticle={editingArticle as Article | null}
          accessToken={accessToken}
          onClose={() => setShowEditModal(false)}
          onSaved={handleArticleSaved}
        />
      )}

      <style jsx global>{`
        .article-rich-content a { color: #008080; text-decoration: underline; font-weight: 700; }
        .article-rich-content b, .article-rich-content strong { color: inherit; font-weight: 800; }
        .article-rich-content img { border-radius: 1rem; margin: 2rem 0; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); max-width: 100%; height: auto; }
        .article-rich-content h2, .article-rich-content h3 { font-weight: 900; color: #1a202c; text-transform: uppercase; margin-top: 3rem; margin-bottom: 1rem; }
        .dark .article-rich-content h2, .dark .article-rich-content h3 { color: #fff; }
      `}</style>
    </div>
  );
}
