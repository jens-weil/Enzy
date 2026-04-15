/**
 * Centralized site configuration to avoid hardcoded URLs across the application.
 * Favors the environment variable NEXT_PUBLIC_SITE_URL but falls back to the production domain.
 */
export function getSiteUrl(): string {
  let siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  
  // In production, if the URL is missing or points to localhost, force the production domain.
  if (!siteUrl || siteUrl.includes('localhost')) {
    if (process.env.NODE_ENV === 'production') {
      siteUrl = 'https://enzy.fantastico.life';
    } else {
      siteUrl = siteUrl || 'http://localhost:3000';
    }
  }
  
  // Ensure no trailing slash for consistency
  return siteUrl.replace(/\/$/, "");
}
