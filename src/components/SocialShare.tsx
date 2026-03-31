"use client";

import { useAuth } from "./AuthContext";

type SocialMedia = {
  facebook: boolean;
  instagram: boolean;
  linkedin: boolean;
  tiktok: boolean;
};

type SocialLinks = {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  tiktok?: string;
};

interface SocialShareProps {
  articleId: string;
  articleTitle: string;
  socialMedia: SocialMedia;
  socialLinks?: SocialLinks;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "filled" | "ghost";
  showLabel?: boolean;
}

export const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z"/>
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.984 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.058.935 20.39.522 19.6 0.31c.296-.058 1.636-.261 2.913-.072C15.667 0.015 15.26 0 12 0zm0 2.16c3.203 0 3.58.016 4.85.074 1.17.054 1.802.249 2.227.415.562.217.96.477 1.381.896.419.42.679.819.896 1.381.166.425.361 1.057.415 2.227.058 1.27.074 1.647.074 4.85s-.016 3.58-.074 4.85c-.054 1.17-.249 1.802-.415 2.227-.217.562-.477.96-.896 1.381-.42.419-.819.679-1.381.896-.425.166-1.057.361-2.227.415-1.27.058-1.647.074-4.85.074s-3.58-.016-4.85-.074c-1.17-.054-1.802-.249-2.227-.415-.562-.217-.96-.477-1.381-.896-.419-.42-.679-.819-.896-1.381-.166-.425-.361-1.057-.415-2.227C2.176 15.58 2.16 15.203 2.16 12s.016-3.58.074-4.85c.054-1.17.249-1.802.415-2.227.217-.562.477-.96.896-1.381.42-.419.819-.679 1.381-.896.425-.166 1.057-.361 2.227-.415 1.27-.058 1.647-.074 4.85-.074zm0 3.678c-3.413 0-6.162 2.748-6.162 6.162 0 3.413 2.749 6.162 6.162 6.162 3.413 0 6.162-2.749 6.162-6.162 0-3.414-2.749-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.645-1.44-1.44 0-.794.645-1.439 1.44-1.439.794 0 1.44.645 1.44 1.439z"/>
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.01.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.59-1.01V14.5c.01 2.32-.6 4.67-2.06 6.47-2.95 3.64-8.56 4.08-12.08 1.08-3.03-2.58-3.57-7.44-1.26-10.67 1.88-2.63 5.22-3.72 8.35-2.76V12.7c-1.32-.46-2.88-.35-4.03.48-1.36.98-1.77 2.82-1.14 4.31.55 1.29 1.89 2.14 3.27 2.23 1.58.07 3.16-.92 3.73-2.39.15-.36.2-.76.2-1.15V.02z"/>
    </svg>
  ),
};

export default function SocialShare({
  articleId,
  articleTitle,
  socialMedia,
  socialLinks = {},
  size = "md",
  variant = "filled",
  showLabel = true,
}: SocialShareProps) {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "Admin" || profile?.role === "Editor";

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "https://enzymatica.se");
  const articleUrl = `${siteUrl}/articles/${articleId}`;

  const getShareUrl = (platform: string) => {
    const encodedUrl = encodeURIComponent(articleUrl);
    const encodedTitle = encodeURIComponent(articleTitle);

    switch (platform) {
      case "facebook":
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      case "linkedin":
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
      default:
        // Instagram and TikTok don't have direct web share URLs
        // We fallback to the original link if available (likely the post)
        return socialLinks[platform as keyof SocialLinks] || "#";
    }
  };

  const colors: Record<string, string> = {
    facebook: "bg-blue-600 text-white",
    linkedin: "bg-blue-700 text-white",
    instagram: "bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 text-white",
    tiktok: "bg-black text-white",
  };

  const sizeClasses = {
    xs: "w-4 h-4 p-0.5 rounded-sm",
    sm: "w-5 h-5 p-1 rounded-md",
    md: "w-8 h-8 p-2 rounded-xl",
    lg: "w-10 h-10 p-2.5 rounded-2xl",
  };

  const platforms = Object.entries(socialMedia)
    .filter(([_, active]) => active)
    .map(([platform]) => platform);

  if (platforms.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-4 items-center ${variant === "filled" ? "py-4" : ""}`}>
      {showLabel && (
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          {isAdmin ? "Publicerad via" : "Dela via"}
        </span>
      )}
      <div className={`flex ${size === "xs" ? "gap-1" : "gap-3"}`}>
        {platforms.map((platform) => {
          const href = isAdmin 
            ? socialLinks[platform as keyof SocialLinks] || "#" 
            : getShareUrl(platform);

          const iconColor = variant === "ghost" 
            ? (colors[platform]?.split(" ")[0].replace("bg-", "text-") || "text-gray-400")
            : "";

          return (
            <a
              key={platform}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`${sizeClasses[size]} flex items-center justify-center transition-all ${
                variant === "filled" 
                  ? `${colors[platform] || "bg-gray-200"} shadow-md hover:scale-110` 
                  : `${iconColor} opacity-70 hover:opacity-100 hover:scale-125`
              }`}
              title={isAdmin ? `Se på ${platform}` : `Dela på ${platform}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full h-full">
                {SOCIAL_ICONS[platform]}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
