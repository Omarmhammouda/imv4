import type { Metadata, Viewport } from "next";
import { Inter, Syne, Space_Mono } from "next/font/google";
import "./globals.css";

import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import CustomCursor from "@/components/cursor/CustomCursor";
import Header from "@/components/layout/Header";
import Menu from "@/components/layout/Menu";
import Footer from "@/components/layout/Footer";
import FloatingContact from "@/components/layout/FloatingContact";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-spacemono",
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${syne.variable} ${spaceMono.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SmoothScrollProvider>
          <CustomCursor />
          <Header />
          <Menu />
          <main id="main">{children}</main>
          <Footer />
          <FloatingContact />
        </SmoothScrollProvider>
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
