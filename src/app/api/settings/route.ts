import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const settingsPath = path.join(process.cwd(), 'data', 'settings.json');

function getSettings() {
  if (!fs.existsSync(settingsPath)) {
    return { facebookPostStrategy: "comment" };
  }
  const data = fs.readFileSync(settingsPath, 'utf8');
  return JSON.parse(data);
}

export async function GET() {
  try {
    const settings = getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to read settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const currentSettings = getSettings();
    
    const newSettings = {
      ...currentSettings,
      ...body
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
