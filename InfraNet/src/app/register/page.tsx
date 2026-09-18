import AuthShell from "@/components/auth/AuthShell";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <AuthShell title="Criar conta" subtitle="Leva menos de um minuto.">
      <RegisterForm />
    </AuthShell>
  );
}
