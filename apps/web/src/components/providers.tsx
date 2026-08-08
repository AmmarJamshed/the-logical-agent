"use client";

import { ThemeProvider } from "next-themes";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </ThemeProvider>
  );
}
