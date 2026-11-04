import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { checkPasswordRules, isPasswordValid } from "./password-rules";

export { checkPasswordRules, isPasswordValid } from "./password-rules";
export type { PasswordRuleCheck } from "./password-rules";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function normalizeSecurityAnswer(answer: string): string {
  const normalizedAnswer = answer
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .trim()
    .replace(/\s+/g, " ");
  return createHash("sha256").update(normalizedAnswer).digest("hex");
}

export async function hashSecurityAnswer(answer: string): Promise<string> {
  return bcrypt.hash(normalizeSecurityAnswer(answer), 12);
}

export async function verifySecurityAnswer(answer: string, hash: string): Promise<boolean> {
  return bcrypt.compare(normalizeSecurityAnswer(answer), hash);
}
