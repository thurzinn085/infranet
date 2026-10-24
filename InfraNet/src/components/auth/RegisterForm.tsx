"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TextField from "@/components/ui/TextField";
import PasswordField from "@/components/ui/PasswordField";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { checkPasswordRules } from "@/lib/password";

function RuleItem({ met, label }: { met: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-1.5 text-xs ${met ? "text-green-300" : "text-neutral-400"}`}>
      <span
        className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border text-[9px] ${
          met ? "border-success bg-success text-white" : "border-ink-300"
        }`}
      >
        {met ? "✓" : ""}
      </span>
      {label}
    </li>
  );
}

export default function RegisterForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [confirmSecurityAnswer, setConfirmSecurityAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rules = checkPasswordRules(password);
  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          confirmPassword,
          securityQuestion,
          securityAnswer,
          confirmSecurityAnswer,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Nao foi possivel criar a conta.");
        return;
      }

      router.push("/login");
    } catch {
      setError("Falha de conexao. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <Alert kind="error">{error}</Alert>}

      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Nome"
          name="firstName"
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <TextField
          label="Sobrenome"
          name="lastName"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>

      <TextField
        label="E-mail"
        type="email"
        name="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <div>
        <PasswordField
          label="Senha"
          name="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <ul className="mt-2 flex flex-col gap-1">
          <RuleItem met={rules.minLength} label="Pelo menos 6 caracteres" />
          <RuleItem met={rules.hasUppercase} label="Pelo menos 1 letra maiuscula" />
          <RuleItem met={rules.hasNumber} label="Pelo menos 1 numero" />
        </ul>
      </div>

      <PasswordField
        label="Confirmar senha"
        name="confirmPassword"
        autoComplete="new-password"
        required
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={!passwordsMatch ? "As senhas nao coincidem." : undefined}
      />

      <div className="flex flex-col gap-3 rounded-md border border-white/10 p-3">
        <p className="text-sm text-neutral-300">
          Use uma pergunta pessoal e uma resposta que outras pessoas nao consigam adivinhar.
          A resposta sera necessaria para recuperar sua senha; nao use algo que voce publique
          ou conte facilmente.
        </p>
        <TextField
          label="Pergunta de recuperacao"
          name="securityQuestion"
          required
          maxLength={200}
          value={securityQuestion}
          onChange={(e) => setSecurityQuestion(e.target.value)}
        />
        <TextField
          label="Resposta de recuperacao"
          name="securityAnswer"
          required
          maxLength={120}
          autoComplete="off"
          value={securityAnswer}
          onChange={(e) => setSecurityAnswer(e.target.value)}
        />
        <TextField
          label="Confirmar resposta de recuperacao"
          name="confirmSecurityAnswer"
          required
          maxLength={120}
          autoComplete="off"
          value={confirmSecurityAnswer}
          onChange={(e) => setConfirmSecurityAnswer(e.target.value)}
        />
      </div>

      <Button type="submit" loading={loading} className="mt-1">
        Criar conta
      </Button>

      <p className="text-center text-sm text-neutral-400">
        Ja tem uma conta?{" "}
        <Link href="/login" className="font-medium text-neutral-200 hover:text-white hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}