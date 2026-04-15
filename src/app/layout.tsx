import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ConditionalFooter from "@/components/ConditionalFooter";
import MainContent from "@/components/MainContent";
import SiteLock from "@/components/SiteLock";
import { AuthProvider } from "@/components/AuthContext";
import FacebookSDK from "@/components/FacebookSDK";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Enzymatica - Barriärteknik som skyddar",
  description: "Barriärteknik som skyddar och förebygger",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv" className="scroll-smooth">
      <body
        className={`${inter.className} antialiased min-h-screen flex flex-col pt-[61px]`}
      >
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
