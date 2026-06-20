import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Hanken_Grotesk, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";

import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import CustomCursor from "@/components/cursor/CustomCursor";
import Header from "@/components/layout/Header";
import Menu from "@/components/layout/Menu";
import Footer from "@/components/layout/Footer";
import { getContent } from "@/lib/content";

// Display: industrial urban-signage condensed grotesque (murals + title-screen).
const display = Big_Shoulders({
  subsets: ["latin"],
  variable: "--font-bigshoulders",
  display: "swap",
});

// Body: clean, highly legible humanist grotesque.
const body = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

// HUD / numerics: characterful monospace for counters and chapter index.
const mono = Spline_Sans_Mono({
  subsets: ["latin"],
  variable: "--font-spline",
  display: "swap",
});

const SITE_URL = "https://insomniamurals.studio";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Insomnia Murals — Nocturnal mural studio & brand identity",
    template: "%s — Insomnia Murals",
  },
  description:
    "A sleepless studio painting large-scale murals and building brand identity. We turn blank concrete into landmarks — cinematic, large, and built to last.",
  keywords: [
    "mural studio",
    "large-scale murals",
    "street art",
    "brand identity",
    "public art",
    "Insomnia Murals",
  ],
  openGraph: {
    title: "Insomnia Murals — Nocturnal mural studio",
    description:
      "Large-scale murals and brand identity from a sleepless studio. We turn blank walls into landmarks.",
    url: SITE_URL,
    siteName: "Insomnia Murals",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Insomnia Murals",
    description: "Large-scale murals and brand identity from a sleepless studio.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0e",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { settings } = await getContent();
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SmoothScrollProvider>
          <CustomCursor />
          <Header />
          <Menu settings={settings} />
          <main id="main">{children}</main>
          <Footer settings={settings} />
        </SmoothScrollProvider>
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
