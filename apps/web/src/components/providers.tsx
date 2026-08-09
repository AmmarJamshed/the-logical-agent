"use client";

import { ThemeProvider } from "next-themes";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { CursorGlow, ScrollProgress } from "@/components/interactive";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <ScrollProgress />
      <CursorGlow />
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </ThemeProvider>
  );
}
