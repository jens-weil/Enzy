"use client";

import { useEffect } from "react";
import Image from "next/image";
import { SOCIAL_ICONS } from "./SocialShare";
import SocialShare from "./SocialShare";

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
};

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

interface ArticleModalProps {
  article: Article;
  isAdmin: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit: (article: Article) => void;
}

export default function ArticleModal({ article, isAdmin, onClose, onDelete, onEdit }: ArticleModalProps) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] bg-brand-dark/80 backdrop-blur-md overflow-y-auto px-2 py-4 md:px-4 md:py-12 lg:py-20"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-4xl mx-auto mt-4 md:mt-24 mb-12 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl flex flex-col relative animate-in slide-in-from-bottom-10 duration-700 min-h-[500px] md:min-h-[600px]"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-5 md:px-8 py-4 md:py-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center rounded-t-[1.5rem] md:rounded-t-[2rem]">
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
                  className="px-3 md:px-5 py-2 rounded-xl bg-brand-teal text-white font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-md hover:bg-brand-dark transition-all"
                >
                  Redigera
                </button>
                <button
                  onClick={() => onDelete(article.id)}
                  className="px-3 md:px-5 py-2 rounded-xl bg-red-500 text-white font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-md hover:bg-red-600 transition-all"
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

        <div className="p-6 md:p-16 flex-1 space-y-8 md:space-y-12 max-w-3xl mx-auto w-full pb-24">
          {article.imageUrl && (
            <div className="relative w-full aspect-video rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-2xl mb-8 md:mb-12 transform hover:scale-[1.01] transition-transform duration-500 group">
              <Image src={article.imageUrl} alt={article.title} fill sizes="(max-width: 1024px) 100vw, 896px" className="object-cover" />
              
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
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-brand-dark dark:text-white leading-[1.1] uppercase italic">
                {article.title}
              </h1>
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-10 md:w-12 bg-brand-teal rounded-full" />
                <time className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-widest italic">{formatDate(article.date)}</time>
              </div>
            </div>

            {article.ingress && (
              <div className="text-lg md:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-relaxed border-l-4 border-brand-teal pl-6 md:pl-8 italic mb-8">
                {article.ingress}
              </div>
            )}
            
            <SocialShare 
              articleId={article.id}
              articleTitle={article.title}
              articleImage={article.imageUrl}
              socialMedia={article.socialMedia}
              socialLinks={article.socialLinks}
              size="md"
              showLabel={true}
              hideAdminLinks={true}
            />
          </div>
          <div
            className="prose dark:prose-invert text-gray-600 dark:text-gray-300 text-lg leading-[1.8] font-medium"
            dangerouslySetInnerHTML={{ __html: article.content }}
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
