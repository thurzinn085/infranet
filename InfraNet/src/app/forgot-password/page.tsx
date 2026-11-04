import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <main className="auth-page flex min-h-[100svh] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-[28px] border border-[#2b2b2b] bg-[#101010] p-6 sm:p-8">
        <h1 className="mb-2 font-display text-3xl font-semibold text-white">Recuperar senha</h1>
        <p className="mb-6 text-sm text-[#999]">Informe o e-mail da sua conta.</p>
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
