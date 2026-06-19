export function isOpenAIQuotaError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;

  const e = err as {
    status?: number;
    code?: string;
    error?: { code?: string; type?: string; message?: string };
    message?: string;
  };

  const status = e.status;
  if (status === 429 || status === 402) return true;

  const code = e.code ?? e.error?.code ?? e.error?.type ?? "";
  if (
    code === "insufficient_quota" ||
    code === "billing_not_active" ||
    code === "rate_limit_exceeded"
  ) {
    return true;
  }

  const message = (e.message ?? e.error?.message ?? "").toLowerCase();
  return (
    message.includes("insufficient_quota") ||
    message.includes("exceeded your current quota") ||
    message.includes("billing") ||
    message.includes("credit") ||
    message.includes("quota") ||
    message.includes("payment")
  );
}
