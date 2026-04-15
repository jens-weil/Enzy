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
  
  const activeAPIKey = settings?.apiKey || process.env.BREVO_API_KEY;

  if (!settings?.isActive || !activeAPIKey) {
    console.warn("Email sending skipped: Brevo is not active or API key is missing.");
    return { success: false, message: "Email settings not configured" };
  }

  const sender = customSender || {
    name: settings.senderName || "Enzymatica",
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
      const error = await response.json();
      console.error("Brevo API error:", error);
      return { success: false, error };
    }
  } catch (error) {
    console.error("Failed to send email via Brevo:", error);
    return { success: false, error };
  }
}
