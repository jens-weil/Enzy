import fs from 'fs';
import path from 'path';
import { getSettingsPath } from './settingsPath';

/**
 * Facebook Graph API Utility
 * Handles posting to and deleting from Facebook Page feed.
 * Supports configurable strategies: "comment" (link in comment) or "direct" (link post).
 */

// Helper for fetch with timeout
async function fetchWithTimeout(url: string, options: any = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

const API_VERSION = "v22.0";
const settingsPath = getSettingsPath();

function getFacebookSettings() {
  let settings = {
    strategy: "comment" as "comment" | "direct",
    pageId: process.env.FB_PAGE_ID,
    accessToken: process.env.FB_PAGE_ACCESS_TOKEN
  };

  try {
    if (fs.existsSync(settingsPath)) {
      const data = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      if (data.facebook) {
        settings.strategy = data.facebook.postStrategy || settings.strategy;
        settings.pageId = data.facebook.pageId || settings.pageId;
        settings.accessToken = data.facebook.accessToken || settings.accessToken;
      } else if (data.facebookPostStrategy) {
        // Fallback for very old format
        settings.strategy = data.facebookPostStrategy;
      }
    }
  } catch (e) {
    console.error("Error reading settings.json", e);
  }
  return settings;
}

const errorLogPath = path.join(process.cwd(), 'data', 'facebook_errors.log');
const diagLogPath = path.join(process.cwd(), 'data', 'facebook_diagnostics.log');

function logError(message: string, detail?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}: ${detail ? (typeof detail === 'object' ? JSON.stringify(detail) : detail) : ''}\n`;
  try {
    fs.appendFileSync(errorLogPath, logMessage);
  } catch (e) {
    console.error("Failed to write to Facebook error log file", e);
  }
}

function logDiagnostics(message: string) {
  const timestamp = new Date().toISOString();
  try {
    fs.appendFileSync(diagLogPath, `[${timestamp}] ${message}\n`);
  } catch {}
}

async function getPageAccessToken(systemToken: string, targetPageId: string): Promise<string | null> {
  try {
    logDiagnostics(`FB_TOKEN_EXCHANGE_START: TargetPage=${targetPageId}`);
    const response = await fetchWithTimeout(`https://graph.facebook.com/${API_VERSION}/me/accounts?access_token=${systemToken}`);
    
    if (!response.ok) {
      const err = await response.json();
      logDiagnostics(`FB_TOKEN_EXCHANGE_HTTP_ERROR: Status=${response.status}, Msg=${err.error?.message}`);
      return null;
    }

    const result = await response.json();
    const pages = result.data || [];
    const pageIds = pages.map((p: any) => p.id);
    
    logDiagnostics(`FB_TOKEN_EXCHANGE_PAGES_FOUND: [${pageIds.join(", ")}]`);

    const targetPage = pages.find((p: any) => p.id === targetPageId);

    if (targetPage && targetPage.access_token) {
      logDiagnostics(`FB_TOKEN_EXCHANGE_SUCCESS: Found Page Token for "${targetPage.name}"`);
      return targetPage.access_token;
    }

    logDiagnostics("FB_TOKEN_EXCHANGE_NO_MATCH: Target Page ID not in list. FALLBACK_TO_ORIGINAL.");
    return null;
  } catch (error: any) {
    logDiagnostics(`FB_TOKEN_EXCHANGE_EXCEPTION: ${error.message}`);
    return null;
  }
}

