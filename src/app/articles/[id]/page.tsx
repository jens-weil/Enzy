import fs from 'fs';
import path from 'path';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SocialShare from '@/components/SocialShare';
import { getSettingsPath } from '@/lib/settingsPath';

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

  const settingsPath = getSettingsPath();
  let companyName = "Enzymatica";
  if (fs.existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      if (settings.company?.name) companyName = settings.company.name;
    } catch (e) {}
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://enzymatica.se';

  return {
    title: `${article.title} | ${companyName}`,
    description: article.ingress,
    openGraph: {
      title: article.title,
      description: article.ingress,
      url: `${siteUrl}/articles/${id}`,
      siteName: companyName,
      images: [
        {
          url: article.imageUrl?.startsWith('http') ? article.imageUrl : `${siteUrl}${article.imageUrl || '/media/logo.png'}`,
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

            {/* Social Share / Media Info */}
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
