"use client";

import { FormEvent, useState } from "react";
import { registerSchema } from "@/lib/validators";
import { checkPasswordRules } from "@/lib/password-rules";
import { formatValidationMessage } from "@/lib/validation-messages";
import TextField from "@/components/ui/TextField";
import PasswordField from "@/components/ui/PasswordField";
import Button from "@/components/ui/Button";

type Props = {
  onSwitchToLogin: () => void;
  onSuccess: () => void;
};

const buttonClass =
  "min-h-12 rounded-xl bg-[#C8FF00] px-5 font-display text-base font-semibold text-[#101010] transition duration-200 hover:-translate-y-0.5 hover:bg-[#d6ff45] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C8FF00] disabled:translate-y-0 disabled:opacity-60";

function PasswordRule({ met, children }: { met: boolean; children: string }) {
  return (
    <li className={met ? "text-[#C8FF00]" : "text-[#999]"}>
      <span aria-hidden="true" className="mr-2">{met ? "✓" : "○"}</span>
      {children}
    </li>
  );
}

export default function SignupForm({ onSwitchToLogin, onSuccess }: Props) {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [confirmSecurityAnswer, setConfirmSecurityAnswer] = useState("");
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const rules = checkPasswordRules(password);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const parsed = registerSchema.safeParse({
      firstName,
      lastName: "",
      email,
      password,
      confirmPassword,
      securityQuestion,
      securityAnswer,
      confirmSecurityAnswer,
    });

    if (!parsed.success) {
      setFieldErrors(Object.fromEntries(parsed.error.issues.map((issue) => [
        String(issue.path[0]),
        issue.path[0] === "password"
          ? "A senha precisa ter pelo menos 6 caracteres, uma letra maiúscula e um número."
          : formatValidationMessage(issue.message),
      ])));
      if (parsed.error.issues.some((issue) => ["securityQuestion", "securityAnswer", "confirmSecurityAnswer"].includes(String(issue.path[0])))) {
        setRecoveryOpen(true);
      }
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Não foi possível criar a conta.");
        return;
      }

      onSuccess();
    } catch {
      setError("Falha de conexão. Verifique a internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {error && (
        <p role="alert" className="rounded-xl border border-white/30 bg-white/5 px-4 py-3 text-sm text-white">
          {error}
        </p>
      )}

      <TextField
        label="Nome"
        name="firstName"
        autoComplete="given-name"
        disabled={loading}
        value={firstName}
        onChange={(event) => {
          setFirstName(event.target.value);
          setFieldErrors((current) => ({ ...current, firstName: "" }));
        }}
        error={fieldErrors.firstName}
      />

      <TextField
        label="E-mail"
        type="email"
        name="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        disabled={loading}
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          setFieldErrors((current) => ({ ...current, email: "" }));
        }}
        error={fieldErrors.email}
      />

      <div>
        <PasswordField
          label="Senha"
          name="password"
          autoComplete="new-password"
          disabled={loading}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setFieldErrors((current) => ({ ...current, password: "" }));
          }}
          error={fieldErrors.password}
        />
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label="Requisitos da senha">
          <PasswordRule met={rules.minLength}>6 caracteres</PasswordRule>
          <PasswordRule met={rules.hasUppercase}>uma letra maiúscula</PasswordRule>
          <PasswordRule met={rules.hasNumber}>um número</PasswordRule>
        </ul>
      </div>

      <PasswordField
        label="Confirmar senha"
        name="confirmPassword"
        autoComplete="new-password"
        disabled={loading}
        value={confirmPassword}
        onChange={(event) => {
          setConfirmPassword(event.target.value);
          setFieldErrors((current) => ({ ...current, confirmPassword: "" }));
        }}
        error={fieldErrors.confirmPassword}
      />

      <details
        open={recoveryOpen}
        onToggle={(event) => setRecoveryOpen(event.currentTarget.open)}
        className="rounded-xl border border-[#2b2b2b] bg-[#141414]"
      >
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-medium text-white [&::-webkit-details-marker]:hidden">
          Dados para recuperação (obrigatório)
          <span aria-hidden="true" className="text-[#C8FF00]">⌄</span>
        </summary>
        <div className="space-y-4 border-t border-[#2b2b2b] p-4">
          <p className="text-xs leading-5 text-[#a6a6a6]">
            Esses dados são necessários para redefinir a senha caso você perca o acesso.
          </p>
          <TextField
            label="Pergunta de recuperação"
            name="securityQuestion"
            maxLength={200}
            disabled={loading}
            value={securityQuestion}
            onChange={(event) => {
              setSecurityQuestion(event.target.value);
              setFieldErrors((current) => ({ ...current, securityQuestion: "" }));
            }}
            error={fieldErrors.securityQuestion}
          />
          <TextField
            label="Resposta de recuperação"
            name="securityAnswer"
            maxLength={120}
            autoComplete="off"
            disabled={loading}
            value={securityAnswer}
            onChange={(event) => {
              setSecurityAnswer(event.target.value);
              setFieldErrors((current) => ({ ...current, securityAnswer: "" }));
            }}
            error={fieldErrors.securityAnswer}
          />
          <TextField
            label="Confirmar resposta"
            name="confirmSecurityAnswer"
            maxLength={120}
            autoComplete="off"
            disabled={loading}
            value={confirmSecurityAnswer}
            onChange={(event) => {
              setConfirmSecurityAnswer(event.target.value);
              setFieldErrors((current) => ({ ...current, confirmSecurityAnswer: "" }));
            }}
            error={fieldErrors.confirmSecurityAnswer}
          />
        </div>
      </details>

      <Button type="submit" loading={loading} className={buttonClass}>
        Criar conta
      </Button>

      <p className="text-center text-sm text-[#a6a6a6]">
        Já tem conta?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="rounded font-semibold text-[#C8FF00] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C8FF00]"
        >
          Entrar
        </button>
      </p>
    </form>
  );
}
