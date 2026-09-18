"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export default function VerifyEmailForm({ initialEmail }: { initialEmail: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Nao foi possivel confirmar o e-mail.");
        return;
      }

      setSuccess("E-mail confirmado. Redirecionando para o login...");
      setTimeout(() => router.push("/login"), 1200);
    } catch {
      setError("Falha de conexao. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError(null);
    setSuccess(null);
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setSuccess(data.message ?? "Codigo reenviado.");
    } catch {
      setError("Falha de conexao. Tente novamente.");
    } finally {
      setResending(false);
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
        label="Codigo de confirmacao"
        name="code"
        inputMode="numeric"
        maxLength={6}
        placeholder="000000"
        required
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
      />

      <Button type="submit" loading={loading}>
        Confirmar e-mail
      </Button>

      <button
        type="button"
        onClick={handleResend}
        disabled={resending}
        className="text-sm text-brand-600 hover:underline disabled:opacity-60"
      >
        {resending ? "Reenviando..." : "Reenviar codigo"}
      </button>
    </form>
  );
}
