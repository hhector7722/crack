"use client";

import { CopilotChat, CopilotKitProvider } from "@copilotkit/react-core/v2";

export function CrackCopilot() {
  return (
    <section className="flex h-full min-h-0 flex-col px-2 pb-2">
      <div className="shrink-0 px-3 pb-3 pt-2">
        <h2 className="text-base font-semibold text-zinc-100">Asistente de conocimiento</h2>
        <p className="mt-1 text-xs leading-relaxed text-zinc-400">
          Pregunta sobre tus notas y enlaces guardados. La categoría Extra queda excluida.
        </p>
      </div>
      <CopilotKitProvider runtimeUrl="/api/copilotkit" agentId="default" useSingleEndpoint={false}>
        <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
          <CopilotChat />
        </div>
      </CopilotKitProvider>
    </section>
  );
}
