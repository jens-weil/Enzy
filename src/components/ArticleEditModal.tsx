"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { SOCIAL_ICONS } from "./SocialShare";

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

    fetch("/api/images", { 
      headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {} 
    })
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
      const res = await fetch("/api/images", { 
        method: "POST", 
        headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
        body 
      });
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, imageUrl: data.url }));
        setAvailableImages(prev => [...prev, data.url]);
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
                  <button type="button" onClick={() => insertHtml('<img src="/media/logo.png" alt="Bild" />')} className="px-3 h-10 rounded-lg bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 hover:border-brand-teal transition-all text-[10px] font-black">MEDIA</button>
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
                {availableImages.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => { setFormData(p => ({ ...p, imageUrl: img })); setShowMediaPicker(false); }}
                    className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer transition-all ${
                      formData.imageUrl === img ? "ring-4 ring-brand-teal ring-offset-4 dark:ring-offset-slate-900" : "opacity-80 hover:opacity-100 hover:scale-[1.02]"
                    }`}
                  >
                    <Image src={img} alt="Media" fill sizes="(max-width: 640px) 50vw, 20vw" className="object-cover" />
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
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {searchResults.map((video) => (
                    <button
                      key={video.id}
                      type="button"
                      onClick={() => {
                        const embed = getEmbedHtml(streamData.service, video.id);
                        insertHtml(embed);
                        setShowStreamingPicker(false);
                        setSearchResults([]);
                        setSearchQuery("");
                      }}
                      className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all text-left group"
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
