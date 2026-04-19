import fs from 'fs';
import path from 'path';
import Image from 'next/image';
import { getSettingsPath } from '@/lib/settingsPath';

type Article = {
  id: string;
  title: string;
  type: string;
  date: string;
  imageUrl?: string;
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

import ArticleFeed from '@/components/ArticleFeed';
async function getArticles() {
  const filePath = path.join(process.cwd(), 'data', 'articles.json');
  try {
    const fileData = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileData) as Article[];
  } catch (error) {
    console.error("Failed to read articles file:", error);
    return [];
  }
}

export default async function ArticlesPage() {
  const articles = await getArticles();
  
  // Sort articles by date (newest first)
  articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Get dynamic company name
  const settingsPath = getSettingsPath();
  let companyName = "Enzymatica";
  if (fs.existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      if (settings.company?.name) companyName = settings.company.name;
    } catch (e) {}
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-brand-dark dark:text-white mb-4">
          Nyheter & Artiklar
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Håll dig uppdaterad med de senaste pressmeddelandena, nyheterna och insikterna från {companyName}.
        </p>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 dark:bg-slate-900 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
          <p className="text-lg text-gray-500 dark:text-gray-400">Inga artiklar hittades.</p>
        </div>
      ) : (
        <ArticleFeed initialArticles={articles} />
      )}
    </div>
  );
}
