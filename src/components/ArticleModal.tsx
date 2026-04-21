"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { SOCIAL_ICONS } from "./SocialShare";
import SocialShare from "./SocialShare";
import { ChevronUp, ChevronDown } from "lucide-react";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [showUpArrow, setShowUpArrow] = useState(false);
  const [showDownArrow, setShowDownArrow] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollRequestRef = useRef<number | null>(null);

  const checkScrollLimit = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    setShowUpArrow(scrollTop > 20);
    setShowDownArrow(scrollTop + clientHeight < scrollHeight - 20);
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    
    const container = containerRef.current;
    if (container) {
      const observer = new ResizeObserver(() => checkScrollLimit());
      observer.observe(container);
      // Also observe children to detect content changes properly
      Array.from(container.children).forEach(child => observer.observe(child));
      
      checkScrollLimit();
      return () => {
        document.body.style.overflow = "unset";
        observer.disconnect();
      };
    }
  }, [checkScrollLimit, article.content]);

  const startScrolling = (direction: "up" | "down", speed: number) => {
    if (scrollRequestRef.current) return;
    setIsScrolling(true);
    
    const scroll = () => {
      if (containerRef.current) {
        containerRef.current.scrollTop += direction === "down" ? speed : -speed;
        scrollRequestRef.current = requestAnimationFrame(scroll);
      }
    };
    
    scrollRequestRef.current = requestAnimationFrame(scroll);
  };

  const stopScrolling = () => {
    if (scrollRequestRef.current) {
      cancelAnimationFrame(scrollRequestRef.current);
      scrollRequestRef.current = null;
    }
    setIsScrolling(false);
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-brand-dark/80 backdrop-blur-md flex items-center justify-center p-2 md:p-4 lg:p-8"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[calc(100vh-1rem)] md:max-h-[min(92vh,1200px)] rounded-[1.5rem] md:rounded-[2rem] shadow-2xl flex flex-col relative animate-in slide-in-from-bottom-5 duration-700 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-5 md:px-8 py-4 md:py-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest ${getTypeColor(article.type)}`}>
              {article.type.toUpperCase()}
            </span>
          </div>

          {/* Up Arrow in Header */}
          <div className={`absolute left-1/2 -translate-x-1/2 transition-all duration-700 transform ${showUpArrow ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-10 scale-50 pointer-events-none'}`}>
            <button
              onMouseEnter={() => startScrolling("up", 1.5)} 
              onMouseLeave={stopScrolling}
              onMouseDown={() => { stopScrolling(); startScrolling("up", 8); }} 
              onMouseUp={() => { stopScrolling(); startScrolling("up", 1.5); }}
              className={`pointer-events-auto p-2 rounded-full group transition-all duration-500 flex flex-col items-center justify-center ${isScrolling ? 'text-brand-teal scale-110' : 'text-brand-dark/60 dark:text-white/60 blur-[1px] hover:blur-0 hover:text-brand-dark dark:hover:text-white animate-gunga'}`}
            >
              <ChevronUp size={72} strokeWidth={4} />
              <span className="absolute -bottom-3 text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Scrolla upp</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <>
                <button
                  onClick={() => { onClose(); onEdit(article); }}
                  className="px-3 md:px-5 py-2 rounded-xl bg-brand-teal text-white font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-md hover:bg-brand-teal/80 transition-all"
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

        <div className="flex-1 min-h-0 relative flex flex-col">
          <div 
            ref={containerRef}
            onScroll={checkScrollLimit}
            className="flex-1 overflow-y-auto no-scrollbar relative"
          >
            <div className="p-6 md:p-16 space-y-8 md:space-y-12 max-w-3xl mx-auto w-full pb-24">
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
                className="article-rich-content prose dark:prose-invert text-gray-600 dark:text-gray-300 text-lg leading-[1.8] font-medium space-y-8"
                dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, "<br/>") }}
              />
              <div className="pt-16 border-t border-gray-100 dark:border-slate-800 flex justify-end items-center">
                <button onClick={onClose} className="group px-8 py-3 rounded-2xl bg-brand-dark text-white font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-brand-teal transition-all">
                  <span className="group-hover:-translate-x-1 transition-transform">←</span> Tillbaka till listan
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Arrows Overlay - Absolute positioned over the flex container */}
          <div className="absolute inset-x-0 bottom-0 pointer-events-none z-[120] flex flex-col items-center justify-end pb-0">
            {/* Down Arrow */}
            <div className={`transition-all duration-700 transform ${showDownArrow ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-50 pointer-events-none'}`}>
              <button
                onMouseEnter={() => startScrolling("down", 1.5)} 
                onMouseLeave={stopScrolling}
                onMouseDown={() => { stopScrolling(); startScrolling("down", 8); }} 
                onMouseUp={() => { stopScrolling(); startScrolling("down", 1.5); }}
                className={`pointer-events-auto p-4 rounded-full group transition-all duration-500 flex flex-col items-center gap-0 ${isScrolling ? 'text-brand-teal scale-110 shadow-brand-teal/20' : 'text-brand-dark/60 dark:text-white/60 blur-[1px] hover:blur-0 hover:text-brand-dark dark:hover:text-white animate-gunga'}`}
              >
                <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Scrolla ner</span>
                <ChevronDown size={72} strokeWidth={4} />
              </button>
            </div>
          </div>
        </div>

        <style jsx global>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          .no-scrollbar {
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
          }
          
          @keyframes gunga {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-10px) scale(1.05); }
          }
          
          .animate-gunga {
            animation: gunga 3s ease-in-out infinite;
          }
        `}</style>
      </div>
    </div>
  );
}
