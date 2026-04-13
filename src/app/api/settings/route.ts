import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireRole } from '@/lib/auth';

const settingsPath = path.join(process.cwd(), 'data', 'settings.json');

function getSettings() {
  const defaultSettings = {
    facebook: {
      isActive: true,
      postStrategy: "comment",
      pageId: "",
      accessToken: "",
      appId: ""
    },
    instagram: {
      isActive: false,
      accountId: "",
      accessToken: ""
    },
    linkedin: {
      isActive: false,
      authorUrn: "",
      accessToken: ""
    },
    tiktok: {
      isActive: false,
      openId: "",
      accessToken: ""
    },
    x: {
      isActive: false,
      accessToken: ""
    },
    stock: {
      isActive: true,
      ticker: "ENZY.ST",
      shares: "142 823 696",
      sector: "Hälsovård"
    },
    translations: {
      userStatuses: {
        "Approved": "Godkänd",
        "Pending": "Väntar",
        "Rejected": "Nekad",
        "Banned": "Deaktiverad"
      }
    }
  };

  if (!fs.existsSync(settingsPath)) {
    return defaultSettings;
  }
  
  try {
    const data = fs.readFileSync(settingsPath, 'utf8');
    const parsed = JSON.parse(data);
    
    // Migrate legacy unstructured setting if present
    if (parsed.facebookPostStrategy && !parsed.facebook) {
      parsed.facebook = { ...defaultSettings.facebook, postStrategy: parsed.facebookPostStrategy };
      delete parsed.facebookPostStrategy;
    }
    
    return {
      facebook: { ...defaultSettings.facebook, ...parsed.facebook },
      instagram: { ...defaultSettings.instagram, ...parsed.instagram },
      linkedin: { ...defaultSettings.linkedin, ...parsed.linkedin },
      tiktok: { ...defaultSettings.tiktok, ...parsed.tiktok },
      x: { ...defaultSettings.x, ...parsed.x },
      stock: { ...defaultSettings.stock, ...parsed.stock },
      translations: { ...defaultSettings.translations, ...(parsed.translations || {}) }
    };
  } catch (e) {
    return defaultSettings;
  }
}



export async function GET(request: NextRequest) {
  const settings = getSettings();
  
  // check for Admin/Editor role
  const auth = await requireRole(request, ['Admin', 'Editor', 'Redaktör']);
  if (auth.authorized) {
    // If authorized, return everything (sensitive tokens included)
    return NextResponse.json(settings);
  }

  // If not authorized, return a public-safe subset (only isActive flag for each channel)
  const publicSettings = {
    facebook: { isActive: settings.facebook.isActive },
    instagram: { isActive: settings.instagram.isActive },
    linkedin: { isActive: settings.linkedin.isActive },
    tiktok: { isActive: settings.tiktok.isActive },
    x: { isActive: settings.x?.isActive || false },
    stock: { 
      isActive: settings.stock?.isActive ?? true,
      ticker: settings.stock?.ticker || "ENZY.ST",
      shares: settings.stock?.shares || "",
      sector: settings.stock?.sector || ""
    },
    translations: settings.translations
  };

  return NextResponse.json(publicSettings);
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ['Admin']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const currentSettings = getSettings();
    
    // Deep merge
    const newSettings = {
      ...currentSettings,
      facebook: {
        ...currentSettings.facebook,
        ...(body.facebook || {})
      },
      instagram: {
        ...currentSettings.instagram,
        ...(body.instagram || {})
      },
      linkedin: {
        ...currentSettings.linkedin,
        ...(body.linkedin || {})
      },
      tiktok: {
        ...currentSettings.tiktok,
        ...(body.tiktok || {})
      },
      x: {
        ...currentSettings.x,
        ...(body.x || {})
      },
      stock: {
        ...currentSettings.stock,
        ...(body.stock || {})
      },
      translations: {
        ...currentSettings.translations,
        ...(body.translations || {})
      }
    };

    // Ensure directory exists
    const dir = path.dirname(settingsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(settingsPath, JSON.stringify(newSettings, null, 2), 'utf8');
    return NextResponse.json(newSettings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
