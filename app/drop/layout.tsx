import type { Metadata } from "next";

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
    ],
    apple: [
      {
        url: "/icons/drop-apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export default function DropLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link rel="manifest" href="/manifest-drop.json" />
      <link rel="icon" type="image/png" href="/icons/drop-favicon.png" />
      <link
        rel="apple-touch-icon"
        href="/icons/drop-apple-touch-icon.png"
        sizes="180x180"
      />
      {children}
    </>
  );
}
