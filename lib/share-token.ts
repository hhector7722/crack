import { createHash, randomBytes, timingSafeEqual } from "crypto";

export function generateShareToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashShareToken(token: string): string {
  const pepper = process.env.SHARE_TOKEN_PEPPER ?? "";
  return createHash("sha256")
    .update(`${pepper}${token}`)
    .digest("hex");
}

export function tokensMatch(provided: string, storedHash: string): boolean {
  const hash = hashShareToken(provided);
  try {
    return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(storedHash, "hex"));
  } catch {
    return false;
  }
}
