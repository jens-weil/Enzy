import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendEmail } from '@/lib/mail';
import { requireAuth } from '@/lib/auth';
import { getSiteUrl } from '@/lib/siteConfig';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleId, articleTitle, platform, userId, userEmail, articleImage, platformLink } = body;
    console.log("DEBUG: POST /api/shares - incoming:", { articleId, platform, userId, userEmail, articleImage, platformLink });

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
          is_approved: null,
          share_url: platformLink || null // Pre-fill if we have an automated link
        }
      ])
      .select()
      .single();

    if (dbError) {
      console.error("Database error creating share:", dbError);
      return NextResponse.json({ error: "Failed to record share" }, { status: 500 });
    }

    // 2. Trigger email via Brevo if userEmail is provided
    let emailSent = false;
    let emailError = null;
    
    if (userEmail) {
      const siteUrl = getSiteUrl();
      const verificationUrl = `${siteUrl}/shares/${share.id}`;

      // Robust resolution of article image URL
      let fullImageUrl = "";
      if (articleImage) {
        // Remove leading/trailing slashes and 'public'/ 'publik' from the start to normalize
        let cleanPath = articleImage.toString().trim()
          .replace(/^[\/\\]+/, '') // Remove leading slashes
          .replace(/^(public|publik)[\/\\]+/, ''); // Remove public/publik if present
        
        fullImageUrl = `${siteUrl}/${cleanPath}`;
      } else {
        // Fallback to logo
        fullImageUrl = `${siteUrl}/media/logo.png`;
      }
      
      // Double check that we don't have double slashes after the domain (except for protocol)
      fullImageUrl = fullImageUrl.replace(/([^:])\/\//g, '$1/');
      
      console.log("DEBUG: Final Mail Image URL:", fullImageUrl);
      console.log("DEBUG: Verification URL:", verificationUrl);

      const emailResult = await sendEmail({
        to: [{ email: userEmail }],
        subject: `Registrera din delning: ${articleTitle}`,
        htmlContent: `
          <html>
            <head>
              <style>
                .content-box { border-radius: 20px; overflow: hidden; border: 1px solid #f0f0f0; }
                @media only screen and (max-width: 600px) {
                  .inner-padding { padding: 20px !important; }
                }
              </style>
            </head>
            <body style="margin: 0; padding: 20px; background-color: #f5f7f9; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                <!-- Header -->
                <tr>
                  <td align="center" style="background-color: #008080; padding: 40px 20px;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; text-transform: uppercase; font-style: italic; letter-spacing: 1px;">Tack för din delning!</h1>
                  </td>
                </tr>
                
                <!-- Main Body -->
                <tr>
                  <td class="inner-padding" style="padding: 40px;">
                    ${fullImageUrl ? `
                    <div style="margin-bottom: 30px; text-align: center;">
                      <img src="${fullImageUrl}" alt="${articleTitle.replace(/"/g, '&quot;')}" width="100%" style="max-width: 100%; height: auto; border-radius: 12px; display: block; margin: 0 auto;" />
                    </div>
                    ` : ''}
                    
                    <p style="font-size: 16px; font-weight: bold; margin: 0 0 10px 0; color: #333;">Du har precis delat artikeln:</p>
                    <p style="font-size: 20px; color: #008080; font-weight: 900; margin: 0 0 25px 0; line-height: 1.3; font-style: italic;">"${articleTitle}"</p>
                    
                    ${platformLink ? `
                      <div style="background-color: #f9fbfb; padding: 20px; border-radius: 12px; border: 1px dashed #008080; margin: 25px 0; text-align: center;">
                        <p style="margin: 0 0 12px 0; font-weight: bold; color: #333; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Länk till din skapade post på ${platform}:</p>
                        <a href="${platformLink}" style="color: #008080; text-decoration: underline; word-break: break-all; font-size: 14px; font-weight: bold;">${platformLink}</a>
                      </div>
                    ` : `
                      <p style="color: #666; line-height: 1.6; font-size: 15px;">För att vi ska kunna verifiera och räkna din delning på <strong>${platform}</strong> behöver du registrera länken till ditt inlägg för att få din poäng.</p>
                    `}
                    
                    <div style="margin: 40px 0; text-align: center;">
                      <a href="${verificationUrl}" style="background-color: #008080; color: #ffffff; padding: 18px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block; text-transform: uppercase; font-size: 14px; letter-spacing: 1px; box-shadow: 0 4px 12px rgba(0,128,128,0.25);">
                        ${platformLink ? 'Verifiera min delning →' : 'Registrera länk nu →'}
                      </a>
                    </div>
                    
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #eeeeee; padding-top: 20px;">
                      <tr>
                        <td style="color: #999999; font-size: 12px; line-height: 1.5; text-align: center;">
                          Om knappen inte fungerar kan du kopiera och klistra in denna länk i din webbläsare:<br/>
                          <a href="${verificationUrl}" style="color: #008080; text-decoration: none;">${verificationUrl}</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td align="center" style="background-color: #fafafa; padding: 20px; color: #bbbbbb; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">
                    © ${new Date().getFullYear()} Enzymatica Portalen
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `
      });
      console.log("DEBUG: Email send outcome:", emailResult);
      emailSent = emailResult.success;
      emailError = emailResult.error;
    }

    return NextResponse.json({ 
      success: true, 
      shareId: share.id,
      emailSent,
      emailError
    });
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
