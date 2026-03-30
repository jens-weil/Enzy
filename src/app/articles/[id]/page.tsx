import fs from 'fs';
import path from 'path';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

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
  };
  socialLinks: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    tiktok?: string;
  };
};

async function getArticle(id: string): Promise<Article | null> {
  const filePath = path.join(process.cwd(), 'data', 'articles.json');
  try {
    const fileData = fs.readFileSync(filePath, 'utf8');
    const articles = JSON.parse(fileData) as Article[];
    return articles.find(a => a.id === id) || null;
  } catch (error) {
    console.error("Failed to read articles file:", error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticle(id);
  
  if (!article) return { title: 'Artikel hittades inte' };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://enzymatica.se';

  return {
    title: `${article.title} | Enzymatica`,
    description: article.ingress,
    openGraph: {
      title: article.title,
      description: article.ingress,
      url: `${siteUrl}/articles/${id}`,
      siteName: 'Enzymatica',
      images: [
        {
          url: article.imageUrl?.startsWith('http') ? article.imageUrl : `${siteUrl}${article.imageUrl || '/logo.png'}`,
          width: 1200,
          height: 630,
        },
      ],
      type: 'article',
    },
  };
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

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z"/>
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.984 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.058.935 20.39.522 19.6 0.31c.296-.058 1.636-.261 2.913-.072C15.667 0.015 15.26 0 12 0zm0 2.16c3.203 0 3.58.016 4.85.074 1.17.054 1.802.249 2.227.415.562.217.96.477 1.381.896.419.42.679.819.896 1.381.166.425.361 1.057.415 2.227.058 1.27.074 1.647.074 4.85s-.016 3.58-.074 4.85c-.054 1.17-.249 1.802-.415 2.227-.217.562-.477.96-.896 1.381-.42.419-.819.679-1.381.896-.425.166-1.057.361-2.227.415-1.27.058-1.647.074-4.85.074s-3.58-.016-4.85-.074c-1.17-.054-1.802-.249-2.227-.415-.562-.217-.96-.477-1.381-.896-.419-.42-.679-.819-.896-1.381-.166-.425-.361-1.057-.415-2.227C2.176 15.58 2.16 15.203 2.16 12s.016-3.58.074-4.85c.054-1.17.249-1.802.415-2.227.217-.562.477-.96.896-1.381.42-.419.819-.679 1.381-.896.425-.166 1.057-.361 2.227-.415 1.27-.058 1.647-.074 4.85-.074zm0 3.678c-3.413 0-6.162 2.748-6.162 6.162 0 3.413 2.749 6.162 6.162 6.162 3.413 0 6.162-2.749 6.162-6.162 0-3.414-2.749-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.645-1.44-1.44 0-.794.645-1.439 1.44-1.439.794 0 1.44.645 1.44 1.439z"/>
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.01.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.59-1.01V14.5c.01 2.32-.6 4.67-2.06 6.47-2.95 3.64-8.56 4.08-12.08 1.08-3.03-2.58-3.57-7.44-1.26-10.67 1.88-2.63 5.22-3.72 8.35-2.76V12.7c-1.32-.46-2.88-.35-4.03.48-1.36.98-1.77 2.82-1.14 4.31.55 1.29 1.89 2.14 3.27 2.23 1.58.07 3.16-.92 3.73-2.39.15-.36.2-.76.2-1.15V.02z"/>
    </svg>
  ),
};

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticle(id);

  if (!article) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 py-12 md:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link 
          href="/articles" 
          className="inline-flex items-center gap-2 text-brand-teal font-black text-[10px] uppercase tracking-widest mb-12 hover:gap-4 transition-all"
        >
          <span>&larr;</span> Tillbaka till alla artiklar
        </Link>
        
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
                <Image src={article.imageUrl} alt={article.title} fill className="object-cover" priority />
              </div>
            )}
          </header>

          <div className="space-y-12">
            {article.ingress && (
              <div className="text-xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-relaxed border-l-8 border-brand-teal pl-8 italic">
                {article.ingress}
              </div>
            )}

            {/* Social Share / Media Info */}
            <div className="flex flex-wrap gap-6 items-center py-8 border-y border-gray-100 dark:border-slate-800">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Publicerad via</span>
              <div className="flex gap-3">
                {Object.entries(article.socialMedia).map(([platform, active]) => {
                  if (!active) return null;
                  const colors: Record<string, string> = {
                    facebook: "bg-blue-600 text-white",
                    linkedin: "bg-blue-700 text-white",
                    instagram: "bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 text-white",
                    tiktok: "bg-black text-white"
                  };
                  return (
                    <a
                      key={platform}
                      href={article.socialLinks?.[platform as keyof typeof article.socialLinks] || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center p-2.5 shadow-md ${colors[platform] || "bg-gray-200"} hover:scale-110 transition-transform`}
                      title={`Se på ${platform}`}
                    >
                      {SOCIAL_ICONS[platform]}
                    </a>
                  );
                })}
              </div>
            </div>

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
              <span className="group-hover:-translate-x-2 transition-transform">&larr;</span> Tillbaka till alla artiklar
            </Link>
          </footer>
        </article>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .article-rich-content a { color: #007c91; text-decoration: underline; font-weight: 800; }
        .article-rich-content b, .article-rich-content strong { color: inherit; font-weight: 900; }
        .article-rich-content img { border-radius: 2rem; margin: 3rem 0; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); max-width: 100%; height: auto; }
        .article-rich-content h2, .article-rich-content h3 { font-weight: 900; color: #003a4d; text-transform: uppercase; margin-top: 4rem; margin-bottom: 1.5rem; line-height: 1.2; }
        .dark .article-rich-content h2, .dark .article-rich-content h3 { color: #fff; }
        .article-rich-content h2 { font-size: 2rem; }
        .article-rich-content h3 { font-size: 1.5rem; }
        .article-rich-content ul { list-style-type: none; padding-left: 1.5rem; }
        .article-rich-content li { position: relative; margin-bottom: 1rem; }
        .article-rich-content li::before { content: "→"; position: absolute; left: -1.5rem; color: #007c91; font-weight: 900; }
      `}} />
    </div>
  );
}
