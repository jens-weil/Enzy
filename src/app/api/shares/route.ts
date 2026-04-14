import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendEmail } from '@/lib/mail';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { articleId, articleTitle, platform, userId, userEmail } = await request.json();

    if (!userId || !articleId || !platform) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Create share record in Supabase
    const { data: share, error: dbError } = await supabaseAdmin
      .from('shares')
      .insert([
        { 
          user_id: userId, 
          article_id: articleId, 
          platform: platform,
          is_approved: null 
        }
      ])
      .select()
      .single();

    if (dbError) {
      console.error("Database error creating share:", dbError);
      return NextResponse.json({ error: "Failed to record share" }, { status: 500 });
    }

    // 2. Trigg email via Brevo if userEmail is provided
    if (userEmail) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const verificationUrl = `${siteUrl}/shares/${share.id}`;

      await sendEmail({
        to: [{ email: userEmail }],
        subject: `Registrera din delning: ${articleTitle}`,
        htmlContent: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
            <div style="background-color: #008080; padding: 40px 20px; text-align: center; border-radius: 20px 20px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px; text-transform: uppercase; font-style: italic;">Tack för din delning!</h1>
            </div>
            <div style="padding: 40px; background-color: #fff; border: 1px solid #f0f0f0; border-radius: 0 0 20px 20px;">
              <p style="font-size: 16px; font-weight: bold;">Du har precis delat artikeln: <br/>"${articleTitle}" på ${platform}.</p>
              <p style="color: #666; line-height: 1.6;">För att vi ska kunna verifiera och räkna din delning behöver du registrera länken till ditt inlägg.</p>
              
              <div style="margin: 40px 0; text-align: center;">
                <a href="${verificationUrl}" style="background-color: #008080; color: white; padding: 18px 30px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block; text-transform: uppercase; font-size: 14px; letter-spacing: 1px;">Registrera länk nu →</a>
              </div>
              
              <p style="color: #999; font-size: 12px;">Om knappen inte fungerar kan du kopiera och klistra in denna länk i din webbläsare:<br/>${verificationUrl}</p>
            </div>
          </div>
        `
      });
    }

    return NextResponse.json({ success: true, shareId: share.id });
  } catch (error) {
    console.error("Share registration error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const userId = searchParams.get('userId');

  if (id) {
    const { data, error } = await supabaseAdmin
      .from('shares')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    
    if (data.user_id !== auth.userId) {
      return NextResponse.json({ error: "Åtkomst nekad: Du äger inte denna post." }, { status: 403 });
    }

    return NextResponse.json(data);
  }

  if (userId) {
    if (userId !== auth.userId) {
      return NextResponse.json({ error: "Åtkomst nekad" }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('shares')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Missing ID or UserID" }, { status: 400 });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { id, share_url } = body;

    if (!id || !share_url) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: shareData, error: fetchError } = await supabaseAdmin
      .from('shares')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !shareData) {
      return NextResponse.json({ error: "Kunde inte hitta delningen" }, { status: 404 });
    }

    if (shareData.user_id !== auth.userId) {
      return NextResponse.json({ error: "Åtkomst nekad: Du äger inte denna post." }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('shares')
      .update({ share_url, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Database error updating share:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
