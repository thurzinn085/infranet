import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthShell title="Entrar" subtitle="Acesse o gerenciamento da infraestrutura de rede.">
      <LoginForm />
    </AuthShell>
  );
}
