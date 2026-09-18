"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TextField from "@/components/ui/TextField";
import PasswordField from "@/components/ui/PasswordField";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { checkPasswordRules } from "@/lib/password";

export default function ResetPasswordForm({ initialEmail }: { initialEmail: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const rules = checkPasswordRules(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password, confirmPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Nao foi possivel redefinir a senha.");
        return;
      }

      setSuccess("Senha redefinida. Redirecionando para o login...");
      setTimeout(() => router.push("/login"), 1200);
    } catch {
      setError("Falha de conexao. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <Alert kind="error">{error}</Alert>}
      {success && <Alert kind="success">{success}</Alert>}

      <TextField
        label="E-mail"
        type="email"
        name="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <TextField
        label="Codigo recebido por e-mail"
        name="code"
        inputMode="numeric"
        maxLength={6}
        placeholder="000000"
        required
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
      />

      <div>
        <PasswordField
          label="Nova senha"
          name="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <ul className="mt-2 flex flex-col gap-1 text-xs text-ink-500">
          <li className={rules.minLength ? "text-success" : ""}>Pelo menos 6 caracteres</li>
          <li className={rules.hasUppercase ? "text-success" : ""}>Pelo menos 1 letra maiuscula</li>
          <li className={rules.hasNumber ? "text-success" : ""}>Pelo menos 1 numero</li>
        </ul>
      </div>

      <PasswordField
        label="Confirmar nova senha"
        name="confirmPassword"
        required
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <Button type="submit" loading={loading}>
        Redefinir senha
      </Button>
    </form>
  );
}
