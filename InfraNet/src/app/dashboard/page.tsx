import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, destroyCurrentSession } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const owned = user.role === "ADMIN" ? {} : { ownerId: user.id };
  const ownedTests = user.role === "ADMIN" ? {} : { networkPoint: { ownerId: user.id } };
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
    db.networkPoint.count({ where: owned }),
    db.rack.count({ where: owned }),
    db.switch.count({ where: owned }),
    db.patchPanel.count({ where: owned }),
    db.certificationTest.count({ where: ownedTests }),
    db.certificationTest.count({ where: { ...ownedTests, result: "PASS" } }),
    db.certificationTest.count({ where: { ...ownedTests, result: "PENDENTE" } }),
    db.certificationTest.count({ where: { ...ownedTests, result: "FAIL" } }),
    db.bomItem.count({ where: owned }),
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
        <div className="flex items-center gap-2">
          <Link
            href="/help"
            aria-label="Central de ajuda"
            title="Central de ajuda"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-300 text-lg font-semibold text-ink-700 hover:bg-ink-100 focus:outline-none focus:ring-2 focus:ring-ink-500"
          >
            ?
          </Link>
          <form action={logout}>
            <button className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
              Sair
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="mt-1 text-2xl font-semibold text-ink-900">
              Olá, {user.firstName}.
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-ink-500">Resumo da infraestrutura de rede</p>
            <Link
              href="/admin"
              className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-ink-900"
            >
              {user.role === "ADMIN" ? "Administração" : "Minha infraestrutura"}
            </Link>
          </div>
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
          <MetricCard label="Pontos de rede" value={networkPoints} href="/admin?section=network-points" />
          <MetricCard label="Racks" value={racks} href="/admin?section=racks" />
          <MetricCard label="Switches" value={switches} href="/admin?section=switches" />
          <MetricCard label="Patch panels" value={patchPanels} href="/admin?section=patch-panels" />
          <MetricCard label="Itens na BOM" value={bomItems} href="/admin?section=bom" />
        </section>

        <section aria-labelledby="certifications-heading" className="mt-10">
          <div className="flex items-baseline justify-between">
            <h2 id="certifications-heading" className="text-lg font-semibold text-ink-900">
              Testes de certificação
            </h2>
            <p className="text-sm text-ink-500">{totalTests} no total</p>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <MetricCard label="Aprovados" value={passedTests} href="/admin?section=certifications" />
            <MetricCard label="Pendentes" value={pendingTests} href="/admin?section=certifications" />
            <MetricCard label="Reprovados" value={failedTests} href="/admin?section=certifications" />
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
