"use client";

import { signOut } from "@/app/login/actions";

export function ProfileView() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="content-row w-full text-left text-sm font-semibold text-red-400 active:opacity-70"
      >
        Cerrar sesión
      </button>
    </form>
  );
}
