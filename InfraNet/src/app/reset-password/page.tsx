import AuthShell from "@/components/auth/AuthShell";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  return (
    <AuthShell title="Nova senha" subtitle="Informe o codigo recebido e a nova senha.">
      <ResetPasswordForm initialEmail={searchParams.email ?? ""} />
    </AuthShell>
  );
}
