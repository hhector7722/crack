"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, Image, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/notes", label: "Notas", icon: FileText },
  { href: "/media", label: "Multimedia", icon: Image },
  { href: "/audio", label: "Audio", icon: Mic },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-lg">
      <div
        className="flex items-stretch justify-around px-2 pt-2"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        {tabs.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-12 min-w-[64px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg text-xs transition-colors",
                active ? "text-zinc-100" : "text-zinc-500"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
