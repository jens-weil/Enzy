import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';
import { postToFacebook, deleteFromFacebook } from '@/lib/facebook';
import { postToInstagram } from '@/lib/instagram';
import { requireRole } from '@/lib/auth';
import { getSiteUrl } from '@/lib/siteConfig';

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
  const auth = await requireRole(request, ['Admin', 'Editor', 'Redaktör', 'Investor', 'Investerare', 'Regular', 'Medlem', 'Sales', 'Säljare']);
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
      facebookPostId: undefined,
      instagramPostId: undefined
    };

    const siteUrl = getSiteUrl();
    const articleUrl = `${siteUrl}/articles/${newArticle.id}`;

    console.log(`Creating article with siteUrl: ${siteUrl}`);

    const isManualLink = (url?: string) => !!(url && url.trim().startsWith('http') && url.trim().length > 10);
    const hasManualFB = isManualLink(newArticle.socialLinks?.facebook);

    if (newArticle.socialMedia.facebook && !hasManualFB) {
      const fbResult = await postToFacebook({
        title: newArticle.title,
        ingress: newArticle.ingress,
        link: articleUrl,
        imageUrl: newArticle.imageUrl ? (newArticle.imageUrl.startsWith('http') ? newArticle.imageUrl : `${siteUrl}${newArticle.imageUrl}`) : undefined
      });
      if (fbResult) {
        console.log("Article API: Facebook post SUCCESS:", fbResult.id);
        newArticle.facebookPostId = fbResult.id;
        newArticle.socialLinks.facebook = fbResult.url;
      } else {
        console.warn("Article API: Facebook post FAILED (check logs)");
        newArticle._fbWarning = "Facebook-inlägget kunde inte skapas automatisk.";
      }
    }

    const hasManualIG = isManualLink(newArticle.socialLinks?.instagram);

    if (newArticle.socialMedia.instagram && !hasManualIG) {
      const igResult = await postToInstagram({
        title: newArticle.title,
        ingress: newArticle.ingress,
        link: articleUrl,
        imageUrl: newArticle.imageUrl ? (newArticle.imageUrl.startsWith('http') ? newArticle.imageUrl : `${siteUrl}${newArticle.imageUrl}`) : undefined
      });
      if (igResult) {
        console.log("Article API: Instagram post SUCCESS:", igResult.id);
        newArticle.instagramPostId = igResult.id;
        newArticle.socialLinks.instagram = igResult.url;
      } else {
        console.warn("Article API: Instagram post FAILED (check logs)");
        newArticle._igWarning = "Instagram-inlägget kunde inte skapas automatisk.";
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
    revalidatePath('/');
    revalidatePath('/investerare');

    return NextResponse.json({ 
      success: true, 
      article: newArticle,
      warning: [newArticle._fbWarning, newArticle._igWarning].filter(Boolean).join(" | ") || undefined
    }, { status: 201 });
  } catch (error) {
    console.error("Error saving article:", error);
    return NextResponse.json({ error: 'Ett internt serverfel uppstod' }, { status: 500 });
  }
}

