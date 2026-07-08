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
    icon: [{ url: "/icons/drop.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
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
      <link rel="icon" type="image/svg+xml" href="/icons/drop.svg" />
      {children}
    </>
  );
}
