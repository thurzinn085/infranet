import { redirect } from "next/navigation";
import { getCurrentUser, destroyCurrentSession } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [
    networkPoints,
    racks,
    switches,
    patchPanels,
    totalTests,
    passedTests,
    pendingTests,
    failedTests,
    bomItems,
  ] = await Promise.all([
    db.networkPoint.count(),
    db.rack.count(),
    db.switch.count(),
    db.patchPanel.count(),
    db.certificationTest.count(),
    db.certificationTest.count({ where: { result: "PASS" } }),
    db.certificationTest.count({ where: { result: "PENDENTE" } }),
    db.certificationTest.count({ where: { result: "FAIL" } }),
    db.bomItem.count(),
  ]);

  const hasData = networkPoints + racks + switches + patchPanels + totalTests + bomItems > 0;

  async function logout() {
    "use server";
    await destroyCurrentSession();
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-ink-100">
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <p className="font-semibold text-ink-900">InfraNet</p>
        <div className="flex items-center gap-4">
          {user.role === "ADMIN" && (
            <a href="/admin" className="text-sm font-medium text-ink-700 hover:text-ink-900">
              Administração
            </a>
          )}
          <form action={logout}>
            <button className="text-sm text-ink-500 hover:text-ink-900">Sair</button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-ink-500">
              {user.role === "ADMIN" ? "Administrador" : user.role === "TECNICO" ? "Técnico" : "Leitor"}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-ink-900">
              Olá, {user.firstName}.
            </h1>
          </div>
          <p className="text-sm text-ink-500">Resumo da infraestrutura de rede</p>
        </div>

        {!hasData && (
          <div className="mt-8 rounded-lg border border-line bg-white p-5 text-sm text-ink-700 shadow-card">
            <h2 className="font-semibold text-ink-900">Seu painel está pronto</h2>
            <p className="mt-1">
              Ainda não há dados de infraestrutura cadastrados. Quando houver pontos de rede,
              equipamentos, certificações ou itens da BOM, os totais aparecerão aqui.
            </p>
          </div>
        )}

        <section aria-label="Inventário" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard label="Pontos de rede" value={networkPoints} />
          <MetricCard label="Racks" value={racks} />
          <MetricCard label="Switches" value={switches} />
          <MetricCard label="Patch panels" value={patchPanels} />
          <MetricCard label="Itens na BOM" value={bomItems} />
        </section>

        <section aria-labelledby="certifications-heading" className="mt-10">
          <div className="flex items-baseline justify-between">
            <h2 id="certifications-heading" className="text-lg font-semibold text-ink-900">
              Testes de certificação
            </h2>
            <p className="text-sm text-ink-500">{totalTests} no total</p>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <MetricCard label="Aprovados" value={passedTests} />
            <MetricCard label="Pendentes" value={pendingTests} />
            <MetricCard label="Reprovados" value={failedTests} />
          </div>
        </section>
      </main>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-lg border border-line bg-white p-5 shadow-card">
      <p className="text-sm text-ink-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-ink-900">
        {value.toLocaleString("pt-BR")}
      </p>
    </article>
  );
}
