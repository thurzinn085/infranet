import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <main className="auth-page flex min-h-[100svh] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-[28px] border border-[#2b2b2b] bg-[#101010] p-6 sm:p-8">
        <h1 className="mb-2 font-display text-3xl font-semibold text-white">Recuperar senha</h1>
        <p className="mb-6 text-sm leading-6 text-[#999]">
          A recuperação por código enviado por e-mail estará disponível em breve. Por enquanto, solicite ao administrador que redefina sua senha.
        </p>
        <Link href="/login" className="text-sm font-medium text-[#C8FF00] underline-offset-4 hover:underline">
          Voltar para o login
        </Link>
      </div>
    </main>
  );
}
