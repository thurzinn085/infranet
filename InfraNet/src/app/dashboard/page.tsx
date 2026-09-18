import { redirect } from "next/navigation";
import { getCurrentUser, destroyCurrentSession } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  async function logout() {
    "use server";
    await destroyCurrentSession();
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-white">
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <p className="font-semibold text-ink-900">InfraNet</p>
        <form action={logout}>
          <button className="text-sm text-ink-500 hover:text-ink-900">Sair</button>
        </form>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-xl font-semibold text-ink-900">Ola, {user.firstName}.</h1>
        <p className="mt-1 text-sm text-ink-500">
          Perfil: {user.role === "ADMIN" ? "Administrador" : user.role === "TECNICO" ? "Tecnico" : "Leitor"}
        </p>

        <div className="mt-8 rounded-lg border border-dashed border-line p-6 text-sm text-ink-500">
          O inventario de rede, o dashboard de metricas, a geracao de etiquetas,
          os testes de certificacao e a BOM ainda serao implementados aqui
          (Prioridades 2 a 5 da especificacao). O login, a confirmacao de
          e-mail, a recuperacao de senha e o controle de sessao ja estao
          funcionais.
        </div>
      </div>
    </main>
  );
}