// PATCH — Admin or Editor only
export async function PATCH(request: NextRequest) {
  const auth = await requireRole(request, ['Admin', 'Editor', 'Redaktör', 'Investor', 'Investerare', 'Regular', 'Medlem', 'Sales', 'Säljare']);
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

    const siteUrl = getSiteUrl();
    const articleUrl = `${siteUrl}/articles/${id}`;

    const oldFB = articles[articleIndex].socialMedia.facebook;
    const newFB = socialMedia?.facebook !== undefined ? socialMedia.facebook : oldFB;
    let facebookPostId = articles[articleIndex].facebookPostId;
    let instagramPostId = articles[articleIndex].instagramPostId;
    let updatedSocialLinks = { ...(socialLinks || articles[articleIndex].socialLinks || {}) };

    const platforms = ["facebook", "linkedin", "instagram", "tiktok"] as const;
    platforms.forEach(p => {
      const oldVal = articles[articleIndex].socialMedia[p];
      const newVal = socialMedia?.[p] !== undefined ? socialMedia[p] : oldVal;
      
      if (oldVal && !newVal) {
        console.log(`Article API (PATCH): User turned ${p} OFF for ${id}. Clearing link.`);
        delete updatedSocialLinks[p];
        if (p === 'facebook') {
          if (facebookPostId) {
            deleteFromFacebook(facebookPostId).catch(e => console.warn("Background FB delete failed:", e));
          }
          facebookPostId = undefined;
        } else if (p === 'instagram') {
          // Instagram does not support API deletion easily without the user container ID but we clear the link and ID locally
          instagramPostId = undefined;
        }
      }
    });

    const isManualLink = (url?: string) => !!(url && url.trim().startsWith('http') && url.trim().length > 10);
    const hasManualFB = isManualLink(updatedSocialLinks.facebook);

    // LOGIC: Automate Facebook when toggling ON (and no existing ID/Manual Link)
    if (newFB && !facebookPostId && !hasManualFB) {
      console.log(`Article API (PATCH): Attempting automated Facebook post for ${id}...`);
      const fbResult = await postToFacebook({
        title: title || articles[articleIndex].title,
        ingress: ingress !== undefined ? ingress : articles[articleIndex].ingress,
        link: articleUrl,
        imageUrl: imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `${siteUrl}${imageUrl}`) : (articles[articleIndex].imageUrl ? (articles[articleIndex].imageUrl.startsWith('http') ? articles[articleIndex].imageUrl : `${siteUrl}${articles[articleIndex].imageUrl}`) : undefined)
      });
      if (fbResult) {
        console.log("Article API (PATCH): Facebook post SUCCESS:", fbResult.id);
        facebookPostId = fbResult.id;
        updatedSocialLinks.facebook = fbResult.url;
      } else {
        console.warn("Article API (PATCH): Facebook post FAILED");
        articles[articleIndex]._fbWarning = "Facebook-inlägget kunde inte skapas automatisk.";
      }
    }

    const newIG = socialMedia?.instagram !== undefined ? socialMedia.instagram : articles[articleIndex].socialMedia.instagram;
    const hasManualIG = isManualLink(updatedSocialLinks.instagram);

    if (newIG && !instagramPostId && !hasManualIG) {
      console.log(`Article API (PATCH): Attempting automated Instagram post for ${id}...`);
      const igResult = await postToInstagram({
        title: title || articles[articleIndex].title,
        ingress: ingress !== undefined ? ingress : articles[articleIndex].ingress,
        link: articleUrl,
        imageUrl: imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `${siteUrl}${imageUrl}`) : (articles[articleIndex].imageUrl ? (articles[articleIndex].imageUrl.startsWith('http') ? articles[articleIndex].imageUrl : `${siteUrl}${articles[articleIndex].imageUrl}`) : undefined)
      });
      if (igResult) {
        console.log("Article API (PATCH): Instagram post SUCCESS:", igResult.id);
        instagramPostId = igResult.id;
        updatedSocialLinks.instagram = igResult.url;
      } else {
        console.warn("Article API (PATCH): Instagram post FAILED");
        articles[articleIndex]._igWarning = "Instagram-inlägget kunde inte skapas automatisk.";
      }
    }

    articles[articleIndex] = {
      ...articles[articleIndex],
      title: title || articles[articleIndex].title,
      date: date || articles[articleIndex].date,
      type: type || articles[articleIndex].type,
      ingress: ingress !== undefined ? ingress : articles[articleIndex].ingress,
      imageUrl: imageUrl !== undefined ? imageUrl : articles[articleIndex].imageUrl,
      content: content !== undefined ? content : articles[articleIndex].content,
      socialMedia: {
        facebook: newFB,
        instagram: socialMedia?.instagram !== undefined ? socialMedia.instagram : articles[articleIndex].socialMedia.instagram,
        linkedin: socialMedia?.linkedin !== undefined ? socialMedia.linkedin : articles[articleIndex].socialMedia.linkedin,
        tiktok: socialMedia?.tiktok !== undefined ? socialMedia.tiktok : articles[articleIndex].socialMedia.tiktok,
      },
      socialLinks: updatedSocialLinks,
      facebookPostId,
      instagramPostId
    };

    fs.writeFileSync(filePath, JSON.stringify(articles, null, 2), 'utf8');
    revalidatePath('/articles');
    revalidatePath(`/articles/${id}`);
    revalidatePath('/');
    revalidatePath('/investerare');

    return NextResponse.json({ 
      success: true, 
      article: articles[articleIndex],
      warning: [articles[articleIndex]._fbWarning, articles[articleIndex]._igWarning].filter(Boolean).join(" | ") || undefined
    });
  } catch (error: any) {
    console.error("Error updating article:", error);
    return NextResponse.json({ error: `Ett internt serverfel uppstod: ${error.message}` }, { status: 500 });
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
    revalidatePath('/');
    revalidatePath('/investerare');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting article:", error);
    return NextResponse.json({ error: 'Misslyckades att radera artikeln' }, { status: 500 });
  }
}
