import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
        className={`${inter.className} antialiased min-h-screen flex flex-col pt-24`}
      >
        <FacebookSDK />
        <AuthProvider>
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
