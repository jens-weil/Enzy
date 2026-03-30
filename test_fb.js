/**
 * Facebook Connection Test Utility
 * Verifies your credentials and attempts a test post.
 * Usage: node --env-file=.env.local test_fb.js
 * If your node version is old, you may need to fill in credentials manually.
 */

const FB_PAGE_ID = process.env.FB_PAGE_ID;
const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
const API_VERSION = "v22.0";

async function testConnection() {
  console.log("-----------------------------------------");
  console.log("Facebook Connection Test");
  console.log("-----------------------------------------");
  
  if (!FB_PAGE_ID || !FB_PAGE_ACCESS_TOKEN || FB_PAGE_ID === "your-page-id-here") {
    console.error("ERROR: Facebook credentials not found in environment.");
    console.log("Make sure you are running with --env-file=.env.local OR fill them in test_fb.js.");
    process.exit(1);
  }

  console.log(`Checking Page ID: ${FB_PAGE_ID}...`);

  try {
    const response = await fetch(`https://graph.facebook.com/${API_VERSION}/${FB_PAGE_ID}?fields=name&access_token=${FB_PAGE_ACCESS_TOKEN}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || "Unknown API error");
    }

    console.log(`SUCCESS! Connected to Page: "${result.name}"`);
    console.log("\nAttempting a test post...");

    const postResponse = await fetch(`https://graph.facebook.com/${API_VERSION}/${FB_PAGE_ID}/feed`, {
      method: "POST",
      body: new URLSearchParams({
        message: "Integrationstest: Enzymatica Article Portal ansluten! ✅",
        access_token: FB_PAGE_ACCESS_TOKEN,
      }),
    });

    const postResult = await postResponse.json();
    if (!postResponse.ok) {
      throw new Error(postResult.error?.message || "Post failed");
    }

    const postId = postResult.id;
    console.log(`SUCCESS! Post created with ID: ${postId}`);
    console.log("Attempting to post a comment to verify 'link-in-comments' functionality...");

    const commentResponse = await fetch(`https://graph.facebook.com/${API_VERSION}/${postId}/comments`, {
      method: "POST",
      body: new URLSearchParams({
        message: "Test på automatisk kommentar: Allt fungerar som det ska! 📢",
        access_token: FB_PAGE_ACCESS_TOKEN,
      }),
    });

    const commentResult = await commentResponse.json();
    if (!commentResponse.ok) {
      throw new Error(commentResult.error?.message || "Comment failed");
    }

    console.log(`SUCCESS! Comment created on post ${postId}`);
    console.log("You can now view both the post and the comment on your Facebook Page.");
    console.log("\nTest completed successfully! All social media automation features are operational.");

  } catch (error) {
    console.error(`FAILED: ${error.message}`);
    process.exit(1);
  }
}

testConnection();
