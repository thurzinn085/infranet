import AuthShell from "@/components/auth/AuthShell";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Recuperar senha" subtitle="Informe o e-mail da sua conta.">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
