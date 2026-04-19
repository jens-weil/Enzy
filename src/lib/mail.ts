import fs from 'fs';
import { getSettingsPath } from './settingsPath';

/**
 * Utility for sending transactional emails via Brevo HTTP API
 */

interface Sender {
  name: string;
  email: string;
}

interface Recipient {
  email: string;
  name?: string;
}

interface SendEmailParams {
  to: Recipient[];
  subject: string;
  htmlContent: string;
  sender?: Sender;
}

async function getEmailSettings() {
  const settingsPath = getSettingsPath();
  
  if (fs.existsSync(settingsPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      return data.brevo || null;
    } catch (e) {
      return null;
    }
  }
  return null;
}

export async function sendEmail({ to, subject, htmlContent, sender: customSender }: SendEmailParams) {
  const settings = await getEmailSettings();
  
  const apiKeyFromSettings = settings?.apiKey;
  const apiKeyFromEnv = process.env.BREVO_API_KEY;
  const activeAPIKey = apiKeyFromSettings || apiKeyFromEnv;

  console.log("DEBUG: sendEmail config:", { 
    hasSettings: !!settings, 
    isActive: settings?.isActive, 
    hasSettingsKey: !!apiKeyFromSettings, 
    hasEnvKey: !!apiKeyFromEnv,
    activeKeySource: apiKeyFromSettings ? "settings" : "env"
  });

  if (!settings?.isActive || !activeAPIKey) {
    console.warn("Email sending skipped: Brevo is not active or API key is missing.");
    return { success: false, error: "Brevo is not active or API key is missing" };
  }

  const companyName = (() => {
    try {
      const sPath = getSettingsPath();
      if (fs.existsSync(sPath)) {
        const data = JSON.parse(fs.readFileSync(sPath, 'utf8'));
        return data.company?.name || "COMPANY";
      }
    } catch (e) {}
    return "COMPANY";
  })();

  const sender = customSender || {
    name: settings.senderName || companyName,
    email: settings.senderEmail || "news@enzymatica.se"
  };

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": activeAPIKey as string,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sender,
        to,
        subject,
        htmlContent
      })
    });

    if (response.ok) {
      const result = await response.json();
      return { success: true, data: result };
    } else {
      const errorText = await response.text();
      let errorJson;
      try { errorJson = JSON.parse(errorText); } catch(e) { errorJson = { message: errorText }; }
      console.error("Brevo API error:", errorJson);
      return { success: false, error: errorJson };
    }
  } catch (error) {
    console.error("Failed to send email via Brevo:", error);
    return { success: false, error: (error as Error).message };
  }
}
