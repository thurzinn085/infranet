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
        <Link href="/dashboard" className="text-sm font-medium text-ink-700 hover:text-ink-900">
          Voltar ao painel
        </Link>
      </header>
      <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
        <div>
          <p className="text-sm font-medium text-ink-500">Ajuda do InfraNet</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink-900">Central de ajuda</h1>
          <p className="mt-2 text-ink-600">
            Um guia rápido para cadastrar e organizar sua infraestrutura.
            {user.role === "ADMIN" && " Como administrador, você também pode gerenciar as contas de usuários."}
          </p>
        </div>

        {user.role === "ADMIN" && (
          <section className="rounded-lg border border-line bg-white p-5 shadow-card">
            <h2 className="text-lg font-semibold text-ink-900">Usuários</h2>
            <p className="mt-2 text-sm text-ink-600">
              Na seção Usuários, crie contas, altere dados e perfis, redefina senhas ou exclua contas.
              Não é possível remover o próprio perfil nem excluir o último administrador.
            </p>
          </section>
        )}

        {sections.map((section) => (
          <section key={section.id} className="rounded-lg border border-line bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-ink-900">{section.title}</h2>
                <p className="mt-2 text-sm leading-6 text-ink-600">{section.description}</p>
              </div>
              <Link
                href={`/admin?section=${section.id}`}
                className="shrink-0 rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-ink-900"
              >
                Abrir seção
              </Link>
            </div>
          </section>
        ))}

        <section className="rounded-lg border border-line bg-white p-5 shadow-card">
          <h2 className="text-lg font-semibold text-ink-900">Dashboard</h2>
          <p className="mt-2 text-sm leading-6 text-ink-600">
            O dashboard resume quantos itens existem na sua infraestrutura e oferece atalhos para cada seção.
            O perfil administrador vê os dados de todos; uma conta normal vê apenas os próprios dados.
          </p>
        </section>
      </div>
    </main>
  );
}
