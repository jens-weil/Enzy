"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import Image from "next/image";
import SocialShare from "@/components/SocialShare";
import Link from "next/link";

type Article = {
  id: string;
  title: string;
  type: string;
  date: string;
  imageUrl?: string;
  ingress?: string;
  content: string;
  socialMedia: any;
  socialLinks: any;
};

interface ArticleContentProps {
  article: Article;
}

export default function ArticleContent({ article }: ArticleContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showUpArrow, setShowUpArrow] = useState(false);
  const [showDownArrow, setShowDownArrow] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollRequestRef = useRef<number | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("sv-SE", { year: "numeric", month: "long", day: "numeric" });
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "pm": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800/50";
      case "news":
      case "nyhet": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800/50";
      case "article":
      case "artikel": return "bg-brand-light text-brand-dark dark:bg-brand-teal/20 dark:text-brand-light border-brand-teal/20";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700";
    }
  };

  const checkScrollLimit = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    setShowUpArrow(scrollTop > 20);
    setShowDownArrow(scrollTop + clientHeight < scrollHeight - 20);
  }, []);

  useEffect(() => {
    document.body.classList.add("article-view-mode");
    checkScrollLimit();
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollLimit);
      window.addEventListener("resize", checkScrollLimit);
      return () => {
        document.body.classList.remove("article-view-mode");
        container.removeEventListener("scroll", checkScrollLimit);
        window.removeEventListener("resize", checkScrollLimit);
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
    <div className="relative h-[calc(100vh-61px)] overflow-hidden bg-white dark:bg-slate-950">
      {/* Scrollable Area */}
      <div 
        ref={containerRef}
        className="h-full overflow-y-auto no-scrollbar"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
          <article className="space-y-12">
            <header className="space-y-8">
              <div className="flex items-center gap-4">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest ${getTypeColor(article.type)}`}>
                  {article.type.toUpperCase()}
                </span>
                <time className="text-[11px] font-black text-gray-400 uppercase tracking-widest italic">{formatDate(article.date)}</time>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-black text-brand-dark dark:text-white leading-[1.1] uppercase italic">
                {article.title}
              </h1>

              {article.imageUrl && (
                <div className="relative w-full aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl">
                  <Image src={article.imageUrl} alt={article.title} fill sizes="(max-width: 896px) 100vw, 896px" className="object-cover" priority />
                </div>
              )}
            </header>

            <div className="space-y-12">
              {article.ingress && (
                <div className="text-xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-relaxed border-l-8 border-brand-teal pl-8 italic">
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
              />

              <div
                className="article-rich-content text-gray-600 dark:text-gray-300 text-lg md:text-xl leading-[1.8] font-medium space-y-8"
                dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, "<br/>") }}
              />
            </div>

            <footer className="pt-24 border-t border-gray-100 dark:border-slate-800">
               <Link 
                href="/articles" 
                className="group px-10 py-4 rounded-2xl bg-brand-dark text-white font-black text-xs uppercase tracking-widest flex items-center gap-4 hover:bg-brand-teal transition-all w-fit shadow-xl"
              >
                <span className="group-hover:-translate-x-2 transition-transform">&larr;</span> Alla artiklar
              </Link>
            </footer>
          </article>
        </div>
      </div>

      {/* Navigation Arrows Overlay */}
      <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none flex flex-col items-center justify-between z-[100]">
        {/* Up Arrow */}
        <div className={`transition-all duration-700 transform ${showUpArrow ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-20 scale-50 pointer-events-none'}`}>
          <button
            onMouseEnter={() => startScrolling("up", 1.5)} 
            onMouseLeave={stopScrolling}
            onMouseDown={() => { stopScrolling(); startScrolling("up", 8); }} 
            onMouseUp={() => { stopScrolling(); startScrolling("up", 1.5); }}
            className={`pointer-events-auto p-4 rounded-full group transition-all duration-500 flex flex-col items-center gap-0 ${isScrolling ? 'text-brand-teal scale-110' : 'text-brand-dark/60 dark:text-white/60 blur-[1px] hover:blur-0 hover:text-brand-dark dark:hover:text-white animate-gunga'}`}
          >
            <ChevronUp size={80} strokeWidth={4} />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Scrolla upp</span>
          </button>
        </div>

        {/* Down Arrow */}
        <div className={`transition-all duration-700 transform ${showDownArrow ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-20 scale-50 pointer-events-none'}`}>
          <button
            onMouseEnter={() => startScrolling("down", 1.5)} 
            onMouseLeave={stopScrolling}
            onMouseDown={() => { stopScrolling(); startScrolling("down", 8); }} 
            onMouseUp={() => { stopScrolling(); startScrolling("down", 1.5); }}
            className={`pointer-events-auto p-4 rounded-full group transition-all duration-500 flex flex-col items-center gap-0 ${isScrolling ? 'text-brand-teal scale-110' : 'text-brand-dark/60 dark:text-white/60 blur-[1px] hover:blur-0 hover:text-brand-dark dark:hover:text-white animate-gunga'}`}
          >
            <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Scrolla ner</span>
            <ChevronDown size={80} strokeWidth={4} />
          </button>
        </div>
      </div>

      <style jsx global>{`
        body.article-view-mode, html.article-view-mode {
          overflow: hidden !important;
          height: 100% !important;
          max-height: 100vh !important;
        }
        
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
          50% { transform: translateY(-15px) scale(1.05); }
        }
        
        .animate-gunga {
          animation: gunga 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
