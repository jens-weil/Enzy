import fs from 'fs';
import path from 'path';

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
const settingsPath = path.join(process.cwd(), 'data', 'settings.json');

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

function logError(message: string, detail?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}: ${detail ? (typeof detail === 'object' ? JSON.stringify(detail) : detail) : ''}\n`;
  try {
    fs.appendFileSync(errorLogPath, logMessage);
  } catch (e) {
    console.error("Failed to write to error log file", e);
  }
}

export async function postToFacebook(data: {
  title: string;
  ingress?: string;
  link: string;
  imageUrl?: string;
}) {
  const { pageId, accessToken, strategy } = getFacebookSettings();

  if (!pageId || !accessToken || pageId === "your-page-id-here") {
    const errorMsg = `Facebook credentials missing: ID=${!!pageId}, Token=${!!accessToken}`;
    console.warn("FB_POST_FAILURE:", errorMsg);
    logError(errorMsg);
    return null;
  }

  const isDirect = strategy === "direct";

  console.log(`FB_POST_START: Strategy=${strategy}, Image=${!!data.imageUrl}`);


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
        console.log(`FB_UPLOADING_PHOTO: ${filePath}`);
        const fileBuffer = fs.readFileSync(filePath);
        const formData = new FormData();
        const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
        formData.append("source", blob, path.basename(filePath));
        formData.append("caption", message);
        formData.append("access_token", accessToken);

        const response = await fetchWithTimeout(`https://graph.facebook.com/${API_VERSION}/${pageId}/photos`, {
          method: "POST",
          body: formData,
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error?.message || "Photo Upload Failed");
        }
        
        const postId = result.id as string;
        console.log(`FB_PHOTO_POSTED: ${postId}. Posting comment...`);

        // Post the link as a comment
        const commentResponse = await fetchWithTimeout(`https://graph.facebook.com/${API_VERSION}/${postId}/comments`, {
          method: "POST",
          body: new URLSearchParams({
            message: data.link,
            access_token: accessToken || "",
          }),
        });

        if (!commentResponse.ok) console.warn("FB_COMMENT_FAILURE");

        // Fetch permalink_url
        let permalinkUrl = `https://www.facebook.com/${postId}`;
        try {
          const urlRes = await fetchWithTimeout(`https://graph.facebook.com/${API_VERSION}/${postId}?fields=permalink_url&access_token=${accessToken}`);
          if (urlRes.ok) {
            const urlData = await urlRes.json();
            if (urlData.permalink_url) permalinkUrl = urlData.permalink_url;
          }
        } catch {}

        return { id: postId, url: permalinkUrl };
      }
    }

    // STRATEGY: DIRECT LINK POST (Feed)
    console.log("FB_POSTING_FEED...");
    const formData = new URLSearchParams();
    formData.append("message", message);
    if (!data.link.includes('localhost')) formData.append("link", data.link);
    else formData.set("message", message + `\n\nLink: ${data.link}`);
    formData.append("access_token", accessToken);

    const response = await fetchWithTimeout(`https://graph.facebook.com/${API_VERSION}/${pageId}/feed`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error?.message || "Feed Post Failed");
    }

    const postId = result.id as string;
    console.log(`FB_POST_CREATED: ${postId}. Fetching permalink...`);

    if (!isDirect) {
      console.log("FB_POSTING_COMMENT...");
      await fetchWithTimeout(`https://graph.facebook.com/${API_VERSION}/${postId}/comments`, {
        method: "POST",
        body: new URLSearchParams({
          message: data.link,
          access_token: accessToken || "",
        }),
      }).catch(e => console.warn("FB_COMMENT_FAILURE:", e.message));
    }

    let permalinkUrl = `https://www.facebook.com/${postId}`;
    try {
      const urlResponse = await fetchWithTimeout(`https://graph.facebook.com/${API_VERSION}/${postId}?fields=permalink_url&access_token=${accessToken}`);
      if (urlResponse.ok) {
        const urlData = await urlResponse.json();
        if (urlData.permalink_url) permalinkUrl = urlData.permalink_url;
      }
    } catch (e) {
      console.warn("FB_PERMALINK_EXCEPTION:", e instanceof Error ? e.message : "timeout");
    }

    console.log("FB_POST_SUCCESS:", { id: postId, url: permalinkUrl });
    return { id: postId, url: permalinkUrl };
  } catch (error: any) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("FB_POST_CRITICAL_FAILURE:", errorMsg);
    logError("Failed to post to Facebook", errorMsg);
    return null;
  }
}

export async function deleteFromFacebook(postId: string) {
  const { accessToken } = getFacebookSettings();

  if (!accessToken || accessToken === "your-page-access-token-here") {
    return false;
  }

  try {
    console.log(`FB_DELETING_POST: ${postId}`);
    const response = await fetchWithTimeout(`https://graph.facebook.com/${API_VERSION}/${postId}`, {
      method: "DELETE",
      body: new URLSearchParams({ access_token: accessToken }),
    });

    const result = await response.json();
    return !!response.ok && !!result.success;
  } catch (error) {
    console.error("FB_DELETE_FAILURE:", error instanceof Error ? error.message : "timeout");
    return false;
  }
}
