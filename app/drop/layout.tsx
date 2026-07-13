import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Drop",
  description: "Bandeja temporal de Crack",
  manifest: "/manifest-drop.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Drop",
  },
  icons: {
    icon: [
      { url: "/icons/drop-favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/drop-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/drop-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      {
        url: "/icons/drop-apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-title": "Drop",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export default function DropLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
