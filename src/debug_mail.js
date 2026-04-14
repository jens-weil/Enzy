
const fs = require('fs');
const path = require('path');

async function testMail() {
  console.log("--- Mail Debug Started ---");
  const settingsPath = path.join(process.cwd(), 'data', 'settings.json');
  console.log("Checking settings at:", settingsPath);
  
  if (!fs.existsSync(settingsPath)) {
    console.error("Settings file NOT FOUND!");
    return;
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    console.log("Brevo settings found:", JSON.stringify({
      isActive: data.brevo?.isActive,
      hasKey: !!data.brevo?.apiKey,
      keyLength: data.brevo?.apiKey?.length,
      sender: data.brevo?.senderEmail
    }, null, 2));

    const apiKey = data.brevo?.apiKey || process.env.BREVO_API_KEY;
    if (!data.brevo?.isActive || !apiKey) {
      console.warn("Mail would be skipped: isActive=" + data.brevo?.isActive + ", hasKey=" + !!apiKey);
    } else {
      console.log("Key is present, ready to send.");
    }
  } catch (e) {
    console.error("Error parsing settings:", e);
  }
}

testMail();
