import bcrypt from "bcryptjs";

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

// Codigos numericos de 6 digitos para confirmacao de e-mail / recuperacao de senha.
export function generateNumericCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function hashCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

export async function verifyCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}
