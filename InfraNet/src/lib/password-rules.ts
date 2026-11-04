export type PasswordRuleCheck = {
  minLength: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
};

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
