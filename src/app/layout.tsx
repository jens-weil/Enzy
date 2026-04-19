import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ConditionalFooter from "@/components/ConditionalFooter";
import MainContent from "@/components/MainContent";
import SiteLock from "@/components/SiteLock";
import { AuthProvider } from "@/components/AuthContext";
import FacebookSDK from "@/components/FacebookSDK";
import ThemeVariableInjector from "@/components/ThemeVariableInjector";

import fs from "fs";
import { getSettingsPath } from "@/lib/settingsPath";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const settingsPath = getSettingsPath();
  let companyName = "Enzymatica";
  
  if (fs.existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
      if (settings.company?.name) {
        companyName = settings.company.name;
      }
    } catch (e) {
      console.error("Failed to parse settings for metadata", e);
    }
  }

  return {
    title: `${companyName} - Barriärteknik som skyddar`,
    description: "Barriärteknik som skyddar och förebygger",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settingsPath = getSettingsPath();
  let initialColors = undefined;

  if (fs.existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
      if (settings.theme?.colors) {
        initialColors = settings.theme.colors;
      }
    } catch (e) {
      console.error("Failed to parse settings for theme colors", e);
    }
  }

  return (
    <html lang="sv" className="scroll-smooth">
      <body
        className={`${inter.className} antialiased min-h-screen flex flex-col pt-[61px]`}
      >
        <ThemeVariableInjector initialColors={initialColors} />
        <FacebookSDK />
        <AuthProvider>
          <SiteLock />
          <Navbar />
          <MainContent>
            {children}
          </MainContent>
          <ConditionalFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
