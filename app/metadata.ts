import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL('https://kpelitesports.com'),
  title: "KP Elite Sports - AI-Powered Fantasy Football Analytics | Professional Multi-Platform Manager",
  description: "KP Elite Sports - Professional fantasy football analytics and insights. Manage all your ESPN, Yahoo, Sleeper teams with AI-powered optimization, real-time sync, and advanced analytics.",
  keywords: "KP Elite Sports, fantasy football, professional fantasy analytics, ESPN fantasy, Yahoo fantasy, Sleeper app, fantasy football AI, multi-team manager, real-time fantasy scores, lineup optimizer, fantasy football 2025, NFL fantasy, fantasy command center, player rankings, injury alerts, live scores, KP Technology Solutions",
  authors: [{ name: "KP Technology Solutions" }],
  openGraph: {
    title: "KP Elite Sports - Professional Fantasy Football Analytics",
    description: "Advanced AI-powered fantasy football platform by KP Technology Solutions. Optimize lineups, analyze matchups, and dominate your leagues with professional-grade analytics.",
    url: "https://kpelitesports.com",
    siteName: "KP Elite Sports",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "KP Elite Sports - Professional Fantasy Football Analytics Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KP Elite Sports - Professional Fantasy Analytics",
    description: "Advanced fantasy football platform by KP Technology Solutions. AI-powered optimization and analytics. 🏆",
    images: ["/og-image.png"],
    creator: "@kpelitesports",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://kpelitesports.com",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
};