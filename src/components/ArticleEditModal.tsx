"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { SOCIAL_ICONS } from "./SocialShare";
import RichTextEditor from "./RichTextEditor";

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
  const [availableImages, setAvailableImages] = useState<{ url: string; tags: string[] }[]>([]);
  const [imageSearch, setImageSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [showStreamingPicker, setShowStreamingPicker] = useState(false);
  const [streamData, setStreamData] = useState({ service: "youtube", url: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; title: string; thumbnail: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [channelSettings, setChannelSettings] = useState<any>(null);
  const [imageUsageError, setImageUsageError] = useState<{ url: string; articles: { id: string; title: string }[] } | null>(null);
  const [taggingImage, setTaggingImage] = useState<{ url: string; tags: string[] } | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [deletingImage, setDeletingImage] = useState<string | null>(null);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [mediaInsertMode, setMediaInsertMode] = useState(false);
  const [editorRef, setEditorRef] = useState<any>(null);

  useEffect(() => {
    // Fetch settings - used for channel visibility
    fetch("/api/settings", { 
      headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {} 
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => data && setChannelSettings(data))
      .catch(console.error);

    // Fetch images - now public GET for robustness
    fetch("/api/images")
      .then(r => r.ok ? r.json() : { images: [] })
      .then(d => {
        if (d.images) {
          setAvailableImages(d.images);
        }
      })
      .catch(err => console.error("Failed to load images:", err));
  }, []); // Run once on mount to ensure images are ready when modal opens

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
      const res = await fetch("/api/images", { 
        method: "POST", 
        headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
        body 
      });
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, imageUrl: data.url }));
        setAvailableImages(prev => [...prev, { url: data.url, tags: [] }]);
        setShowMediaPicker(false);
      } else {
        const err = await res.json();
        setMessage({ type: "error", text: err.error || "Kunde inte ladda upp fil." });
      }
    } catch {
      setMessage({ type: "error", text: "Kunde inte ladda upp fil." });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = (url: string) => {
    setDeletingImage(url);
  };

  const confirmDeleteImage = async (url: string) => {
    if (!accessToken) return setPickerError("Du måste vara inloggad för att radera bilder.");
    
    setLocalLoading(true);
    setPickerError(null);
    setImageUsageError(null);
    try {
      const res = await fetch(`/api/images?url=${encodeURIComponent(url)}`, {
        method: "DELETE",
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setAvailableImages(prev => prev.filter(img => img.url !== url));
        if (formData.imageUrl === url) setFormData(p => ({ ...p, imageUrl: "" }));
        setDeletingImage(null);
      } else {
        const err = await res.json();
        if (err.articles) {
          setImageUsageError({ url, articles: err.articles });
          setDeletingImage(null);
        } else {
          setPickerError(err.error || "Radering misslyckades.");
        }
      }
    } catch {
      setPickerError("Något gick fel vid radering.");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleUpdateTags = (url: string, tags: string[]) => {
    setTaggingImage({ url, tags });
    setTagInput(tags.join(", "));
    setPickerError(null);
  };

  const confirmUpdateTags = async () => {
    if (!taggingImage || !accessToken) {
      if (!accessToken) setPickerError("Du måste vara inloggad för att ändra taggar.");
      return;
    }
    
    setLocalLoading(true);
    setPickerError(null);
    const tags = tagInput.split(",").map(t => t.trim()).filter(Boolean);
    try {
      const res = await fetch("/api/images", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({ url: taggingImage.url, tags })
      });
      if (res.ok) {
        setAvailableImages(prev => prev.map(img => img.url === taggingImage.url ? { ...img, tags } : img));
        setTaggingImage(null);
      } else {
        const err = await res.json();
        setPickerError(err.error || "Kunde inte uppdatera taggar.");
      }
    } catch {
      setPickerError("Kunde inte uppdatera taggar.");
    } finally {
      setLocalLoading(false);
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
        
        if (data.warning) {
          setMessage({ type: "error", text: `${isEditing ? "Artikeln uppdaterades" : "Artikeln publicerades"}, men med varning: ${data.warning}` });
          // Don't close immediately if there's a warning so user can read it
          setTimeout(() => {
            onSaved(saved, !isEditing);
            onClose();
          }, 8000);
        } else {
          setMessage({ type: "success", text: isEditing ? "Artikeln har uppdaterats!" : "Artikeln har publicerats!" });
          setTimeout(() => {
            onSaved(saved, !isEditing);
            onClose();
          }, 1000);
        }
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
    
    // Check if it's a direct URL or HTML for Custom Embed
    if (streamData.service === "custom") {
      setSearchResults([{ id: "custom", title: "Anpassad inbäddning", thumbnail: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=100&h=100&fit=crop" }]);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`/api/videos/search?service=${streamData.service}&q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      }
    } catch (err) {
      console.error("Video search failed:", err);
    } finally {
      setSearching(false);
    }
  };

  const handleMediaSelect = (url: string) => {
    if (mediaInsertMode && editorRef) {
      editorRef.chain().focus().setImage({ src: url }).run();
      setMediaInsertMode(false);
    } else {
      setFormData(p => ({ ...p, imageUrl: url }));
    }
    setShowMediaPicker(false);
  };

  const handleStreamSelect = (video: any) => {
    if (mediaInsertMode && editorRef) {
      if (streamData.service === "youtube") {
        editorRef.chain().focus().setYoutubeVideo({ src: `https://www.youtube.com/watch?v=${video.id}` }).run();
      } else if (streamData.service === "vimeo") {
        editorRef.chain().focus().insertContent(`<iframe src="https://player.vimeo.com/video/${video.id}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`).run();
      } else if (streamData.service === "twitch") {
        editorRef.chain().focus().insertContent(`<iframe src="https://player.twitch.tv/?video=${video.id}&parent=${window.location.hostname}" frameborder="0" allowfullscreen="true" scrolling="no"></iframe>`).run();
      } else if (streamData.service === "custom") {
        // Here we use the searchQuery directly as the iframe code
        editorRef.chain().focus().insertContent(searchQuery).run();
      }
      setMediaInsertMode(false);
    } else {
      // Set as thumbnail fallback for main image
      setFormData(prev => ({ ...prev, imageUrl: video.thumbnail }));
    }
    setShowStreamingPicker(false);
    setSearchQuery("");
    setSearchResults([]);
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
                  src={formData.imageUrl || "/media/logo.png"}
                  alt="Preview"
                  fill
                  sizes="128px"
                  className={`object-cover ${!formData.imageUrl && "p-6 opacity-20"}`}
                />
              </div>
              <div className="space-y-3">
                <p className="text-sm font-bold text-gray-600 dark:text-gray-400">Välj en representativ bild för din artikel.</p>
                <button
                  type="button"
                  onClick={() => { setMediaInsertMode(false); setShowMediaPicker(true); }}
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
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Brödtext (Artikelinnehåll)</label>
            <RichTextEditor 
              content={formData.content} 
              onChange={(html) => setFormData(prev => ({ ...prev, content: html }))}
              onMediaClick={() => {
                setMediaInsertMode(true);
                setShowMediaPicker(true);
              }}
              onVideoClick={() => {
                setMediaInsertMode(true);
                setShowStreamingPicker(true);
              }}
              // Capture editor instance for insertion
              // We'll use a hacky way since TipTap useEditor doesn't work well with refs
              //@ts-ignore
              ref={(r) => { if (r?.editor) setEditorRef(r.editor); }}
            />
          </div>

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
            <div className="px-7 py-4 bg-gray-50 dark:bg-slate-800 flex gap-4 border-b border-gray-100 dark:border-slate-800">
               <input 
                type="text" 
                placeholder="Filtrera på taggar eller filnamn..."
                className="flex-1 px-5 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 outline-none focus:border-brand-teal transition-all font-bold italic text-sm"
                value={imageSearch}
                onChange={(e) => setImageSearch(e.target.value)}
               />
            </div>
            <div className="flex-1 overflow-y-auto p-7">
              {/* Media Actions & Errors - Sticky Header Overlay */}
              <AnimatePresence>
                {(imageUsageError || taggingImage || deletingImage) && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="sticky top-0 z-[100] mb-6 -mx-7 -mt-7 p-7 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 shadow-xl shadow-black/5"
                  >
                    <div className="max-w-2xl mx-auto">
                      {imageUsageError && (
                        <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-3xl animate-in zoom-in-95">
                          <p className="text-red-700 dark:text-red-400 font-black text-[10px] uppercase tracking-widest mb-2 italic">⚠️ Går ej att radera!</p>
                          <p className="text-red-600 dark:text-red-400 text-sm font-bold mb-4">Bilden används för närvarande i:</p>
                          <ul className="space-y-2 mb-6">
                            {imageUsageError.articles.map(a => (
                              <li key={a.id} className="text-xs font-bold text-red-500 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                                {a.title}
                              </li>
                            ))}
                          </ul>
                          <button 
                            onClick={() => setImageUsageError(null)}
                            className="w-full py-3 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                          >
                            Jag förstår
                          </button>
                        </div>
                      )}

                      {taggingImage && (
                        <div className="p-6 bg-brand-teal/5 border border-brand-teal/20 rounded-3xl animate-in zoom-in-95">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-brand-teal italic">Redigera taggar för bild</p>
                              <h4 className="text-[10px] font-bold text-gray-400 mt-1 truncate max-w-xs">{taggingImage.url}</h4>
                            </div>
                            {taggingImage.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 justify-end">
                                {taggingImage.tags.map((t, ti) => (
                                  <span key={ti} className="px-2 py-0.5 bg-brand-teal/10 text-brand-teal text-[8px] font-black uppercase rounded-md">{t}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <input 
                            type="text"
                            disabled={localLoading}
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            className="w-full px-5 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 outline-none focus:border-brand-teal transition-all font-bold text-sm mb-4 disabled:opacity-50"
                            placeholder="Taggar (kommaseparerade)..."
                            autoFocus
                            onKeyDown={(e) => e.key === "Enter" && confirmUpdateTags()}
                          />

                          {pickerError && (
                            <p className="text-[10px] font-bold text-red-500 mb-4 animate-pulse">⚠️ {pickerError}</p>
                          )}

                          <div className="flex gap-3">
                            <button 
                              disabled={localLoading}
                              onClick={confirmUpdateTags} 
                              className="flex-1 py-3 bg-brand-teal text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-dark transition-all disabled:opacity-50"
                            >
                              {localLoading ? "Sparar..." : "Spara ändringar"}
                            </button>
                            <button 
                              disabled={localLoading}
                              onClick={() => { setTaggingImage(null); setPickerError(null); }} 
                              className="flex-1 py-3 bg-gray-100 dark:bg-slate-800 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                            >
                              Avbryt
                            </button>
                          </div>
                        </div>
                      )}

                      {deletingImage && (
                        <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-3xl animate-in zoom-in-95">
                          <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-2 italic">Bekräfta radering</p>
                          <p className="text-sm font-bold text-red-500 mb-6">Är du säker på att du vill ta bort den här bilden permanent?</p>
                          
                          {pickerError && (
                            <p className="text-[10px] font-bold text-red-700 mb-4 animate-pulse">⚠️ {pickerError}</p>
                          )}

                          <div className="flex gap-3">
                            <button 
                              disabled={localLoading}
                              onClick={() => confirmDeleteImage(deletingImage)} 
                              className="flex-1 py-3 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50"
                            >
                              {localLoading ? "Raderar..." : "Ja, radera helt"}
                            </button>
                            <button 
                              disabled={localLoading}
                              onClick={() => { setDeletingImage(null); setPickerError(null); }} 
                              className="flex-1 py-3 bg-gray-100 dark:bg-slate-800 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                            >
                              Nej, avbryt
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                <label className="relative aspect-square rounded-[2rem] border-2 border-dashed border-brand-teal/30 flex flex-col items-center justify-center cursor-pointer hover:bg-brand-teal/5 hover:border-brand-teal transition-all group overflow-hidden">
                  <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*,video/*" />
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
                {availableImages
                .filter(img => {
                  if (!imageSearch) return true;
                  const s = imageSearch.toLowerCase();
                  return img.url.toLowerCase().includes(s) || img.tags.some(t => t.toLowerCase().includes(s));
                })
                .map((img, i) => (
                  <div
                    key={i}
                    className="group relative aspect-square rounded-[2rem] overflow-hidden"
                  >
                    <Image 
                      src={img.url} 
                      alt="Media" 
                      fill 
                      sizes="(max-width: 640px) 50vw, 20vw" 
                      className="object-cover cursor-pointer" 
                      onClick={() => handleMediaSelect(img.url)}
                    />
                    
                    {/* Selection Overlay - Lower Z-index */}
                    <div 
                      onClick={() => handleMediaSelect(img.url)}
                      className={`absolute inset-0 z-10 bg-brand-teal/30 transition-opacity flex items-center justify-center cursor-pointer ${formData.imageUrl === img?.url ? "opacity-100" : "opacity-0 group-hover:opacity-40"}`}
                    >
                      {formData.imageUrl === img?.url && <span className="text-white text-3xl font-black">✓</span>}
                    </div>

                    {/* Controls Overlay - TOP positioned and high Z-index */}
                    <div className="absolute inset-x-0 top-0 p-2 z-50 transform -translate-y-full group-hover:translate-y-0 transition-transform bg-black/60 backdrop-blur-sm flex justify-between items-center">
                      <button 
                        type="button"
                        onClick={(e) => { 
                          e.preventDefault(); 
                          e.stopPropagation(); 
                          if (img?.url) {
                            handleUpdateTags(img.url, img.tags || []); 
                          }
                        }}
                        className="p-2 bg-white/10 hover:bg-brand-teal text-white rounded-xl transition-all relative z-[60]"
                        title="Redigera taggar"
                      >
                        <svg className="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => { 
                          e.preventDefault(); 
                          e.stopPropagation(); 
                          if (img?.url) {
                            handleDeleteImage(img.url); 
                          }
                        }}
                        className="p-2 bg-white/10 hover:bg-red-500 text-white rounded-xl transition-all relative z-[60]"
                        title="Radera"
                      >
                        <svg className="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>

                    {/* Tag Badges - Moved to bottom when controls are at top */}
                    {img?.tags?.length > 0 && (
                      <div className="absolute bottom-2 left-2 flex flex-wrap gap-1 pointer-events-none z-10">
                        {img.tags.slice(0, 2).map((t, ti) => (
                          <span key={ti} className="px-1.5 py-0.5 bg-black/50 text-[6px] font-black text-white uppercase tracking-widest rounded-md backdrop-blur-sm">{t}</span>
                        ))}
                        {img.tags.length > 2 && <span className="px-1.5 py-0.5 bg-black/50 text-[6px] font-black text-white uppercase tracking-widest rounded-md backdrop-blur-sm">+{img.tags.length - 2}</span>}
                      </div>
                    )}
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
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">YouTube, Vimeo, Twitch eller Custom</p>
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
                {["youtube", "vimeo", "twitch", "custom"].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStreamData(p => ({ ...p, service: s }))}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${streamData.service === s ? "bg-white dark:bg-slate-700 text-brand-teal shadow-md" : "text-gray-400"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                  {streamData.service === "custom" ? "Klistra in <iframe> kod" : "Sök eller ange URL"}
                </label>
                <div className="flex gap-2">
                  {streamData.service === "custom" ? (
                    <textarea 
                      placeholder="Klistra in inbäddningskod här (<iframe>...</iframe>)..."
                      className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border-2 border-transparent focus:border-brand-teal outline-none font-mono text-xs h-32"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder={`Sök på ${streamData.service} eller klistra in länk...`}
                      className="flex-1 px-5 py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border-2 border-transparent focus:border-brand-teal outline-none font-bold italic"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleSearch())}
                    />
                  )}
                  <button
                    type="button"
                    onClick={handleSearch}
                    disabled={searching || !searchQuery}
                    className="px-6 rounded-2xl bg-brand-dark text-white font-black text-[10px] uppercase tracking-widest hover:bg-brand-teal transition-all disabled:opacity-50"
                  >
                    {searching ? "..." : (streamData.service === "custom" ? "Klar" : "Sök")}
                  </button>
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {searchResults.map((video) => (
                    <button
                      key={video.id}
                      type="button"
                      onClick={() => handleStreamSelect(video)}
                      className="group flex items-start gap-4 p-4 rounded-3xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all text-left"
                    >
                      <div className="relative w-24 aspect-video rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                        <Image src={video.thumbnail} alt={video.title} fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors flex items-center justify-center">
                           <div className="w-8 h-8 rounded-full bg-brand-teal text-white flex items-center justify-center translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">▶</div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-brand-dark dark:text-white line-clamp-2 leading-tight">{video.title}</p>
                        <p className="text-[10px] font-black text-brand-teal uppercase tracking-widest mt-1">Välj video</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
