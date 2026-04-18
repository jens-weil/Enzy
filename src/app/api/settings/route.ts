import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireRole } from '@/lib/auth';
import { getSettingsPath } from '@/lib/settingsPath';

// Store settings OUTSIDE the project directory to prevent Turbopack's
// file watcher from triggering a dev-server rebuild on every settings save.
const settingsPath = getSettingsPath();

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
    },
    brevo: {
      isActive: false,
      apiKey: "",
      senderName: "Enzymatica",
      senderEmail: "news@enzymatica.se"
    },
    security: {
      siteLockActive: true,
      onboardingActive: true,
      siteCode: "0000",
      lockTimeoutMinutes: 60,
      updatedAt: 1713123456789
    },
    hero: {
      mode: "slideshow",
      interval: 8,
      useIndividualText: true,
      globalHeadline: "Forskning mot",
      globalHighlight: "infektioner",
      description: "ColdZyme® munspray skapar en skyddande barriär som verkar omedelbart mot förkylningsvirus.",
      slides: [
        {
          id: "1",
          src: "/media/hero_lab_researchers.png",
          alt: "Enzymatica virusforskning laboratorium med forskare",
          headline: "Forskning mot",
          highlight: "infektioner"
        },
        {
          id: "2",
          src: "/media/sick_person_hero.png",
          alt: "Person med förkylning och röd näsa",
          headline: "Undvik att bli",
          highlight: "förkyld"
        },
        {
          id: "3",
          src: "/media/hero_authentic.webp",
          alt: "Kvinna strålande frisk och fri från sin förkylning",
          headline: "Höj din",
          highlight: "livskvalitet"
        }
      ]
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
      brevo: { ...defaultSettings.brevo, ...(parsed.brevo || {}) },
      security: { ...defaultSettings.security, ...(parsed.security || {}) },
      hero: { ...defaultSettings.hero, ...(parsed.hero || {}) },
      translations: { ...defaultSettings.translations, ...(parsed.translations || {}) }
    };
  } catch (e) {
    return defaultSettings;
  }
}

export async function GET(request: NextRequest) {
  const settings = getSettings();
  
  const authHeader = request.headers.get("authorization");
  
  if (authHeader?.startsWith("Bearer ")) {
    // check for Admin/Editor role
    const auth = await requireRole(request, ['Admin', 'Editor', 'Redaktör']);
    if (auth.authorized) {
      // If authorized, return everything (sensitive tokens included)
      return NextResponse.json(settings);
    }
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
    security: {
      siteLockActive: settings.security?.siteLockActive ?? true,
      onboardingActive: settings.security?.onboardingActive ?? true,
      siteCode: settings.security?.siteCode || "0000",
      lockTimeoutMinutes: settings.security?.lockTimeoutMinutes || 60,
      updatedAt: settings.security?.updatedAt ?? 0
    },
    hero: settings.hero,
    translations: settings.translations
  };

  return NextResponse.json(publicSettings);
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ['Admin', 'Editor', 'Redaktör']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const isAdmin = auth.role === 'Admin';

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
      stock: isAdmin ? {
        ...currentSettings.stock,
        ...(body.stock || {})
      } : currentSettings.stock,
      translations: {
        ...currentSettings.translations,
        ...(body.translations || {})
      },
      brevo: {
        ...currentSettings.brevo,
        ...(body.brevo || {})
      },
      security: {
        ...currentSettings.security,
        ...(body.security || {}),
        // Force update timestamp if lock or onboarding toggles are changed
        updatedAt: (body.security?.siteLockActive !== undefined || body.security?.onboardingActive !== undefined) 
          ? Date.now() 
          : (currentSettings.security?.updatedAt || Date.now())
      },
      hero: {
        ...currentSettings.hero,
        ...(body.hero || {})
      }
    };

    // Ensure the data directory exists
    const settingsDir = path.dirname(settingsPath);
    if (!fs.existsSync(settingsDir)) {
      fs.mkdirSync(settingsDir, { recursive: true });
    }

    fs.writeFileSync(settingsPath, JSON.stringify(newSettings, null, 2), 'utf8');
    return NextResponse.json(newSettings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
