"use client";

import { useState } from "react";
import Link from "next/link";
import TextField from "@/components/ui/TextField";
import PasswordField from "@/components/ui/PasswordField";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { checkPasswordRules } from "@/lib/password";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [question, setQuestion] = useState<string | null>(null);
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const rules = checkPasswordRules(password);
  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!question) {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Nao foi possivel iniciar a recuperacao.");
          return;
        }
        if (!data.question) {
          setError(
            "Nao foi possivel iniciar a recuperacao. A conta pode nao existir ou ainda nao ter uma pergunta cadastrada. Se nao conseguir entrar, solicite ao administrador que redefina sua senha."
          );
          return;
        }
        setQuestion(data.question);
        return;
      }

      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, securityAnswer, password, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Nao foi possivel redefinir a senha.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Falha de conexao. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <Alert kind="error">{error}</Alert>}
      {success && (
        <Alert kind="success">
          Senha redefinida. Todas as sessoes anteriores foram encerradas. Voce ja pode entrar com a nova senha.
        </Alert>
      )}

      <TextField
        label="E-mail da conta"
        type="email"
        name="email"
        required
        disabled={Boolean(question) || success}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      {question && !success && (
        <>
          <p className="rounded-md border border-white/10 bg-white/5 p-3 text-sm text-neutral-200">
            {question}
          </p>
          <button
            type="button"
            className="self-start text-sm text-neutral-300 underline hover:text-white"
            onClick={() => {
              setQuestion(null);
              setSecurityAnswer("");
              setPassword("");
              setConfirmPassword("");
              setError(null);
            }}
          >
            Usar outro e-mail
          </button>
          <TextField
            label="Resposta de recuperacao"
            name="securityAnswer"
            autoComplete="off"
            required
            value={securityAnswer}
            onChange={(e) => setSecurityAnswer(e.target.value)}
          />
          <div>
            <PasswordField
              label="Nova senha"
              name="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <ul className="mt-2 flex flex-col gap-1 text-xs text-neutral-400">
              <li className={rules.minLength ? "text-green-300" : ""}>Pelo menos 6 caracteres</li>
              <li className={rules.hasUppercase ? "text-green-300" : ""}>Pelo menos 1 letra maiuscula</li>
              <li className={rules.hasNumber ? "text-green-300" : ""}>Pelo menos 1 numero</li>
            </ul>
          </div>
          <PasswordField
            label="Confirmar nova senha"
            name="confirmPassword"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={!passwordsMatch ? "As senhas nao coincidem." : undefined}
          />
        </>
      )}

      {!success && (
        <Button type="submit" loading={loading} disabled={Boolean(question) && !passwordsMatch}>
          {question ? "Redefinir senha" : "Continuar"}
        </Button>
      )}

      <p className="text-center text-sm text-neutral-400">
        <Link href="/login" className="font-medium text-neutral-200 hover:text-white hover:underline">
          Voltar para o login
        </Link>
      </p>
    </form>
  );
}
