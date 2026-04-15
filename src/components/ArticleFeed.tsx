"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useAuth } from "./AuthContext";
import { supabase } from "@/lib/supabase";
import SocialShare, { SOCIAL_ICONS } from "./SocialShare";

// Lazy load heavy modals
const ArticleModal = dynamic(() => import("./ArticleModal"), { ssr: false });
const ArticleEditModal = dynamic(() => import("./ArticleEditModal"), { ssr: false });

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
  const isAdmin = profile?.role === "Admin" || profile?.role === "Editor" || profile?.role === "Redaktör";

  // Edit / Create lightbox
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const openCreateModal = () => { setEditingArticle(null); setShowEditModal(true); };
  const openEditModal = (article: Article) => { setEditingArticle(article); setShowEditModal(true); };

  useEffect(() => {
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
          {filteredArticles.map((article) => (
            <motion.article
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              key={article.id}
              className="group flex flex-col bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all duration-700 cursor-pointer h-full"
              onClick={(e) => {
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
                  src={article.imageUrl || "/media/logo.png"}
                  alt={article.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className={`object-cover transition-transform duration-1000 group-hover:scale-105 ${!article.imageUrl && "p-12 object-contain opacity-40"}`}
                />
                <div className="absolute top-5 left-5 z-10">
                  <span className={`px-5 py-2 rounded-full text-[9px] font-black tracking-widest shadow-xl backdrop-blur-md ${getTypeColor(article.type)}`}>
                    {article.type.toUpperCase()}
                  </span>
                </div>
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

              {/* Content Section */}
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
                
                <div 
                  className="article-rich-content text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 leading-relaxed text-sm font-medium opacity-80"
                  dangerouslySetInnerHTML={{ __html: article.ingress || "" }}
                />

                <div className="mt-auto pt-4 border-t border-gray-50 dark:border-slate-800/50 flex items-center justify-end">
                  <div className="social-share-container transition-opacity duration-500">
                    <SocialShare 
                      articleId={article.id}
                      articleTitle={article.title}
                      articleImage={article.imageUrl}
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
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-8">
              <span className="text-4xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-black text-brand-dark dark:text-white uppercase mb-4 italic">Radera artikel?</h2>
            <p className="text-gray-500 dark:text-gray-400 font-bold text-sm mb-10 leading-relaxed">
              Är du säker på att du vill radera denna artikel? Denna åtgärd går inte att ångra.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setDeletingId(null)} className="py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 text-brand-dark dark:text-white font-black text-xs uppercase tracking-widest">Avbryt</button>
              <button onClick={() => deletingId && deleteArticle(deletingId)} className="py-4 rounded-2xl bg-red-500 text-white font-black text-xs uppercase tracking-widest">Ja, radera</button>
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
          editingArticle={editingArticle}
          accessToken={accessToken}
          onClose={() => setShowEditModal(false)}
          onSaved={handleArticleSaved}
        />
      )}

      <style jsx global>{`
        .article-rich-content a { color: #008080; text-decoration: underline; font-weight: 700; }
        .article-rich-content img { border-radius: 1rem; margin: 2rem 0; max-width: 100%; height: auto; }
        .article-rich-content h2, .article-rich-content h3 { font-weight: 900; color: #1a202c; text-transform: uppercase; margin-top: 3rem; margin-bottom: 1rem; }
        .dark .article-rich-content h2, .dark .article-rich-content h3 { color: #fff; }
      `}</style>
    </div>
  );
}
