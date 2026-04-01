import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';
import { postToFacebook, deleteFromFacebook } from '@/lib/facebook';
import { requireRole } from '@/lib/auth';

// GET — public, no auth required
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'articles.json');
    if (!fs.existsSync(filePath)) {
      return NextResponse.json([]);
    }
    const fileData = fs.readFileSync(filePath, 'utf8');
    return NextResponse.json(JSON.parse(fileData));
  } catch (error) {
    return NextResponse.json({ error: 'Kunde inte läsa artiklar' }, { status: 500 });
  }
}

// POST — Admin or Editor only
export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ['Admin', 'Editor']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { title, type, ingress, content, imageUrl, socialMedia, date } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Titel och innehåll är obligatoriskt' },
        { status: 400 }
      );
    }

    const newArticle: any = {
      id: Date.now().toString(),
      title,
      type: type || 'Article',
      date: date || new Date().toISOString(),
      ingress: ingress || "",
      imageUrl: imageUrl || "",
      content,
      socialMedia: socialMedia || {
        facebook: false,
        instagram: false,
        linkedin: false,
        tiktok: false
      },
      socialLinks: body.socialLinks || {},
      facebookPostId: undefined
    };

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://enzymatica.se';
    const articleUrl = `${siteUrl}/articles/${newArticle.id}`;

    console.log(`Creating article with siteUrl: ${siteUrl}`);

    if (newArticle.socialMedia.facebook && !newArticle.socialLinks.facebook) {
      const postId = await postToFacebook({
        title: newArticle.title,
        ingress: newArticle.ingress,
        link: articleUrl,
        imageUrl: newArticle.imageUrl ? (newArticle.imageUrl.startsWith('http') ? newArticle.imageUrl : `${siteUrl}${newArticle.imageUrl}`) : undefined
      });
      if (postId) {
        newArticle.facebookPostId = postId;
        newArticle.socialLinks.facebook = `https://www.facebook.com/${postId}`;
      }
    }

    const filePath = path.join(process.cwd(), 'data', 'articles.json');
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    let articles = [];
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf8');
      try {
        articles = JSON.parse(fileData);
      } catch (e) {
        articles = [];
      }
    }

    articles.unshift(newArticle);
    fs.writeFileSync(filePath, JSON.stringify(articles, null, 2), 'utf8');
    revalidatePath('/articles');

    return NextResponse.json({ success: true, article: newArticle }, { status: 201 });
  } catch (error) {
    console.error("Error saving article:", error);
    return NextResponse.json({ error: 'Ett internt serverfel uppstod' }, { status: 500 });
  }
}

// PATCH — Admin or Editor only
export async function PATCH(request: NextRequest) {
  const auth = await requireRole(request, ['Admin', 'Editor']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { id, title, type, ingress, content, imageUrl, socialMedia, socialLinks, date } = body;

    if (!id || !title || !content) {
      return NextResponse.json(
        { error: 'ID, titel och innehåll är obligatoriskt' },
        { status: 400 }
      );
    }

    const filePath = path.join(process.cwd(), 'data', 'articles.json');
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Datafilen hittades inte' }, { status: 404 });
    }

    const fileData = fs.readFileSync(filePath, 'utf8');
    let articles = JSON.parse(fileData);

    const articleIndex = articles.findIndex((a: any) => a.id === id);
    if (articleIndex === -1) {
      return NextResponse.json({ error: 'Artikeln hittades inte' }, { status: 404 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://enzymatica.se';
    const articleUrl = `${siteUrl}/articles/${id}`;

    const oldFB = articles[articleIndex].socialMedia.facebook;
    const newFB = socialMedia?.facebook !== undefined ? socialMedia.facebook : oldFB;
    let facebookPostId = articles[articleIndex].facebookPostId;
    let updatedSocialLinks = { ...(socialLinks || articles[articleIndex].socialLinks || {}) };

    if (newFB && !facebookPostId && !updatedSocialLinks.facebook) {
      const postId = await postToFacebook({
        title: title || articles[articleIndex].title,
        ingress: ingress !== undefined ? ingress : articles[articleIndex].ingress,
        link: articleUrl,
        imageUrl: imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `${siteUrl}${imageUrl}`) : (articles[articleIndex].imageUrl ? (articles[articleIndex].imageUrl.startsWith('http') ? articles[articleIndex].imageUrl : `${siteUrl}${articles[articleIndex].imageUrl}`) : undefined)
      });
      if (postId) {
        facebookPostId = postId;
        updatedSocialLinks.facebook = `https://www.facebook.com/${postId}`;
      }
    } else if (oldFB && !newFB && facebookPostId) {
      await deleteFromFacebook(facebookPostId);
      facebookPostId = undefined;
      // Note: We don't delete updatedSocialLinks.facebook here if it was manual
    }

    articles[articleIndex] = {
      ...articles[articleIndex],
      title,
      date: date || articles[articleIndex].date,
      type: type || articles[articleIndex].type,
      ingress: ingress !== undefined ? ingress : articles[articleIndex].ingress,
      imageUrl: imageUrl !== undefined ? imageUrl : articles[articleIndex].imageUrl,
      content,
      socialMedia: socialMedia || articles[articleIndex].socialMedia,
      socialLinks: updatedSocialLinks,
      facebookPostId
    };

    fs.writeFileSync(filePath, JSON.stringify(articles, null, 2), 'utf8');
    revalidatePath('/articles');
    revalidatePath(`/articles/${id}`);

    return NextResponse.json({ success: true, article: articles[articleIndex] });
  } catch (error) {
    console.error("Error updating article:", error);
    return NextResponse.json({ error: 'Ett internt serverfel uppstod vid uppdatering' }, { status: 500 });
  }
}

// DELETE — Admin only
export async function DELETE(request: NextRequest) {
  const auth = await requireRole(request, ['Admin']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Article ID required' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'data', 'articles.json');
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Datafilen hittades inte' }, { status: 404 });
    }

    const fileData = fs.readFileSync(filePath, 'utf8');
    let articles = JSON.parse(fileData);

    const articleToDelete = articles.find((a: any) => a.id === id);
    if (articleToDelete?.facebookPostId) {
      await deleteFromFacebook(articleToDelete.facebookPostId);
    }

    const filteredArticles = articles.filter((a: any) => a.id !== id);

    if (articles.length === filteredArticles.length) {
      return NextResponse.json({ error: 'Artikeln hittades inte' }, { status: 404 });
    }

    fs.writeFileSync(filePath, JSON.stringify(filteredArticles, null, 2), 'utf8');
    revalidatePath('/articles');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting article:", error);
    return NextResponse.json({ error: 'Misslyckades att radera artikeln' }, { status: 500 });
  }
}
