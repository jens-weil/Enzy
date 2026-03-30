/**
 * Facebook Cleanup Utility
 * Removes all your test posts automatically.
 * Usage: node --env-file=.env.local cleanup_fb.js
 */

const FB_PAGE_ID = process.env.FB_PAGE_ID;
const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
const API_VERSION = "v22.0";

// Keywords to look for in posts to be deleted
const TEST_KEYWORDS = ["Integrationstest", "Test på automatisk kommentar"];

async function cleanup() {
  console.log("-----------------------------------------");
  console.log("Facebook Cleanup Utility");
  console.log("-----------------------------------------");

  if (!FB_PAGE_ID || !FB_PAGE_ACCESS_TOKEN || FB_PAGE_ID === "your-page-id-here") {
    console.error("ERROR: Facebook credentials not found in environment.");
    process.exit(1);
  }

  try {
    console.log(`Hämtar senaste inlägg från Sida: ${FB_PAGE_ID}...`);
    
    // 1. Get the feed
    const response = await fetch(`https://graph.facebook.com/${API_VERSION}/${FB_PAGE_ID}/feed?access_token=${FB_PAGE_ACCESS_TOKEN}&limit=50`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || "Kunde inte hämta flödet");
    }

    const posts = result.data || [];
    console.log(`Hittade ${posts.length} inlägg totalt.`);

    // 2. Filter posts
    const postsToDelete = posts.filter(post => {
      if (!post.message) return false;
      return TEST_KEYWORDS.some(keyword => post.message.includes(keyword));
    });

    if (postsToDelete.length === 0) {
      console.log("Hittade inga test-inlägg att radera. ✅");
      return;
    }

    console.log(`Hittade ${postsToDelete.length} test-inlägg. Raderar...`);

    // 3. Delete posts
    for (const post of postsToDelete) {
      const deleteResponse = await fetch(`https://graph.facebook.com/${API_VERSION}/${post.id}?access_token=${FB_PAGE_ACCESS_TOKEN}`, {
        method: "DELETE"
      });
      const deleteResult = await deleteResponse.json();

      if (deleteResponse.ok && deleteResult.success) {
        console.log(`✅ Raderat inlägg: "${post.message.substring(0, 30)}..." (ID: ${post.id})`);
      } else {
        console.error(`❌ Misslyckades att radera ${post.id}: ${deleteResult.error?.message || "Okänt fel"}`);
      }
    }

    console.log("\nStädning slutförd! ✨");

  } catch (error) {
    console.error(`FEL: ${error.message}`);
    process.exit(1);
  }
}

cleanup();
