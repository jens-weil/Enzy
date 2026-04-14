"use client";

import { usePathname } from "next/navigation";

export default function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/partner");

  // For non-dashboard pages, we want the content to be at least 100vh 
  // so the footer starts below the fold (given the 61px header offset).
  // For dashboard pages, we want the container to be exactly the remaining 
  // viewport height and not scroll itself.
  return (
    <main className={`flex-grow ${isDashboard ? "h-[calc(100vh-61px)] overflow-hidden" : "min-h-screen"}`}>
      {children}
    </main>
  );
}
