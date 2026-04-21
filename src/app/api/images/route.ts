import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireRole } from '@/lib/auth';

const metadataPath = path.join(process.cwd(), 'data', 'media_metadata.json');

function getMetadata() {
  try {
    if (fs.existsSync(metadataPath)) {
      return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    }
  } catch (e) {
    console.error("Error reading media metadata:", e);
  }
  return {};
}

function saveMetadata(data: any) {
  try {
    fs.writeFileSync(metadataPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error("Error saving media metadata:", e);
  }
}

export async function GET(request: NextRequest) {
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'media');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const getAllFiles = (dirPath: string, arrayOfFiles: string[] = []): string[] => {
      if (!fs.existsSync(dirPath)) return arrayOfFiles;
      const files = fs.readdirSync(dirPath).filter(f => !f.startsWith('.'));
      files.forEach((file) => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
          arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else {
          arrayOfFiles.push(fullPath);
        }
      });
      return arrayOfFiles;
    };

    const allFiles = getAllFiles(uploadDir);
    const metadata = getMetadata();
    
    const images = allFiles.map(fullPath => {
      const relativePath = path.relative(path.join(process.cwd(), 'public'), fullPath);
      const url = `/${relativePath.replace(/\\/g, '/')}`;
      return {
        url,
        tags: metadata[url]?.tags || []
      };
    });
    
    // Add default images if they exist
    ['/media/logo.png', '/media/hero.png', '/media/hero_authentic.webp'].forEach(img => {
      if (fs.existsSync(path.join(process.cwd(), 'public', img))) {
        if (!images.find(i => i.url === img)) {
          images.push({ url: img, tags: metadata[img]?.tags || [] });
        }
      }
    });

    return NextResponse.json({ 
      images, 
      systemTags: metadata['__system_tags__']?.tags || [] 
    });
  } catch (error) {
    console.error("Images API Exception:", error);
    return NextResponse.json({ error: 'Failed to list images' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ['Admin', 'Editor', 'Redaktör']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), 'public', 'media');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const extension = path.extname(filename).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.mp4', '.webm', '.mov', '.avi'];
    
    if (!allowedExtensions.includes(extension)) {
      return NextResponse.json({ error: 'Filtypen stöds inte.' }, { status: 400 });
    }

    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({ url: `/media/${filename}`, tags: [] });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

// PATCH - Update metadata (tags)
export async function PATCH(request: NextRequest) {
  const auth = await requireRole(request, ['Admin', 'Editor', 'Redaktör', 'Investor', 'Investerare', 'Regular', 'Medlem', 'Sales', 'Säljare']);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { url, tags, action, tagToDelete, newTag } = await request.json();
    const metadata = getMetadata();

    // GLOBAL ACTIONS (No specific URL required)
    if (action === 'globalDeleteTag' && tagToDelete) {
      Object.keys(metadata).forEach(key => {
        if (metadata[key].tags) {
          metadata[key].tags = metadata[key].tags.filter((t: string) => t !== tagToDelete);
        }
      });
      saveMetadata(metadata);
      return NextResponse.json({ success: true });
    }

    if (action === 'globalCreateTag' && newTag) {
      const systemKey = '__system_tags__';
      if (!metadata[systemKey]) metadata[systemKey] = { tags: [] };
      const currentTags = metadata[systemKey].tags || [];
      if (!currentTags.includes(newTag)) {
        metadata[systemKey].tags = [...currentTags, newTag.toLowerCase().trim()];
        saveMetadata(metadata);
      }
      return NextResponse.json({ success: true, tags: metadata[systemKey].tags });
    }

    // PER-IMAGE ACTIONS
    if (!url) return NextResponse.json({ error: 'URL required for per-image updates' }, { status: 400 });

    metadata[url] = { ...metadata[url], tags: Array.isArray(tags) ? tags : [] };
    
    // If this tag was in __system_tags__, we can leave it there as a predefined pool
    saveMetadata(metadata);

    return NextResponse.json({ success: true, tags: metadata[url].tags });
  } catch (error) {
    console.error("PATCH error:", error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

// DELETE - Remove image if not in use
export async function DELETE(request: NextRequest) {
  const auth = await requireRole(request, ['Admin', 'Editor', 'Redaktör', 'Investor', 'Investerare', 'Regular', 'Medlem', 'Sales', 'Säljare']);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

  try {
    // 1. CHECK USAGE
    const articlesPath = path.join(process.cwd(), 'data', 'articles.json');
    if (fs.existsSync(articlesPath)) {
      const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
      const usedIn = articles.filter((a: any) => 
        a.imageUrl === url || 
        (a.content && a.content.includes(url)) ||
        (a.ingress && a.ingress.includes(url))
      );

      if (usedIn.length > 0) {
        return NextResponse.json({ 
          error: 'Bilden används och kan inte raderas.', 
          articles: usedIn.map((a: any) => ({ id: a.id, title: a.title })) 
        }, { status: 400 });
      }
    }

    // 2. DELETE FROM DISK
    const publicPath = path.join(process.cwd(), 'public');
    const fullPath = path.join(publicPath, url.startsWith('/') ? url.substring(1) : url);
    
    if (fs.existsSync(fullPath)) {
      // Safety check: only delete from public/media
      if (!fullPath.includes(path.join('public', 'media'))) {
         return NextResponse.json({ error: 'Otillåten sökväg' }, { status: 400 });
      }
      fs.unlinkSync(fullPath);
    }

    // 3. CLEAN UP METADATA
    const metadata = getMetadata();
    if (metadata[url]) {
      delete metadata[url];
      saveMetadata(metadata);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete failed:", error);
    return NextResponse.json({ error: 'Radering misslyckades' }, { status: 500 });
  }
}
