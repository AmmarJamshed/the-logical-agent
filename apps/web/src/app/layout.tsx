import type { Metadata } from "next";
import { JetBrains_Mono, Outfit, Space_Grotesk } from "next/font/google";
import { Providers } from "@/components/providers";
import "@/styles/globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const sans = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "The Logical Agent — Technology. Research. Intelligence.",
    template: "%s · The Logical Agent",
  },
  description:
    "AI-powered media, research, and social intelligence platform. The Bloomberg of Technology.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  icons: {
    icon: "/brand/logical-agent-logo.png",
    apple: "/brand/logical-agent-logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${display.variable} ${sans.variable} ${mono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
