import bcrypt from "bcryptjs";
import { createHash } from "crypto";

export type PasswordRuleCheck = {
  minLength: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
};

// Usado tanto no formulario (para mostrar o checklist em tempo real)
// quanto no backend (para nunca confiar apenas na validacao do frontend).
export function checkPasswordRules(password: string): PasswordRuleCheck {
  return {
    minLength: password.length >= 6,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };
}

export function isPasswordValid(password: string): boolean {
  const rules = checkPasswordRules(password);
  return rules.minLength && rules.hasUppercase && rules.hasNumber;
}

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
