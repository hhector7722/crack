import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Crack",
  description: "Asistente personal de bolsillo",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Crack",
  },
  icons: {
    icon: [
      { url: "/icons/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} dark overflow-hidden antialiased`}
    >
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){function lift(v,h){if(!v)return 0;if(v.height<h*0.82)return Math.max(0,Math.round(h-v.offsetTop-v.height));return 0}function s(){var v=window.visualViewport,h=window.innerHeight,t=(v&&v.offsetTop)||0,hh=(v&&v.height)||h,r=document.documentElement;r.style.setProperty('--app-height',(hh+t)+'px');r.style.setProperty('--app-offset-top',t+'px');r.style.setProperty('--app-chrome-bottom-lift',lift(v,h)+'px')}s();window.addEventListener('resize',s);window.addEventListener('orientationchange',s);window.visualViewport&&(window.visualViewport.addEventListener('resize',s),window.visualViewport.addEventListener('scroll',s))})();`,
          }}
        />
      </head>
      <body className="overflow-hidden bg-zinc-950 font-sans text-zinc-100">
        {children}
      </body>
    </html>
  );
}
