import { Suspense } from "react";
import { AuthCallbackClient } from "./auth-callback-client";

export default function AuthCallbackClientPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-zinc-950">
          <p className="text-zinc-500">Verificando...</p>
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
