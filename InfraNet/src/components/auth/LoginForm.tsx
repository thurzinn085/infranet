"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginSchema } from "@/lib/validators";
import { formatValidationMessage } from "@/lib/validation-messages";
import TextField from "@/components/ui/TextField";
import PasswordField from "@/components/ui/PasswordField";
import Button from "@/components/ui/Button";
type Props = {
  notice?: string | null;
  onSwitchToSignup: () => void;
};

const buttonClass =
  "min-h-12 rounded-xl bg-[#C8FF00] px-5 font-display text-base font-semibold text-[#101010] transition duration-200 hover:-translate-y-0.5 hover:bg-[#d6ff45] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C8FF00] disabled:translate-y-0 disabled:opacity-60";

export default function LoginForm({ notice, onSwitchToSignup }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const parsed = loginSchema.safeParse({ email, password, rememberMe });
    if (!parsed.success) {
      setFieldErrors(Object.fromEntries(parsed.error.issues.map((issue) => [
        String(issue.path[0]),
        formatValidationMessage(issue.message),
      ])));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Não foi possível entrar.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Falha de conexão. Verifique a internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {notice && (
        <p role="status" className="rounded-xl border border-[#C8FF00]/40 bg-[#C8FF00]/10 px-4 py-3 text-sm text-[#E8FF9A]">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-xl border border-white/30 bg-white/5 px-4 py-3 text-sm text-white">
          {error}
        </p>
      )}

      <TextField
        label="E-mail ou usuário"
        type="text"
        name="email"
        placeholder="seu@email.com"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        hint="Use o e-mail cadastrado na conta."
        disabled={loading}
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          setFieldErrors((current) => ({ ...current, email: "" }));
        }}
        error={fieldErrors.email}
      />

      <PasswordField
        label="Senha"
        name="password"
        autoComplete="current-password"
        disabled={loading}
        value={password}
        onChange={(event) => {
          setPassword(event.target.value);
          setFieldErrors((current) => ({ ...current, password: "" }));
        }}
        error={fieldErrors.password}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-[#d0d0d0]">
          <input
            type="checkbox"
            checked={rememberMe}
            disabled={loading}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="h-5 w-5 rounded border-[#555] bg-[#171717] accent-[#C8FF00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8FF00]"
          />
          Lembrar de mim
        </label>
        <Link
          href="/forgot-password"
          className="rounded text-sm font-medium text-[#C8FF00] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C8FF00]"
        >
          Esqueci minha senha
        </Link>
      </div>

      <Button type="submit" loading={loading} className={buttonClass}>
        Entrar
      </Button>

      <p className="text-center text-sm text-[#a6a6a6]">
        Ainda não tem conta?{" "}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="rounded font-semibold text-[#C8FF00] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C8FF00]"
        >
          Criar conta
        </button>
      </p>
    </form>
  );
}
