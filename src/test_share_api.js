
async function testShare() {
  console.log("--- Testing /api/shares with valid ID ---");
  try {
    const res = await fetch("http://localhost:3000/api/shares", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        articleId: "test-article-id",
        articleTitle: "Test Article Title",
        platform: "facebook",
        userId: "d8612572-3256-4039-9eae-fb06250155ff", // Real user ID found in profiles
        userEmail: "jens@jenka.se",
        articleImage: "/articles/test.jpg"
      })
    });
    
    const data = await res.json();
    console.log("Response Status:", res.status);
    console.log("Response Body:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Fetch failed:", e.message);
  }
}

testShare();
