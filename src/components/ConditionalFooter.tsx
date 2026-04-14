"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function ConditionalFooter() {
  const pathname = usePathname();
  
  // Hide footer on partner portal and admin pages for a cleaner dashboard look
  const hideOnPaths = ["/partner"];
  const shouldHide = hideOnPaths.some(path => pathname.startsWith(path));

  if (shouldHide) return null;

  return <Footer />;
}
