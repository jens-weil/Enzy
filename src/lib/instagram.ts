import fs from 'fs';
import path from 'path';
import { getSettingsPath } from './settingsPath';
import { getSiteUrl } from './siteConfig';

/**
 * Instagram Graph API Utility
 * Handles posting images to an Instagram Professional account.
 */

const API_VERSION = "v22.0";
const settingsPath = getSettingsPath();
const errorLogPath = path.join(process.cwd(), 'data', 'instagram_errors.log');

function getInstagramSettings() {
  let settings = {
    accountId: process.env.IG_ACCOUNT_ID,
    accessToken: process.env.IG_ACCESS_TOKEN
  };

  try {
    if (fs.existsSync(settingsPath)) {
      const data = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      if (data.instagram) {
        settings.accountId = data.instagram.accountId || settings.accountId;
        settings.accessToken = data.instagram.accessToken || settings.accessToken;
      }
    }
  } catch (e) {
    console.error("Error reading settings.json", e);
  }
  return settings;
}

function logError(message: string, detail?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}: ${detail ? (typeof detail === 'object' ? JSON.stringify(detail) : detail) : ''}\n`;
  try {
    fs.appendFileSync(errorLogPath, logMessage);
  } catch (e) {
    console.error("Failed to write to Instagram error log file", e);
  }
}

// Helper for fetch with timeout
async function fetchWithTimeout(url: string, options: any = {}, timeout = 15000) {
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

/**
 * Posts an image and caption to Instagram.
 * Instagram API requires a publicly accessible image URL.
 */
export async function postToInstagram(data: {
  title: string;
  ingress?: string;
  link: string;
  imageUrl?: string;
}) {
  const { accountId, accessToken } = getInstagramSettings();

  if (!accountId || !accessToken) {
    const errorMsg = `Instagram credentials missing: AccountID=${!!accountId}, Token=${!!accessToken}`;
    console.warn("IG_POST_FAILURE:", errorMsg);
    logError(errorMsg);
    return null;
  }

  console.log(`IG_POST_START: Image=${!!data.imageUrl}`);

  // Instagram requires a public image URL.
  // We fall back to the logo if no image is provided.
  let targetImageUrl = data.imageUrl;
  
  if (!targetImageUrl) {
      // Default logo URL if no image provided
      const siteUrl = getSiteUrl();
      targetImageUrl = `${siteUrl}/media/logo.png`; 
  } else if (!targetImageUrl.startsWith('http')) {
      const siteUrl = getSiteUrl();
      targetImageUrl = `${siteUrl}${targetImageUrl.startsWith('/') ? '' : '/'}${targetImageUrl}`;
  }

  // Formatting caption (Instagram prefers hashtags and doesn't natively hyperlink in captions)
  const caption = `${data.title}\n\n${data.ingress || ""}\n\nLäs mer här: ${data.link}`;

  if (targetImageUrl.includes("localhost")) {
    const warning = `Instagram API cannot download images from localhost (${targetImageUrl}). Post will likely fail unless tunnel is configured.`;
    console.warn(warning);
    // We continue anyway, so the user can test error handling or if they use Ngrok.
  }

  try {
    // STEP 1: Create an Item Container
    console.log("IG_STEP_1: Creating media container...");
    const containerParams = new URLSearchParams({
      image_url: targetImageUrl,
      caption: caption,
      access_token: accessToken,
    });

    const containerResponse = await fetchWithTimeout(`https://graph.facebook.com/${API_VERSION}/${accountId}/media`, {
      method: "POST",
      body: containerParams,
    });

    const containerResult = await containerResponse.json();
    
    if (!containerResponse.ok) {
      throw new Error(containerResult.error?.message || "Failed to create media container");
    }

    const creationId = containerResult.id;
    console.log(`IG_CONTAINER_CREATED: ${creationId}`);

    // Add a short delay to allow Instagram to process the image container
    await new Promise(resolve => setTimeout(resolve, 3000));

    // STEP 2: Publish the Container
    console.log("IG_STEP_2: Publishing container...");
    const publishParams = new URLSearchParams({
      creation_id: creationId,
      access_token: accessToken,
    });

    const publishResponse = await fetchWithTimeout(`https://graph.facebook.com/${API_VERSION}/${accountId}/media_publish`, {
      method: "POST",
      body: publishParams,
    });

    const publishResult = await publishResponse.json();

    if (!publishResponse.ok) {
       throw new Error(publishResult.error?.message || "Failed to publish media container");
    }

    const postId = publishResult.id;
    const permalinkUrl = `https://www.instagram.com/p/${postId}/`; // Fallback approximate URL, API doesn't always return permalink directly for IG

    console.log("IG_POST_SUCCESS:", { id: postId, url: permalinkUrl });
    return { id: postId, url: permalinkUrl };

  } catch (error: any) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("IG_POST_CRITICAL_FAILURE:", errorMsg);
    logError("Failed to post to Instagram", errorMsg);
    return null;
  }
}
