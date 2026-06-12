export function getOwnerEmail(): string {
  const email = process.env.OWNER_EMAIL;
  if (!email) {
    throw new Error("OWNER_EMAIL no configurado");
  }
  return email.toLowerCase().trim();
}

export function isOwnerEmail(email: string): boolean {
  try {
    return email.toLowerCase().trim() === getOwnerEmail();
  } catch {
    return false;
  }
}
