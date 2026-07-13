"use client";

import { usePathname, useRouter } from "next/navigation";

export function DropSideWidget() {
  const pathname = usePathname();
  const router = useRouter();

  if (
    pathname.startsWith("/drop") ||
    pathname === "/login" ||
    pathname.startsWith("/auth")
  ) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => router.push("/drop")}
      aria-label="Abrir Drop"
      className="pointer-events-auto fixed right-0 z-[96] flex h-14 min-h-12 w-[3.5rem] shrink-0 items-center justify-center overflow-hidden rounded-l-2xl rounded-r-none bg-zinc-950 shadow-[-6px_6px_20px_rgba(0,0,0,0.45),-2px_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(212,175,55,0.12)] ring-1 ring-inset ring-amber-500/25 transition-[transform,box-shadow,width] duration-300 ease-out hover:w-[3.75rem] hover:-translate-x-1 hover:shadow-[-10px_8px_28px_rgba(0,0,0,0.5),-3px_3px_10px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(212,175,55,0.18)] active:translate-x-0 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
      style={{
        bottom:
          "max(calc(var(--tm-bottom-chrome-block, 7rem) + 1rem), calc(env(safe-area-inset-bottom, 0px) + 5.5rem))",
      }}
    >
      <img
        src="/icons/drop-widget-icon.png"
        alt=""
        width={44}
        height={44}
        className="h-11 w-11 -translate-x-0.5 object-cover"
        aria-hidden
      />
    </button>
  );
}
