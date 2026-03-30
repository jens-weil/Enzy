import fs from 'fs';
import path from 'path';

/**
 * Facebook Graph API Utility
 * Handles posting to and deleting from Facebook Page feed.
 * Supports configurable strategies: "comment" (link in comment) or "direct" (link post).
 */

const FB_PAGE_ID = process.env.FB_PAGE_ID;
const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
const API_VERSION = "v22.0";

const settingsPath = path.join(process.cwd(), 'data', 'settings.json');

function getStrategy(): "comment" | "direct" {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      return data.facebookPostStrategy || "comment";
    }
  } catch (e) {
    console.error("Error reading settings.json", e);
  }
  return "comment";
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
  if (!FB_PAGE_ID || !FB_PAGE_ACCESS_TOKEN || FB_PAGE_ID === "your-page-id-here") {
    const errorMsg = "Facebook credentials not configured. Skipping post.";
    console.warn(errorMsg);
    logError(errorMsg, { FB_PAGE_ID_exists: !!FB_PAGE_ID, FB_PAGE_ACCESS_TOKEN_exists: !!FB_PAGE_ACCESS_TOKEN });
    return null;
  }

  const strategy = getStrategy();
  const isDirect = strategy === "direct";

  console.log(`Posting to Facebook using strategy: ${strategy}`);

  // Customize message based on strategy
  const message = isDirect 
    ? `${data.title}\n\n${data.ingress || ""}`
    : `${data.title}\n\n${data.ingress || ""}\n\n👇 Länk till mer information finns i första kommentaren nedan!`;
  
  try {
    const isLocal = !data.imageUrl?.startsWith("http") || data.imageUrl?.includes("localhost");
    
    // STRATEGY: PHOTO UPLOAD + COMMENT (Default/Comment)
    if (!isDirect && data.imageUrl && isLocal) {
      // Extract local path from URL or use as is
      const localPath = data.imageUrl.includes("localhost") 
        ? new URL(data.imageUrl).pathname 
        : data.imageUrl;
        
      const filePath = path.join(process.cwd(), 'public', localPath);
      
      if (fs.existsSync(filePath)) {
        console.log(`Uploading local photo: ${filePath}`);
        const fileBuffer = fs.readFileSync(filePath);
        const formData = new FormData();
        
        // Convert buffer to Blob for native fetch
        const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
        formData.append("source", blob, path.basename(filePath));
        formData.append("caption", message);
        formData.append("access_token", FB_PAGE_ACCESS_TOKEN);

        const response = await fetch(`https://graph.facebook.com/${API_VERSION}/${FB_PAGE_ID}/photos`, {
          method: "POST",
          body: formData,
        });

        const result = await response.json();
        if (!response.ok) {
          console.error("Facebook API error (Photo Upload):", result.error);
          logError("Facebook API error (Photo Upload)", result.error);
          throw new Error(result.error?.message || "Facebook API error (Photo Upload)");
        }
        
        const postId = result.id as string;

        // Post the link as a comment
        const commentResponse = await fetch(`https://graph.facebook.com/${API_VERSION}/${postId}/comments`, {
          method: "POST",
          body: new URLSearchParams({
            message: data.link,
            access_token: FB_PAGE_ACCESS_TOKEN || "",
          }),
        });

        if (!commentResponse.ok) {
          const commentResult = await commentResponse.json();
          console.error("Failed to post comment on Facebook:", commentResult.error?.message || "Unknown error");
        } else {
          console.log(`Successfully posted link comment for post ${postId}`);
        }

        return postId;
      }
    }

    // STRATEGY: DIRECT LINK POST (Feed)
    // Also used as fallback for comment strategy if no image exists
    console.log("Using standard feed post (link post)");
    const formData = new URLSearchParams();
    formData.append("message", message);
    
    // Facebook Graph API rejects feed posts with 'link' pointing to localhost.
    if (!data.link.includes('localhost')) {
      formData.append("link", data.link);
    } else {
      console.warn("Skipping 'link' parameter because Facebook rejects localhost URLs. Adding to message instead.");
      formData.set("message", message + `\n\nLink: ${data.link}`);
    }
    
    formData.append("access_token", FB_PAGE_ACCESS_TOKEN);

    // If direct strategy, link to localhost will likely NOT show a preview on FB.
    // However, the post should still be created.
    if (!isDirect && data.imageUrl && data.imageUrl.startsWith("http") && !data.imageUrl.includes("localhost")) {
      formData.append("picture", data.imageUrl);
    }

    const response = await fetch(`https://graph.facebook.com/${API_VERSION}/${FB_PAGE_ID}/feed`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (!response.ok) {
      console.error("Facebook API error (Feed Post):", result.error);
      logError("Facebook API error (Feed Post)", { error: result.error, link: data.link, strategy: strategy });
      throw new Error(result.error?.message || "Facebook API error (Feed Post)");
    }

    const postId = result.id as string;
    console.log(`Successfully created feed post with ID: ${postId}`);

    // Only post comment if in comment strategy
    if (!isDirect) {
      const commentResponse = await fetch(`https://graph.facebook.com/${API_VERSION}/${postId}/comments`, {
        method: "POST",
        body: new URLSearchParams({
          message: data.link,
          access_token: FB_PAGE_ACCESS_TOKEN || "",
        }),
      });
      if (!commentResponse.ok) {
         const commentResult = await commentResponse.json();
         console.error("Failed to post comment on Facebook:", commentResult.error?.message || "Unknown error");
      }
    }

    return postId;
  } catch (error: any) {
    console.error("Failed to post to Facebook:", error);
    logError("Failed to post to Facebook", error instanceof Error ? error.message : error);
    return null;
  }
}

export async function deleteFromFacebook(postId: string) {
  if (!FB_PAGE_ACCESS_TOKEN || FB_PAGE_ACCESS_TOKEN === "your-page-access-token-here") {
    console.warn("Facebook credentials not configured. Skipping delete.");
    return false;
  }

  try {
    const response = await fetch(`https://graph.facebook.com/${API_VERSION}/${postId}`, {
      method: "DELETE",
      body: new URLSearchParams({
        access_token: FB_PAGE_ACCESS_TOKEN,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      console.error("Facebook API error (Delete):", result.error);
      throw new Error(result.error?.message || "Facebook API error (Delete)");
    }

    return result.success as boolean;
  } catch (error) {
    console.error("Failed to delete from Facebook:", error);
    return false;
  }
}
