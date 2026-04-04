"use client";

import { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

export default function FacebookSDK() {
  useEffect(() => {
    // This function will be called by the Facebook SDK once it is loaded
    window.fbAsyncInit = function () {
      const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
      
      if (!appId) {
        console.warn("Facebook SDK: NEXT_PUBLIC_FACEBOOK_APP_ID is missing.");
        return;
      }

      window.FB.init({
        appId: appId,
        cookie: true,
        xfbml: true,
        version: "v19.0",
      });
      
      console.log("Facebook SDK Initialized");
    };
  }, []);

  return (
    <Script
      id="facebook-jssdk"
      src="https://connect.facebook.net/sv_SE/sdk.js"
      strategy="afterInteractive"
      onLoad={() => {
        // Fallback in case fbAsyncInit was defined after script load
        if (window.FB && !window.fbAsyncInit) {
          // FB is already here
        }
      }}
    />
  );
}
