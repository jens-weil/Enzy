"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

declare global {
  interface Window {
    FB: any;
  }
}

type SocialMedia = {
  facebook: boolean;
  instagram: boolean;
  linkedin: boolean;
  tiktok: boolean;
  x: boolean;
};

type SocialLinks = {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  tiktok?: string;
  x?: string;
};

interface SocialShareProps {
  articleId: string;
  articleTitle: string;
  socialMedia: SocialMedia;
  socialLinks?: SocialLinks;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "filled" | "ghost";
  showLabel?: boolean;
  hideAdminLinks?: boolean;
  channelSettings?: any;
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
  x: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.294 19.497h2.039L6.482 3.239H4.293l13.314 17.411z"/>
    </svg>
  ),
  share: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  ),
};

export default function SocialShare({
  articleId,
  articleTitle,
  socialMedia,
  socialLinks = {},
  channelSettings: propChannelSettings,
  size = "md",
  variant = "filled",
  showLabel = true,
  hideAdminLinks = false,
}: SocialShareProps) {
  const { profile, user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [shareStatus, setShareStatus] = useState<{ type: 'success' | 'info'; message: string } | null>(null);
  const [channelSettings, setChannelSettings] = useState<any>(propChannelSettings || null);
  const isAdmin = profile?.role === "Admin" || profile?.role === "Editor" || profile?.role === "Redaktör";

  useEffect(() => {
    if (!propChannelSettings) {
      fetch("/api/settings")
        .then(res => res.ok ? res.json() : null)
        .then(data => data && setChannelSettings(data))
        .catch(console.error);
    }
  }, [propChannelSettings]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "https://enzymatica.se");
  const articleUrl = `${siteUrl}/articles/${articleId}`;

  // 1. Determine which platforms to show "Share" buttons for (FB, LinkedIn, X - if active)
  const shareablePlatforms = ["facebook", "linkedin", "x"]
    .filter(p => {
      const isActive = channelSettings?.[p]?.isActive ?? (p === 'facebook');
      return isActive;
    });

  // 2. Determine which platforms to show "View Post" buttons for (Admin/Editor only, if link exists)
  const postedPlatforms = isAdmin 
    ? ["facebook", "linkedin", "instagram", "tiktok", "x"].filter(p => {
        const link = socialLinks[p as keyof SocialLinks];
        return link && link !== "#" && link !== "";
      })
    : [];

  const handleShare = async (platform: string) => {
    // 1. Record the share if user is logged in
    if (profile?.id) {
      try {
        await fetch("/api/shares", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            articleId,
            articleTitle,
            platform,
            userId: profile.id,
            userEmail: user?.email
          })
        });
      } catch (error) {
        console.error("Failed to record share event:", error);
      }
    }

    if (platform === "facebook") {
      const postUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`;
      window.open(postUrl, "_blank", "noopener,noreferrer,width=600,height=400");
      return;
    }

    if (platform === "linkedin") {
      const postUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`;
      window.open(postUrl, "_blank", "noopener,noreferrer,width=600,height=550");
      return;
    }

    if (platform === "x") {
      const postUrl = `https://x.com/intent/post?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(articleTitle)}`;
      window.open(postUrl, "_blank", "noopener,noreferrer,width=600,height=450");
      return;
    }

    // Generic Share (Global Dialog) or Fallback for IG/TikTok
    // We prioritize navigator.share (the native OS share sheet) if available
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: articleTitle,
          text: "Kollade precis på den här artikeln från Enzymatica!",
          url: articleUrl,
        });
        return;
      } catch (err) {
        // If user cancelled, don't fall back to clipboard
        if ((err as Error).name === 'AbortError') return;
        console.error("Native share failed:", err);
      }
    }
    
    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(articleUrl);
      setCopied(true);
      
      if (platform === "instagram" || platform === "tiktok") {
        setShareStatus({ 
          type: 'info', 
          message: `${platform === "instagram" ? "Instagram" : "TikTok"} stödjer inte direkt delning. Länken är kopierad – klistra in den i appen!` 
        });
        window.open(platform === "instagram" ? "https://www.instagram.com" : "https://www.tiktok.com", "_blank", "noopener,noreferrer");
      } else {
        setShareStatus({ type: 'success', message: "Länk kopierad till urklipp!" });
      }

      setTimeout(() => {
        setCopied(false);
        setShareStatus(null);
      }, 4000);
    } catch (err) {
      console.error("Clipboard failed:", err);
    }
  };

  const colors: Record<string, string> = {
    facebook: "bg-blue-600 text-white",
    linkedin: "bg-blue-700 text-white",
    instagram: "bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 text-white",
    tiktok: "bg-black text-white",
    x: "bg-black text-white",
    share: "bg-brand-teal text-white",
  };

  const sizeClasses = {
    xs: "w-7 h-7 p-1 rounded-sm",
    sm: "w-9 h-9 p-2 rounded-md",
    md: "w-11 h-11 p-3 rounded-2xl",
    lg: "w-16 h-16 p-4 rounded-[1.8rem]",
  };
  
  return (
    <div className={`flex flex-col gap-6 ${variant === "filled" ? "py-4" : ""}`}>
      {/* SHARING SECTION (All Users) */}
      <div className="space-y-3">
        {showLabel && (
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
            {copied ? "Länk kopierad!" : "Dela artikeln"}
            {copied && <span className="text-brand-teal text-[8px]">✓</span>}
          </span>
        )}
        <div className={`flex flex-wrap items-center ${size === "xs" ? "gap-2" : "gap-4"}`}>
          {/* Universal Share Button */}
          <button
            onClick={(e) => { e.stopPropagation(); handleShare("share"); }}
            className={`${sizeClasses[size]} flex items-center justify-center transition-all ${
              variant === "filled" ? `${colors.share} shadow-lg hover:scale-110` : "text-brand-teal opacity-80 hover:opacity-100 hover:scale-125"
            }`}
            title="Dela via..."
          >
            <div className="w-full h-full p-0.5">{SOCIAL_ICONS.share}</div>
          </button>

          {shareablePlatforms.map((platform) => (
            <button
              key={`share-${platform}`}
              onClick={(e) => { e.stopPropagation(); handleShare(platform); }}
              className={`${sizeClasses[size]} flex items-center justify-center transition-all ${
                variant === "filled" 
                  ? `${colors[platform]} shadow-md hover:scale-110` 
                  : `${colors[platform]?.split(" ")[0].replace("bg-", "text-") || "text-gray-400"} opacity-90 hover:opacity-100 hover:scale-125`
              }`}
              title={`Dela på ${platform}`}
            >
              <div className="w-full h-full p-0.5">{SOCIAL_ICONS[platform]}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ADMIN SECTION (Internal post links) - Hidden if hideAdminLinks is true */}
      {postedPlatforms.length > 0 && !hideAdminLinks && (
        <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-slate-800/50">
          <span className="text-[8px] font-black text-brand-teal uppercase tracking-widest italic opacity-70">
            Administratör: Visa publicerade inlägg
          </span>
          <div className="flex flex-wrap items-center gap-3">
            {postedPlatforms.map((platform) => {
              const postUrl = socialLinks[platform as keyof SocialLinks];
              return (
                <button
                  key={`view-${platform}`}
                  onClick={(e) => { e.stopPropagation(); window.open(postUrl, "_blank", "noopener,noreferrer"); }}
                  className="px-4 py-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-brand-teal/20 flex items-center gap-2 hover:bg-brand-teal/5 transition-all group"
                  title={`Visa inlägg på ${platform}`}
                >
                  <div className="w-4 h-4 text-brand-teal">{SOCIAL_ICONS[platform]}</div>
                  <span className="text-[10px] font-black text-brand-dark dark:text-white uppercase tracking-tighter">
                    {platform}
                  </span>
                  <svg className="w-2.5 h-2.5 text-brand-teal opacity-40 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Share Notification Toast */}
      {shareStatus && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className={`px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-md ${
            shareStatus.type === 'success' ? 'bg-brand-teal/90 border-brand-teal text-white' : 'bg-brand-dark/90 border-slate-700 text-white'
          }`}>
            <div className="w-5 h-5 flex-shrink-0">
              {shareStatus.type === 'success' ? (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )}
            </div>
            <p className="text-xs font-black uppercase tracking-widest leading-tight">{shareStatus.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}

