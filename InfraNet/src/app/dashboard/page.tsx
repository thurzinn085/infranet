import { redirect } from "next/navigation";
import Link from "next/link";
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
        <details className="group relative">
          <summary
            aria-label="Abrir menu"
            className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-md text-2xl leading-none text-ink-700 hover:bg-ink-100 focus:outline-none focus:ring-2 focus:ring-ink-500 [&::-webkit-details-marker]:hidden"
          >
            ⋮
          </summary>
          <nav
            aria-label="Menu principal"
            className="absolute right-0 top-12 z-10 min-w-48 rounded-md border border-line bg-white p-1 shadow-lg"
          >
            {user.role === "ADMIN" && (
              <a
                href="/admin"
                className="block rounded px-3 py-2 text-sm text-ink-900 hover:bg-ink-100"
              >
                Administração
              </a>
            )}
            <form action={logout}>
              <button className="block w-full rounded px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-100">
                Sair
              </button>
            </form>
          </nav>
        </details>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
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
          <MetricCard label="Pontos de rede" value={networkPoints} href={user.role === "ADMIN" ? "/admin#network-points" : undefined} />
          <MetricCard label="Racks" value={racks} href={user.role === "ADMIN" ? "/admin#racks" : undefined} />
          <MetricCard label="Switches" value={switches} href={user.role === "ADMIN" ? "/admin#switches" : undefined} />
          <MetricCard label="Patch panels" value={patchPanels} href={user.role === "ADMIN" ? "/admin#patch-panels" : undefined} />
          <MetricCard label="Itens na BOM" value={bomItems} href={user.role === "ADMIN" ? "/admin#bom" : undefined} />
        </section>

        <section aria-labelledby="certifications-heading" className="mt-10">
          <div className="flex items-baseline justify-between">
            <h2 id="certifications-heading" className="text-lg font-semibold text-ink-900">
              Testes de certificação
            </h2>
            <p className="text-sm text-ink-500">{totalTests} no total</p>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <MetricCard label="Aprovados" value={passedTests} href={user.role === "ADMIN" ? "/admin#certifications" : undefined} />
            <MetricCard label="Pendentes" value={pendingTests} href={user.role === "ADMIN" ? "/admin#certifications" : undefined} />
            <MetricCard label="Reprovados" value={failedTests} href={user.role === "ADMIN" ? "/admin#certifications" : undefined} />
          </div>
        </section>
      </main>
    </div>
  );
}

function MetricCard({ label, value, href }: { label: string; value: number; href?: string }) {
  const card = (
    <article className="rounded-lg border border-line bg-white p-5 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-ink-500">{label}</p>
        {href && <span aria-hidden="true" className="text-ink-500">›</span>}
      </div>
      <p className="mt-2 text-3xl font-semibold text-ink-900">
        {value.toLocaleString("pt-BR")}
      </p>
      {href && <p className="mt-2 text-xs font-medium text-ink-500">Ver e gerenciar</p>}
    </article>
  );

  return href ? (
    <Link href={href} className="rounded-lg transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ink-500">
      {card}
    </Link>
  ) : card;
}
