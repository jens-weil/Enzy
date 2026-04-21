import fs from 'fs';
import path from 'path';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SocialShare from '@/components/SocialShare';
import { getSettingsPath } from '@/lib/settingsPath';
import ArticleContent from '@/components/ArticleContent';

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





export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticle(id);

  if (!article) {
    notFound();
  }

  return (
    <div className="bg-white dark:bg-slate-950">
      <ArticleContent 
        article={article} 
      />
      
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
