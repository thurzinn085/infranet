import bcrypt from "bcryptjs";
import { checkPasswordRules, isPasswordValid } from "./password-rules";

export { checkPasswordRules, isPasswordValid } from "./password-rules";
export type { PasswordRuleCheck } from "./password-rules";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
