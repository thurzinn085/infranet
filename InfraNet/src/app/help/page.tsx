import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

const sections = [
  {
    id: "racks",
    title: "Racks",
    description: "Cadastre um rack para organizar os equipamentos por local. Informe um nome e, se quiser, onde ele fica. Depois, associe switches e patch panels a esse rack.",
  },
  {
    id: "switches",
    title: "Switches",
    description: "Cadastre o nome, o tipo (Smart, gerenciável, PoE etc.), a quantidade de portas e o rack. As portas são criadas automaticamente; escolha um número que corresponda ao equipamento.",
  },
  {
    id: "patch-panels",
    title: "Patch panels",
    description: "Informe um nome, a quantidade de portas e o rack. O sistema cria as portas para que você possa associá-las aos pontos de rede.",
  },
  {
    id: "network-points",
    title: "Pontos de rede",
    description: "Cada ponto precisa de um código único na sua infraestrutura, localização e categoria de cabo. Se souber a ligação física, associe uma porta de switch e/ou patch panel.",
  },
  {
    id: "certifications",
    title: "Certificações",
    description: "Registre o resultado do teste de um ponto de rede. Você pode informar quem realizou e adicionar observações; depois, edite ou exclua o registro.",
  },
  {
    id: "bom",
    title: "Materiais / BOM",
    description: "BOM é a lista de materiais do projeto. Escolha um item do catálogo ou digite outro, informe a quantidade e o custo por unidade. O subtotal soma quantidade × custo unitário; a margem é aplicada ao subtotal para mostrar o total estimado.",
  },
] as const;

export default async function HelpPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="min-h-screen bg-ink-100">
      <header className="flex items-center justify-between border-b border-line bg-white px-6 py-4">
        <Link href="/dashboard" className="font-semibold text-ink-900">InfraNet</Link>
        <Link href="/dashboard" className="rounded-md px-3 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-100 hover:text-ink-900">
          Voltar ao painel
        </Link>
      </header>
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-8 sm:py-10">
        <section className="rounded-xl border border-line bg-white p-6 shadow-card sm:p-8">
          <p className="text-sm font-medium text-ink-500">Ajuda do InfraNet</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">Central de ajuda</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-600">
            Guias diretos para cadastrar seus equipamentos, organizar os pontos de rede e estimar materiais.
            {user.role === "ADMIN" && " Administradores também podem gerenciar as contas de usuários."}
          </p>
          <div className="mt-6 grid gap-3 border-t border-line pt-5 sm:grid-cols-3">
            <HelpStep number="01" title="Cadastre a estrutura" text="Comece pelos racks e equipamentos." />
            <HelpStep number="02" title="Ligue os pontos" text="Associe cabos, portas e locais." />
            <HelpStep number="03" title="Acompanhe o projeto" text="Registre testes e monte a BOM." />
          </div>
        </section>

        {user.role === "ADMIN" && (
          <section id="users" className="rounded-lg border border-line bg-white p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-md motion-reduce:transform-none">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Acesso administrativo</p>
                <h2 className="mt-1 text-lg font-semibold text-ink-900">Usuários</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600">
                  Crie contas, altere dados e perfis, redefina senhas ou exclua contas.
                  Não é possível remover o próprio perfil nem excluir o último administrador.
                </p>
              </div>
              <Link href="/admin?section=users" className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-800">
                Gerenciar usuários
              </Link>
            </div>
          </section>
        )}

        <div>
          <div className="mb-4">
            <p className="text-sm font-medium text-ink-500">Guia por seção</p>
            <h2 className="mt-1 text-xl font-semibold text-ink-900">O que você pode fazer</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {sections.map((section, index) => (
              <section key={section.id} id={section.id} className="flex flex-col rounded-lg border border-line bg-white p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-md motion-reduce:transform-none">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-lg font-semibold text-ink-900">{section.title}</h3>
                </div>
                <p className="mt-3 flex-1 text-sm leading-6 text-ink-600">{section.description}</p>
                <Link
                  href={`/admin?section=${section.id}`}
                  className="mt-5 inline-flex w-fit items-center gap-2 text-sm font-semibold text-brand-700 transition hover:text-brand-800"
                >
                  Abrir seção <span aria-hidden="true">→</span>
                </Link>
              </section>
            ))}
          </div>
        </div>

        <section className="rounded-lg border border-line bg-ink-900 p-5 text-white sm:p-6">
          <h2 className="text-lg font-semibold">Dashboard</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-300">
            O painel reúne os principais totais e atalhos para as seções. Administradores veem os dados de todos;
            contas normais veem apenas os próprios dados.
          </p>
        </section>
      </div>
    </main>
  );
}

function HelpStep({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="pt-0.5 text-xs font-semibold tabular-nums text-brand-700">{number}</span>
      <div>
        <p className="text-sm font-semibold text-ink-900">{title}</p>
        <p className="mt-1 text-xs leading-5 text-ink-500">{text}</p>
      </div>
    </div>
  );
}
