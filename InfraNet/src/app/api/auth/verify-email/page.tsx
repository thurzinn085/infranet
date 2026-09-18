import AuthShell from "@/components/auth/AuthShell";
import VerifyEmailForm from "@/components/auth/VerifyEmailForm";

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  return (
    <AuthShell
      title="Confirme seu e-mail"
      subtitle="Enviamos um codigo de 6 digitos para o seu e-mail."
    >
      <VerifyEmailForm initialEmail={searchParams.email ?? ""} />
    </AuthShell>
  );
}
