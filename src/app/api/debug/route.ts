import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const errorLogPath = path.join(process.cwd(), 'data', 'facebook_errors.log');
  const articlesPath = path.join(process.cwd(), 'data', 'articles.json');
  const settingsPath = path.join(process.cwd(), 'data', 'settings.json');
  
  let errorLogs = "No logs found yet.";
  if (fs.existsSync(errorLogPath)) {
    errorLogs = fs.readFileSync(errorLogPath, 'utf8');
  }

  const debugInfo = {
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      FB_PAGE_ID_EXISTS: !!process.env.FB_PAGE_ID,
      FB_PAGE_ACCESS_TOKEN_EXISTS: !!process.env.FB_PAGE_ACCESS_TOKEN,
      FB_PAGE_ID: process.env.FB_PAGE_ID ? process.env.FB_PAGE_ID.substring(0, 5) + "..." : "MISSING"
    },
    files: {
      errorLogExists: fs.existsSync(errorLogPath),
      articlesExists: fs.existsSync(articlesPath),
      settingsExists: fs.existsSync(settingsPath)
    },
    recentErrors: errorLogs.split('\n').slice(-20).join('\n')
  };

  return NextResponse.json(debugInfo);
}