export async function postToFacebook(data: {
  title: string;
  ingress?: string;
  link: string;
  imageUrl?: string;
}): Promise<{ id: string; url: string } | { error: string }> {
  let { pageId, accessToken, strategy } = getFacebookSettings();
  
  accessToken = accessToken?.trim();

  if (!pageId || !accessToken || pageId === "your-page-id-here") {
    const errorMsg = `Inställningar saknas: Page ID (${!!pageId}) eller Access Token (${!!accessToken})`;
    console.warn("FB_POST_FAILURE:", errorMsg);
    logError(errorMsg);
    return { error: errorMsg };
  }

  // AUTO-EXCHANGE: Try to get a Page Access Token if this is a System/User token
  const pageAccessToken = await getPageAccessToken(accessToken, pageId);
  const effectiveToken = pageAccessToken || accessToken;

  logDiagnostics(`FB_EFFECTIVE_TOKEN: [${effectiveToken?.substring(0, 10)}...] (Exchanged: ${!!pageAccessToken})`);

  const isDirect = strategy === "direct";
  const authHeader = { "Authorization": `Bearer ${effectiveToken}` };

  const message = isDirect 
    ? `${data.title}\n\n${data.ingress || ""}`
    : `${data.title}\n\n${data.ingress || ""}\n\n👇 Länk till mer information finns i första kommentaren nedan!`;
  
  try {
    const isLocal = !data.imageUrl?.startsWith("http") || data.imageUrl?.includes("localhost");
    
    // STRATEGY: PHOTO UPLOAD + COMMENT (Default/Comment)
    if (!isDirect && data.imageUrl && isLocal) {
      const localPath = data.imageUrl.includes("localhost") 
        ? new URL(data.imageUrl).pathname 
        : data.imageUrl;
      const filePath = path.join(process.cwd(), 'public', localPath);
      
      if (fs.existsSync(filePath)) {
        logDiagnostics(`FB_UPLOADING_PHOTO: ${localPath}`);
        const fileBuffer = fs.readFileSync(filePath);
        const formData = new FormData();
        const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
        formData.append("source", blob, path.basename(filePath));
        formData.append("caption", message);
        formData.append("access_token", effectiveToken);

        const response = await fetchWithTimeout(`https://graph.facebook.com/${API_VERSION}/${pageId}/photos`, {
          method: "POST",
          headers: authHeader,
          body: formData,
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error?.message || `Photo Upload Failed (Code: ${result.error?.code}, Subcode: ${result.error?.error_subcode})`);
        }
        
        const postId = result.id as string;
        logDiagnostics(`FB_PHOTO_POSTED: ${postId}`);

        // Post the link as a comment
        const commentParams = new URLSearchParams({ 
          message: data.link,
          access_token: effectiveToken 
        });
        const commentResponse = await fetchWithTimeout(`https://graph.facebook.com/${API_VERSION}/${postId}/comments`, {
          method: "POST",
          headers: { ...authHeader, "Content-Type": "application/x-www-form-urlencoded" },
          body: commentParams,
        });

        if (commentResponse.ok) {
          logDiagnostics(`FB_COMMENT_POSTED: ${postId}`);
        } else {
          const commentErr = await commentResponse.json();
          logDiagnostics(`FB_COMMENT_FAILURE: ${commentErr.error?.message || "Unknown"}`);
        }

        // Fetch permalink_url
        let permalinkUrl = `https://www.facebook.com/${postId}`;
        try {
          const urlRes = await fetchWithTimeout(`https://graph.facebook.com/${API_VERSION}/${postId}?fields=permalink_url&access_token=${effectiveToken}`, {
            headers: authHeader
          });
          if (urlRes.ok) {
            const urlData = await urlRes.json();
            if (urlData.permalink_url) permalinkUrl = urlData.permalink_url;
          }
        } catch {}

        return { id: postId, url: permalinkUrl };
      } else {
        logDiagnostics(`FB_IMAGE_NOT_FOUND: ${filePath}`);
      }
    }

    // STRATEGY: DIRECT LINK POST (Feed)
    logDiagnostics("FB_POSTING_FEED...");
    const feedParams = new URLSearchParams();
    feedParams.append("message", message);
    if (!data.link.includes('localhost')) feedParams.append("link", data.link);
    else feedParams.set("message", message + `\n\nLink: ${data.link}`);
    feedParams.append("access_token", effectiveToken);

    const response = await fetchWithTimeout(`https://graph.facebook.com/${API_VERSION}/${pageId}/feed`, {
      method: "POST",
      headers: { ...authHeader, "Content-Type": "application/x-www-form-urlencoded" },
      body: feedParams,
    });

    const result = await response.json();
    if (!response.ok) {
      const fbErr = result.error;
      const detailedError = fbErr ? `${fbErr.message} (Code: ${fbErr.code}, Subcode: ${fbErr.error_subcode}, Type: ${fbErr.type})` : "Feed Post Failed";
      throw new Error(detailedError);
    }

    const postId = result.id as string;
    logDiagnostics(`FB_POST_CREATED: ${postId}`);

    if (!isDirect) {
      logDiagnostics("FB_POSTING_LINK_COMMENT...");
      const commentParams = new URLSearchParams({ 
        message: data.link,
        access_token: effectiveToken 
      });
      await fetchWithTimeout(`https://graph.facebook.com/${API_VERSION}/${postId}/comments`, {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/x-www-form-urlencoded" },
        body: commentParams,
      }).catch(e => logDiagnostics(`FB_COMMENT_FAILURE: ${e.message}`));
    }

    let permalinkUrl = `https://www.facebook.com/${postId}`;
    try {
      const urlResponse = await fetchWithTimeout(`https://graph.facebook.com/${API_VERSION}/${postId}?fields=permalink_url&access_token=${effectiveToken}`, {
        headers: authHeader
      });
      if (urlResponse.ok) {
        const urlData = await urlResponse.json();
        if (urlData.permalink_url) permalinkUrl = urlData.permalink_url;
      }
    } catch (e) {
      logDiagnostics(`FB_PERMALINK_EXCEPTION: ${e instanceof Error ? e.message : "timeout"}`);
    }

    logDiagnostics(`FB_POST_SUCCESS: ${postId}`);
    return { id: postId, url: permalinkUrl };
  } catch (error: any) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logDiagnostics(`FB_POST_CRITICAL_FAILURE: ${errorMsg}`);
    logError("Failed to post to Facebook", errorMsg);
    return { error: errorMsg };
  }
}

export async function deleteFromFacebook(postId: string) {
  let { pageId, accessToken } = getFacebookSettings();
  
  accessToken = accessToken?.trim();

  if (!accessToken || !pageId) {
    logDiagnostics(`FB_DELETE_ABORTED: Missing PageID (${!!pageId}) or Token (${!!accessToken})`);
    return false;
  }

  // AUTO-EXCHANGE: Ensure we have the correct Page Access Token for deletion
  const pageAccessToken = await getPageAccessToken(accessToken, pageId);
  const effectiveToken = pageAccessToken || accessToken;

  try {
    logDiagnostics(`FB_DELETE_START: ${postId} (Exchanged: ${!!pageAccessToken})`);
    const response = await fetchWithTimeout(`https://graph.facebook.com/${API_VERSION}/${postId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${effectiveToken}` },
      body: new URLSearchParams({ access_token: effectiveToken }), // Dual pass for compatibility
    });

    const result = await response.json();
    if (response.ok && result.success) {
      logDiagnostics(`FB_DELETE_SUCCESS: ${postId}`);
      return true;
    } else {
      const errMsg = result.error?.message || "Unknown deletion error";
      logDiagnostics(`FB_DELETE_FAILURE: ${errMsg}`);
      return false;
    }
  } catch (error: any) {
    logDiagnostics(`FB_DELETE_EXCEPTION: ${error.message}`);
    return false;
  }
}
