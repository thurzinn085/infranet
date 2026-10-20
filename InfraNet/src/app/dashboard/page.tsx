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
    <div className={`min-h-screen ${user.role === "ADMIN" ? "admin-console" : "bg-ink-100"}`}>
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <Link href="/dashboard" className="font-semibold tracking-tight text-ink-900">InfraNet</Link>
        <div className="flex items-center gap-2">
          {user.role === "ADMIN" && (
            <span className="mr-2 hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
              Admin
            </span>
          )}
          <Link
            href="/help"
            aria-label="Central de ajuda"
            title="Central de ajuda"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-300 text-lg font-semibold text-ink-700 transition hover:border-ink-500 hover:bg-ink-100 focus:outline-none focus:ring-2 focus:ring-ink-500"
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

      <main className="mx-auto max-w-6xl px-6 py-8 sm:py-10">
        <section className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
            <div>
              <p className="text-sm font-medium text-ink-500">
                {user.role === "ADMIN" ? (
                  <span className="font-mono uppercase tracking-[0.16em]">System overview · Admin</span>
                ) : "Visão geral · Minha infraestrutura"}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
                Olá, {user.firstName}.
              </h1>
              <p className="mt-2 text-sm text-ink-500">
                Aqui está o resumo da sua infraestrutura de rede.
              </p>
            </div>
            <Link
              href="/admin"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-500 focus:ring-offset-2"
            >
              {user.role === "ADMIN" ? "Abrir administração" : "Gerenciar infraestrutura"}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 border-t border-line bg-ink-50 sm:grid-cols-4">
            <SummaryStat label="Equipamentos" value={switches + patchPanels} />
            <SummaryStat label="Pontos de rede" value={networkPoints} />
            <SummaryStat label="Testes registrados" value={totalTests} />
            <SummaryStat label="Materiais na BOM" value={bomItems} />
          </div>
        </section>

        {!hasData && (
          <section className="mt-6 rounded-xl border border-dashed border-ink-300 bg-white p-6 sm:p-8">
            <p className="text-sm font-medium text-ink-500">Primeiro passo</p>
            <h2 className="mt-1 text-xl font-semibold text-ink-900">Comece organizando sua infraestrutura</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600">
              Cadastre um rack ou um ponto de rede. Depois, associe os equipamentos, registre os testes
              e monte a lista de materiais conforme o projeto evolui.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/admin?section=racks" className="rounded-md bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-900">
                Cadastrar primeiro rack
              </Link>
              <Link href="/admin?section=network-points" className="rounded-md border border-line px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-ink-100">
                Cadastrar ponto de rede
              </Link>
            </div>
          </section>
        )}

        <section aria-labelledby="inventory-heading" className="mt-9">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-ink-500">Acesso rápido</p>
              <h2 id="inventory-heading" className="mt-1 text-xl font-semibold text-ink-900">Sua infraestrutura</h2>
            </div>
            <Link href="/help" className="hidden text-sm font-medium text-ink-600 underline underline-offset-4 hover:text-ink-900 sm:block">
              Como usar o painel
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard label="Pontos de rede" value={networkPoints} href="/admin?section=network-points" detail="Identificação e conexões" />
            <MetricCard label="Racks" value={racks} href="/admin?section=racks" detail="Locais e organização" />
            <MetricCard label="Switches" value={switches} href="/admin?section=switches" detail="Portas e equipamentos" />
            <MetricCard label="Patch panels" value={patchPanels} href="/admin?section=patch-panels" detail="Painéis e portas" />
            <MetricCard label="Materiais / BOM" value={bomItems} href="/admin?section=bom" detail="Itens e estimativa de custo" />
            <Link href="/help" className="group flex min-h-32 flex-col justify-between rounded-lg border border-line bg-white p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ink-500 motion-reduce:transform-none">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-lg font-semibold text-ink-700">?</span>
              <span>
                <span className="block font-semibold text-ink-900">Central de ajuda</span>
                <span className="mt-1 block text-sm text-ink-500">Guias rápidos para cada seção</span>
              </span>
            </Link>
          </div>
        </section>

        <section aria-labelledby="certifications-heading" className="mt-9 rounded-xl border border-line bg-white p-5 shadow-card sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-ink-500">Qualidade da instalação</p>
              <h2 id="certifications-heading" className="mt-1 text-xl font-semibold text-ink-900">Testes de certificação</h2>
            </div>
            <Link href="/admin?section=certifications" className="text-sm font-medium text-ink-700 underline underline-offset-4 hover:text-ink-900">
              Ver certificações
            </Link>
          </div>
          <p className="mt-4 text-sm text-ink-500">{totalTests} testes registrados</p>
          <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-ink-100" aria-label={`${passedTests} aprovados, ${pendingTests} pendentes, ${failedTests} reprovados`}>
            {totalTests > 0 && (
              <>
                <div className="bg-emerald-600" style={{ width: `${(passedTests / totalTests) * 100}%` }} />
                <div className="bg-amber-500" style={{ width: `${(pendingTests / totalTests) * 100}%` }} />
                <div className="bg-red-500" style={{ width: `${(failedTests / totalTests) * 100}%` }} />
              </>
            )}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <TestStat label="Aprovados" value={passedTests} tone="text-emerald-700" />
            <TestStat label="Pendentes" value={pendingTests} tone="text-amber-700" />
            <TestStat label="Reprovados" value={failedTests} tone="text-red-700" />
          </div>
        </section>
      </main>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-r border-line px-5 py-4 last:border-r-0">
      <p className="text-xs font-medium text-ink-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-ink-900">{value.toLocaleString("pt-BR")}</p>
    </div>
  );
}

function MetricCard({ label, value, href, detail }: {
  label: string;
  value: number;
  href: string;
  detail: string;
}) {
  return (
    <Link href={href} className="group rounded-lg border border-line bg-white p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ink-500 motion-reduce:transform-none">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink-600">{label}</p>
          <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-ink-900">
            {value.toLocaleString("pt-BR")}
          </p>
        </div>
        <span aria-hidden="true" className="text-lg text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-ink-700">↗</span>
      </div>
      <p className="mt-3 border-t border-line pt-3 text-xs text-ink-500">{detail}</p>
    </Link>
  );
}

function TestStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-ink-50 px-4 py-3">
      <span className="text-sm text-ink-600">{label}</span>
      <span className={`text-lg font-semibold tabular-nums ${tone}`}>{value.toLocaleString("pt-BR")}</span>
    </div>
  );
}
