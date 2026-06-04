import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireRole, supabaseAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    const images: { url: string; tags: string[] }[] = [];
    const metadata = getMetadata();

    // 1. Try fetching from Supabase Storage
    try {
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      const hasMediaBucket = buckets?.some(b => b.id === 'media');
      if (!hasMediaBucket) {
        await supabaseAdmin.storage.createBucket('media', {
          public: true,
          allowedMimeTypes: ['image/*', 'video/*'],
          fileSizeLimit: 10485760 // 10MB
        });
      }

      const { data: files, error } = await supabaseAdmin.storage.from('media').list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

      if (files && !error) {
        files.forEach(file => {
          const { data } = supabaseAdmin.storage.from('media').getPublicUrl(file.name);
          images.push({
            url: data.publicUrl,
            tags: metadata[data.publicUrl]?.tags || []
          });
        });
      }
    } catch (e) {
      console.warn("Supabase Storage list failed, using local disk:", e);
    }

    // 2. Fallback/Include local disk files
    const uploadDir = path.join(process.cwd(), 'public', 'media');
    if (fs.existsSync(uploadDir)) {
      const getAllFiles = (dirPath: string, arrayOfFiles: string[] = []): string[] => {
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
      allFiles.forEach(fullPath => {
        const relativePath = path.relative(path.join(process.cwd(), 'public'), fullPath);
        const url = `/${relativePath.replace(/\\/g, '/')}`;
        if (!images.find(i => i.url === url)) {
          images.push({
            url,
            tags: metadata[url]?.tags || []
          });
        }
      });
    }

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

    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const extension = path.extname(filename).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.mp4', '.webm', '.mov', '.avi'];
    
    if (!allowedExtensions.includes(extension)) {
      return NextResponse.json({ error: 'Filtypen stöds inte.' }, { status: 400 });
    }

    // 1. Try Supabase Storage first
    try {
      const { data, error } = await supabaseAdmin.storage
        .from('media')
        .upload(filename, buffer, {
          contentType: file.type,
          upsert: true
        });

      if (data && !error) {
        const { data: urlData } = supabaseAdmin.storage.from('media').getPublicUrl(filename);
        return NextResponse.json({ url: urlData.publicUrl, tags: [] });
      }
      if (error) throw error;
    } catch (e) {
      console.warn("Supabase Storage upload failed, falling back to local disk:", e);
    }

    // 2. Fallback to Local Disk
    const uploadDir = path.join(process.cwd(), 'public', 'media');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({ url: `/media/${filename}`, tags: [] });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ 
      error: `Uppladdning misslyckades: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 500 });
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

    // 2. DELETE FROM SUPABASE STORAGE IF APPLICABLE
    if (url.includes('supabase.co/storage/v1/object/public/media/')) {
      const filename = url.split('/').pop();
      if (filename) {
        const { error } = await supabaseAdmin.storage.from('media').remove([filename]);
        if (error) console.error("Error deleting from Supabase Storage:", error);
      }
    }

    // 3. DELETE FROM LOCAL DISK
    const publicPath = path.join(process.cwd(), 'public');
    const fullPath = path.join(publicPath, url.startsWith('/') ? url.substring(1) : url);
    
    if (fs.existsSync(fullPath)) {
      // Safety check: only delete from public/media
      if (fullPath.includes(path.join('public', 'media'))) {
        try {
          fs.unlinkSync(fullPath);
        } catch (e) {
          console.warn("Local file delete failed (might be read-only):", e);
        }
      }
    }

    // 4. CLEAN UP METADATA
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
