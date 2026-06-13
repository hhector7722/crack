import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-950">
      <p className="text-zinc-500">Cargando...</p>
    </div>
  );
}
