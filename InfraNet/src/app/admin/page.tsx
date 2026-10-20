import { CableCategory, Role, TestResult } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, normalizeRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { switchPortCountSuggestions, switchTypeSuggestions } from "@/lib/catalogs";
import { bomPriceReferences } from "@/lib/bom-reference";
import BomItemForm from "./BomItemForm";
import ConfirmButton from "./ConfirmButton";
import {
  createBomItem,
  createCertification,
  createNetworkPoint,
  createPatchPanel,
  createRack,
  createSwitch,
  createUser,
  deleteBomItem,
  deleteCertification,
  deleteNetworkPoint,
  deletePatchPanel,
  deleteRack,
  deleteSwitch,
  deleteUser,
  resetUserPassword,
  updateBomItem,
  updateBomMargin,
  updateCertification,
  updateNetworkPoint,
  updatePatchPanel,
  updateRack,
  updateSwitch,
  updateUser,
} from "./actions";

const inputClass =
  "min-w-0 rounded-md border border-line bg-white px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
const buttonClass =
  "rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { section?: string; notice?: string; error?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [users, racks, switches, patchPanels, points, switchPorts, panelPorts, tests, bomItems, bomSettings] =
    await Promise.all([
      user.role === Role.ADMIN ? db.user.findMany({ orderBy: { createdAt: "asc" } }) : [],
      db.rack.findMany({ where: user.role === Role.ADMIN ? {} : { ownerId: user.id }, orderBy: { name: "asc" } }),
      db.switch.findMany({ where: user.role === Role.ADMIN ? {} : { ownerId: user.id }, include: { rack: true }, orderBy: { name: "asc" } }),
      db.patchPanel.findMany({ where: user.role === Role.ADMIN ? {} : { ownerId: user.id }, include: { rack: true }, orderBy: { name: "asc" } }),
      db.networkPoint.findMany({
        where: user.role === Role.ADMIN ? {} : { ownerId: user.id },
        include: {
          patchPanelPort: { include: { patchPanel: true } },
          switchPort: { include: { switch: true } },
        },
        orderBy: { code: "asc" },
      }),
      db.switchPort.findMany({ where: user.role === Role.ADMIN ? {} : { switch: { ownerId: user.id } }, include: { switch: true }, orderBy: { number: "asc" } }),
      db.patchPanelPort.findMany({ where: user.role === Role.ADMIN ? {} : { patchPanel: { ownerId: user.id } }, include: { patchPanel: true }, orderBy: { number: "asc" } }),
      db.certificationTest.findMany({
        where: user.role === Role.ADMIN ? {} : { networkPoint: { ownerId: user.id } },
        include: { networkPoint: true },
        orderBy: { performedAt: "desc" },
      }),
      db.bomItem.findMany({ where: user.role === Role.ADMIN ? {} : { ownerId: user.id }, orderBy: { name: "asc" } }),
      user.role === Role.ADMIN
        ? db.bomSettings.findFirst({ where: { OR: [{ userId: user.id }, { userId: null }] } })
        : db.bomSettings.findUnique({ where: { userId: user.id } }),
    ]);

  const availableSections = [
    ...(user.role === Role.ADMIN ? [{ id: "users", label: "Usuários" }] : []),
    { id: "racks", label: "Racks" },
    { id: "switches", label: "Switches" },
    { id: "patch-panels", label: "Patch panels" },
    { id: "network-points", label: "Pontos de rede" },
    { id: "certifications", label: "Certificações" },
    { id: "bom", label: "Materiais / BOM" },
  ];
  const defaultSection = user.role === Role.ADMIN ? "users" : "racks";
  const section = availableSections.some((item) => item.id === searchParams.section)
    ? searchParams.section!
    : defaultSection;
  const bomSubtotal = bomItems.reduce((sum, item) => sum + item.estimatedCost * item.quantity, 0);
  const bomMargin = bomSettings?.marginPercent ?? 0;
  const bomTotal = bomSubtotal * (1 + bomMargin / 100);

  return (
    <main className="min-h-screen bg-ink-100">
      <header className="flex items-center justify-between border-b border-line bg-white px-6 py-4">
        <a href="/dashboard" className="font-semibold text-ink-900">InfraNet</a>
        <div className="flex items-center gap-4">
          <Link href="/help" className="text-sm font-medium text-ink-700 hover:text-ink-900">Central de ajuda</Link>
          <a href="/dashboard" className="text-sm text-ink-500 hover:text-ink-900">Voltar ao painel</a>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-6 py-10">
        <datalist id="switch-model-suggestions">
          {switchTypeSuggestions.map((suggestion) => <option key={suggestion} value={suggestion} />)}
        </datalist>
        <datalist id="switch-port-count-suggestions">
          {switchPortCountSuggestions.map((suggestion) => <option key={suggestion} value={suggestion} />)}
        </datalist>
        <div>
          <p className="text-sm font-medium text-ink-500">
            {user.role === Role.ADMIN ? "Área administrativa" : "Sua infraestrutura"}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink-900">
            {user.role === Role.ADMIN ? "Gerenciar sistema" : "Gerenciar minha infraestrutura"}
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            {user.role === Role.ADMIN
              ? "Administre usuários e gerencie todas as infraestruturas cadastradas."
              : "Crie e gerencie seus equipamentos, pontos de rede, certificações e materiais."}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
          <nav aria-label="Seções de gerenciamento" className="flex gap-2 overflow-x-auto rounded-lg border border-line bg-white p-2 lg:sticky lg:top-6 lg:flex-col lg:overflow-visible">
            <p className="hidden px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-ink-500 lg:block">
              Gerenciamento
            </p>
            {availableSections.map((item) => (
              <Link
                key={item.id}
                href={`/admin?section=${item.id}`}
                aria-current={section === item.id ? "page" : undefined}
                className={`group flex shrink-0 items-center gap-3 rounded-md border-l-[3px] px-3 py-2.5 text-sm font-medium transition duration-200 hover:-translate-y-px ${
                  section === item.id
                      ? "border-brand-700 bg-brand-50 text-brand-800 shadow-sm ring-1 ring-inset ring-brand-200"
                      : "border-transparent text-ink-700 hover:bg-ink-100"
                }`}
              >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors ${
                    section === item.id
                      ? "bg-brand-700 text-white"
                      : "bg-ink-100 text-ink-500 group-hover:bg-white group-hover:text-ink-700"
                  }`}>
                    <SectionIcon name={item.id} />
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {section === item.id && <span aria-hidden="true" className="text-lg leading-none text-brand-700">›</span>}
              </Link>
            ))}
          </nav>

          <div key={section} className="admin-section-enter min-w-0 space-y-6">
            {searchParams.notice && (
              <p role="status" className="rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-900">
                {searchParams.notice}
              </p>
            )}
            {searchParams.error && (
              <p role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">
                {searchParams.error}
              </p>
            )}

        {section === "users" && user.role === Role.ADMIN && <Section title={`Usuários (${users.length})`} description="Crie contas e altere nome, e-mail e nível de acesso.">
          <form action={createUser} className="grid gap-3 rounded-md bg-ink-100 p-4 sm:grid-cols-2 lg:grid-cols-6">
            <Field name="firstName" label="Nome" required />
            <Field name="lastName" label="Sobrenome" />
            <Field name="email" label="E-mail" type="email" required />
            <Field name="password" label="Senha inicial" type="password" required />
            <RoleSelect />
            <button className={buttonClass}>Criar usuário</button>
          </form>
          <div className="mt-4 space-y-3">
            {users.map((account) => (
              <details key={account.id} className="rounded-md border border-line p-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                  <span>
                    <span className="block font-medium text-ink-900">{account.firstName} {account.lastName}</span>
                    <span className="text-sm text-ink-500">{account.email} · {roleLabel(normalizeRole(account.role))}</span>
                  </span>
                  <span className="text-sm font-medium text-ink-700">Editar <span aria-hidden="true">⌄</span></span>
                </summary>
                <div className="mt-4 space-y-3 border-t border-line pt-4">
                  <form action={updateUser} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                    <input type="hidden" name="id" value={account.id} />
                    <Field name="firstName" label="Nome" defaultValue={account.firstName} required />
                    <Field name="lastName" label="Sobrenome" defaultValue={account.lastName ?? ""} />
                    <Field name="email" label="E-mail" type="email" defaultValue={account.email} required />
                    <RoleSelect defaultValue={normalizeRole(account.role)} />
                    <button className={buttonClass}>Salvar usuário</button>
                  </form>
                  <div className="flex flex-wrap items-end gap-2">
                    <form action={resetUserPassword} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="id" value={account.id} />
                      <Field name="password" label="Definir nova senha" type="password" required />
                      <button className={buttonClass}>Alterar senha</button>
                    </form>
                    <form action={deleteUser}>
                      <input type="hidden" name="id" value={account.id} />
                      <ConfirmButton message={`Excluir a conta ${account.email}?`}>Excluir</ConfirmButton>
                    </form>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </Section>}

        {section === "racks" && <Section id="racks" title={`Racks (${racks.length})`} description="Cadastre locais e agrupe switches e patch panels.">
          <form action={createRack} className="grid gap-3 sm:grid-cols-3">
            <Field name="name" label="Nome do rack" required />
            <Field name="location" label="Localização" />
            <button className={buttonClass}>Adicionar rack</button>
          </form>
          <div className="mt-4 space-y-2">
            {racks.map((rack) => (
              <details key={rack.id} className="rounded-md border border-line p-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                  <span>
                    <span className="block font-medium text-ink-900">{rack.name}</span>
                    <span className="text-sm text-ink-500">{rack.location || "Localização não informada"}</span>
                  </span>
                  <span className="text-sm font-medium text-ink-700">Editar <span aria-hidden="true">⌄</span></span>
                </summary>
                <div className="mt-4 grid gap-2 border-t border-line pt-4 sm:grid-cols-[1fr_1fr_auto_auto]">
                  <form action={updateRack} className="contents">
                    <input type="hidden" name="id" value={rack.id} />
                    <Field name="name" label="Nome" defaultValue={rack.name} required />
                    <Field name="location" label="Localização" defaultValue={rack.location ?? ""} />
                    <button className={buttonClass}>Salvar</button>
                  </form>
                  <form action={deleteRack}>
                    <input type="hidden" name="id" value={rack.id} />
                    <ConfirmButton message={`Excluir o rack ${rack.name}?`}>Excluir</ConfirmButton>
                  </form>
                </div>
              </details>
            ))}
          </div>
        </Section>}

        {section === "switches" && <DeviceSection
          title={`Switches (${switches.length})`}
          id="switches"
          action={createSwitch}
          updateAction={updateSwitch}
          deleteAction={deleteSwitch}
          devices={switches}
          racks={racks}
          deleteMessage="Excluir switch"
        />}
        {section === "patch-panels" && <DeviceSection
          title={`Patch panels (${patchPanels.length})`}
          id="patch-panels"
          action={createPatchPanel}
          updateAction={updatePatchPanel}
          deleteAction={deletePatchPanel}
          devices={patchPanels}
          racks={racks}
          deleteMessage="Excluir patch panel"
          showModel={false}
        />}

        {section === "network-points" && <Section id="network-points" title={`Pontos de rede (${points.length})`} description="Gerencie identificador, categoria de cabo e portas vinculadas.">
          <form action={createNetworkPoint} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field name="code" label="Código" required />
            <Field name="location" label="Localização" required />
            <CableSelect />
            <PortSelect name="patchPanelPortId" label="Porta do patch panel" ports={panelPorts.map((port) => ({
              id: port.id, label: `${port.patchPanel.name} · porta ${port.number}`,
            }))} />
            <PortSelect name="switchPortId" label="Porta do switch" ports={switchPorts.map((port) => ({
              id: port.id, label: `${port.switch.name} · porta ${port.number}`,
            }))} />
            <button className={buttonClass}>Adicionar ponto</button>
          </form>
          <div className="mt-4 space-y-3">
            {points.map((point) => (
              <details key={point.id} className="rounded-md border border-line p-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                  <span>
                    <span className="block font-medium text-ink-900">{point.code}</span>
                    <span className="text-sm text-ink-500">{point.location} · {point.cableCategory.replace("_", " ")}</span>
                  </span>
                  <span className="text-sm font-medium text-ink-700">Editar <span aria-hidden="true">⌄</span></span>
                </summary>
                <div className="mt-4 grid gap-2 border-t border-line pt-4 lg:grid-cols-[1fr_auto]">
                  <form action={updateNetworkPoint} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                    <input type="hidden" name="id" value={point.id} />
                    <Field name="code" label="Código" defaultValue={point.code} required />
                    <Field name="location" label="Localização" defaultValue={point.location} required />
                    <CableSelect defaultValue={point.cableCategory} />
                    <PortSelect name="patchPanelPortId" label="Patch panel" defaultValue={point.patchPanelPortId ?? ""}
                      ports={panelPorts.map((port) => ({ id: port.id, label: `${port.patchPanel.name} · ${port.number}` }))} />
                    <PortSelect name="switchPortId" label="Switch" defaultValue={point.switchPortId ?? ""}
                      ports={switchPorts.map((port) => ({ id: port.id, label: `${port.switch.name} · ${port.number}` }))} />
                    <button className={buttonClass}>Salvar ponto</button>
                  </form>
                  <form action={deleteNetworkPoint} className="flex items-end">
                    <input type="hidden" name="id" value={point.id} />
                    <ConfirmButton message={`Excluir o ponto ${point.code} e suas certificações?`}>Excluir</ConfirmButton>
                  </form>
                </div>
              </details>
            ))}
          </div>
        </Section>}

        {section === "certifications" && <Section id="certifications" title={`Certificações (${tests.length})`} description="Registre e atualize os resultados dos testes por ponto de rede.">
          <form action={createCertification} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <PointSelect points={points} />
            <ResultSelect />
            <Field name="performedBy" label="Realizado por" />
            <Field name="notes" label="Observações" />
            <button className={buttonClass}>Registrar teste</button>
          </form>
          <div className="mt-4 space-y-3">
            {tests.map((test) => (
              <details key={test.id} className="rounded-md border border-line p-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                  <span>
                    <span className="block font-medium text-ink-900">{test.networkPoint.code} · {resultLabel(test.result)}</span>
                    <span className="text-sm text-ink-500">{test.performedAt.toLocaleDateString("pt-BR")} · {test.performedBy || "Responsável não informado"}</span>
                  </span>
                  <span className="text-sm font-medium text-ink-700">Editar <span aria-hidden="true">⌄</span></span>
                </summary>
                <div className="mt-4 grid gap-2 border-t border-line pt-4 lg:grid-cols-[1fr_auto]">
                  <form action={updateCertification} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <input type="hidden" name="id" value={test.id} />
                    <PointSelect points={points} defaultValue={test.networkPointId} />
                    <ResultSelect defaultValue={test.result} />
                    <Field name="performedBy" label="Realizado por" defaultValue={test.performedBy ?? ""} />
                    <Field name="notes" label="Observações" defaultValue={test.notes ?? ""} />
                    <button className={buttonClass}>Salvar teste</button>
                  </form>
                  <form action={deleteCertification} className="flex items-end">
                    <input type="hidden" name="id" value={test.id} />
                    <ConfirmButton message={`Excluir o teste do ponto ${test.networkPoint.code}?`}>Excluir</ConfirmButton>
                  </form>
                </div>
              </details>
            ))}
          </div>
        </Section>}

        {section === "bom" && <Section id="bom" title={`Materiais / BOM (${bomItems.length})`} description="Monte a lista do projeto e acompanhe quanto cada item representa no orçamento.">
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-line bg-ink-50 p-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-semibold text-ink-700 ring-1 ring-line">1</span>
              <p className="mt-3 text-sm font-semibold text-ink-900">Escolha o material</p>
              <p className="mt-1 text-xs leading-5 text-ink-500">Busque no catálogo ou informe um item próprio.</p>
            </div>
            <div className="rounded-md border border-line bg-ink-50 p-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-semibold text-ink-700 ring-1 ring-line">2</span>
              <p className="mt-3 text-sm font-semibold text-ink-900">Preencha quantidade e preço</p>
              <p className="mt-1 text-xs leading-5 text-ink-500">O preço é por unidade; use sua cotação atual.</p>
            </div>
            <div className="rounded-md border border-line bg-ink-50 p-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-semibold text-ink-700 ring-1 ring-line">3</span>
              <p className="mt-3 text-sm font-semibold text-ink-900">Confira o orçamento</p>
              <p className="mt-1 text-xs leading-5 text-ink-500">Subtotal = quantidade × preço; a margem soma uma reserva ao total.</p>
            </div>
          </div>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <article className="rounded-md bg-ink-100 p-4">
              <p className="text-sm text-ink-500">Itens cadastrados</p>
              <p className="mt-1 text-xl font-semibold text-ink-900">
                {bomItems.length}
              </p>
            </article>
            <article className="rounded-md bg-ink-100 p-4">
              <p className="text-sm text-ink-500">Subtotal (sem margem)</p>
              <p className="mt-1 text-xl font-semibold text-ink-900">
                {bomItems.length
                  ? bomSubtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                  : "Adicione materiais"}
              </p>
            </article>
            <article className="rounded-md bg-ink-100 p-4">
              <p className="text-sm text-ink-500">Total estimado com margem ({bomMargin}%)</p>
              <p className="mt-1 text-xl font-semibold text-ink-900">
                {bomItems.length
                  ? bomTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                  : "Adicione materiais"}
              </p>
            </article>
          </div>
          <form action={updateBomMargin} className="mb-4 flex flex-wrap items-end gap-3 rounded-md border border-line bg-ink-50 p-4">
            <Field
              name="marginPercent"
              label="Reserva adicional sobre o subtotal (%)"
              type="number"
              min="0"
              step="any"
              defaultValue={bomSettings?.marginPercent ?? 0}
              required
            />
            <button className={buttonClass}>Atualizar total</button>
          </form>
          <BomItemForm action={createBomItem} />
          <div className="mt-6 overflow-x-auto rounded-md border border-line">
            <div className="min-w-[600px]">
              <div className="border-b border-line bg-ink-100 p-4">
                <h3 className="font-semibold text-ink-900">Preços de referência no Brasil</h3>
                <p className="mt-1 text-sm text-ink-600">
                  Referências consultadas em 19/10/2026 em anúncios da KaBuM!, não uma média nacional.
                  Estoque, vendedor e frete podem alterar os valores; confira antes de fechar o orçamento.
                </p>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="text-ink-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Material</th>
                    <th className="px-4 py-2 font-medium">Referência por unidade</th>
                    <th className="px-4 py-2 font-medium">Fonte</th>
                  </tr>
                </thead>
                <tbody>
                  {bomPriceReferences.map((reference) => (
                    <tr key={reference.id} className="border-t border-line">
                      <td className="px-4 py-3 text-ink-900">{reference.name}</td>
                      <td className="px-4 py-3 text-ink-900">
                        {reference.estimatedCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} / {reference.unit}
                      </td>
                      <td className="px-4 py-3">
                        <a href={reference.sourceUrl} target="_blank" rel="noreferrer" className="font-medium text-brand-700 underline">
                          {reference.sourceLabel}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {bomItems.length > 0 ? (
            <div className="mt-6 overflow-x-auto rounded-lg border border-line">
              <div className="min-w-[720px]">
                <div className="grid grid-cols-[minmax(230px,2fr)_100px_130px_140px_110px] gap-3 bg-ink-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-500">
                  <span>Material</span><span>Quantidade</span><span>Preço unitário</span><span>Total do item</span><span className="text-right">Ação</span>
                </div>
                {bomItems.map((item) => (
                  <details key={item.id} className="group border-t border-line">
                    <summary className="grid cursor-pointer list-none grid-cols-[minmax(230px,2fr)_100px_130px_140px_110px] items-center gap-3 px-4 py-4 text-sm transition hover:bg-ink-50 [&::-webkit-details-marker]:hidden">
                      <span className="font-medium text-ink-900">{item.name}</span>
                      <span className="text-ink-600">{item.quantity} {item.unit}</span>
                      <span className="text-ink-600">{item.estimatedCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/{item.unit}</span>
                      <span className="font-semibold tabular-nums text-ink-900">{(item.quantity * item.estimatedCost).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                      <span className="text-right text-xs font-medium text-ink-600 group-open:text-ink-900">Editar <span aria-hidden="true">⌄</span></span>
                    </summary>
                    <div className="border-t border-line bg-ink-50 p-4">
                      <div className="grid gap-2 lg:grid-cols-[1fr_auto]">
                        <form action={updateBomItem} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                          <input type="hidden" name="id" value={item.id} />
                          <Field name="name" label="Material" defaultValue={item.name} required />
                          <Field name="unit" label="Unidade" defaultValue={item.unit} required />
                          <Field name="quantity" label="Quantidade" type="number" min="0.01" step="any" defaultValue={item.quantity} required />
                          <Field name="estimatedCost" label="Preço por unidade (R$)" type="number" min="0" step="any" defaultValue={item.estimatedCost} required />
                          <button className={buttonClass}>Salvar item</button>
                        </form>
                        <form action={deleteBomItem} className="flex items-end">
                          <input type="hidden" name="id" value={item.id} />
                          <ConfirmButton message={`Excluir o item ${item.name}?`}>Excluir</ConfirmButton>
                        </form>
                      </div>
                    </div>
                  </details>
                ))}
                <div className="grid grid-cols-[minmax(230px,2fr)_100px_130px_140px_110px] gap-3 border-t border-line bg-ink-50 px-4 py-3 text-sm font-semibold text-ink-900">
                  <span className="col-span-3 text-right">Subtotal</span><span className="tabular-nums">{bomSubtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span><span />
                </div>
                <div className="grid grid-cols-[minmax(230px,2fr)_100px_130px_140px_110px] gap-3 border-t border-line px-4 py-3 text-sm text-ink-600">
                  <span className="col-span-3 text-right">Reserva ({bomMargin}%)</span><span className="tabular-nums">{(bomTotal - bomSubtotal).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span><span />
                </div>
                <div className="grid grid-cols-[minmax(230px,2fr)_100px_130px_140px_110px] gap-3 border-t border-line bg-brand-50 px-4 py-4 text-sm font-semibold text-ink-900">
                  <span className="col-span-3 text-right">Total estimado</span><span className="tabular-nums">{bomTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span><span />
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-lg border border-dashed border-ink-300 px-5 py-8 text-center">
              <h3 className="font-semibold text-ink-900">Sua lista ainda está vazia</h3>
              <p className="mt-1 text-sm text-ink-500">Adicione o primeiro material acima para começar a estimar os custos do projeto.</p>
            </div>
          )}
        </Section>}
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({ id, title, description, children }: {
  id?: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 rounded-lg border border-line bg-white p-5 shadow-card sm:p-6">
      <h2 className="text-xl font-semibold tracking-tight text-ink-900">{title}</h2>
      <p className="mb-5 mt-1 max-w-3xl text-sm leading-6 text-ink-500">{description}</p>
      {children}
    </section>
  );
}

function SectionIcon({ name }: { name: string }) {
  const iconClass = "h-[18px] w-[18px]";

  return (
    <svg
      aria-hidden="true"
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === "users" && (
        <>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 19v-1.5a5.5 5.5 0 0 1 11 0V19" />
          <path d="M16 5.3a3 3 0 0 1 0 5.8M17 14a5 5 0 0 1 3.5 4.8V19" />
        </>
      )}
      {name === "racks" && (
        <>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M8 7h8M8 12h8M8 17h8" />
          <circle cx="7.2" cy="7" r=".3" fill="currentColor" />
          <circle cx="7.2" cy="12" r=".3" fill="currentColor" />
          <circle cx="7.2" cy="17" r=".3" fill="currentColor" />
        </>
      )}
      {name === "switches" && (
        <>
          <rect x="3" y="7" width="18" height="10" rx="2" />
          <path d="M7 11h.01M10 11h.01M13 11h.01M16 11h.01M8 14h8" />
        </>
      )}
      {name === "patch-panels" && (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M7 9h.01M10 9h.01M13 9h.01M16 9h.01M7 14h.01M10 14h.01M13 14h.01M16 14h.01" />
        </>
      )}
      {name === "network-points" && (
        <>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="2" />
          <path d="M12 4v6M20 12h-6M12 20v-6M4 12h6" />
        </>
      )}
      {name === "certifications" && (
        <>
          <path d="M12 3 19 6v5c0 4.5-3 7.5-7 10-4-2.5-7-5.5-7-10V6l7-3Z" />
          <path d="m9 12 2 2 4-4" />
        </>
      )}
      {name === "bom" && (
        <>
          <path d="M9 5h10M9 12h10M9 19h10" />
          <path d="m4 5 1 1 2-2M4 12l1 1 2-2M4 19l1 1 2-2" />
        </>
      )}
    </svg>
  );
}

function Field({
  name, label, suggestions, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  name: string;
  label: string;
  suggestions?: readonly string[];
}) {
  const listId = suggestions ? "switch-model-suggestions" : undefined;

  return (
    <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-ink-700">
      {label}
      <input name={name} list={listId} className={inputClass} {...props} />
    </label>
  );
}

function SelectField({
  name, label, defaultValue, children,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-ink-700">
      {label}
      <select name={name} defaultValue={defaultValue} className={inputClass}>{children}</select>
    </label>
  );
}

function RoleSelect({ defaultValue = "USER" }: { defaultValue?: "ADMIN" | "USER" }) {
  return (
    <SelectField name="role" label="Perfil" defaultValue={defaultValue}>
      <option value="ADMIN">Administrador</option>
      <option value="USER">Usuário</option>
    </SelectField>
  );
}

function roleLabel(role: "ADMIN" | "USER") {
  if (role === "ADMIN") return "Administrador";
  return "Usuário";
}

function resultLabel(result: TestResult) {
  if (result === TestResult.PASS) return "Aprovado";
  if (result === TestResult.FAIL) return "Reprovado";
  return "Pendente";
}

function CableSelect({ defaultValue = "CAT6" }: { defaultValue?: CableCategory }) {
  const labels: Record<CableCategory, string> = {
    CAT5E: "CAT5e — cobre",
    CAT6: "CAT6 — cobre",
    CAT6A: "CAT6A — cobre",
    FIBRA_OM3: "Fibra OM3 — multimodo",
    FIBRA_OM4: "Fibra OM4 — multimodo",
    FIBRA_OS2: "Fibra OS2 — monomodo",
  };

  return (
    <SelectField name="cableCategory" label="Categoria do cabo" defaultValue={defaultValue}>
      {Object.values(CableCategory).map((category) => <option key={category} value={category}>{labels[category]}</option>)}
    </SelectField>
  );
}

function ResultSelect({ defaultValue = "PENDENTE" }: { defaultValue?: TestResult }) {
  return (
    <SelectField name="result" label="Resultado" defaultValue={defaultValue}>
      <option value="PENDENTE">Pendente</option>
      <option value="PASS">Aprovado</option>
      <option value="FAIL">Reprovado</option>
    </SelectField>
  );
}

function PortSelect({ name, label, ports, defaultValue = "" }: {
  name: string;
  label: string;
  ports: { id: string; label: string }[];
  defaultValue?: string;
}) {
  return (
    <SelectField name={name} label={label} defaultValue={defaultValue}>
      <option value="">Sem vínculo</option>
      {ports.map((port) => <option key={port.id} value={port.id}>{port.label}</option>)}
    </SelectField>
  );
}

function PointSelect({ points, defaultValue }: {
  points: { id: string; code: string; location: string }[];
  defaultValue?: string;
}) {
  return (
    <SelectField name="networkPointId" label="Ponto de rede" defaultValue={defaultValue ?? points[0]?.id}>
      {points.map((point) => <option key={point.id} value={point.id}>{point.code} · {point.location}</option>)}
    </SelectField>
  );
}

function DeviceSection({
  id, title, action, updateAction, deleteAction, devices, racks, deleteMessage,
  showModel = true,
}: {
  id: string;
  title: string;
  action: (formData: FormData) => void;
  updateAction: (formData: FormData) => void;
  deleteAction: (formData: FormData) => void;
  devices: { id: string; name: string; model?: string | null; portCount: number; rackId: string | null }[];
  racks: { id: string; name: string }[];
  deleteMessage: string;
  showModel?: boolean;
}) {
  return (
    <Section id={id} title={title} description="Ajuste nome, modelo, capacidade de portas e rack associado.">
      <form action={action} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Field name="name" label="Nome" required />
        {showModel && <Field name="model" label="Tipo/modelo (ex.: Smart, L2, PoE)" suggestions={switchTypeSuggestions} />}
        <Field name="portCount" label="Quantidade de portas" type="number" min="1" max="512" suggestions={switchPortCountSuggestions} required />
        <RackSelect racks={racks} />
        <button className={buttonClass}>Adicionar</button>
      </form>
      <div className="mt-4 space-y-3">
        {devices.map((device) => (
          <details key={device.id} className="rounded-md border border-line p-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
              <span>
                <span className="block font-medium text-ink-900">{device.name}</span>
                <span className="text-sm text-ink-500">
                  {device.model ? `${device.model} · ` : ""}{device.portCount} portas
                </span>
              </span>
              <span className="text-sm font-medium text-ink-700">Editar <span aria-hidden="true">⌄</span></span>
            </summary>
            <div className="mt-4 grid gap-2 border-t border-line pt-4 lg:grid-cols-[1fr_auto]">
              <form action={updateAction} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                <input type="hidden" name="id" value={device.id} />
                <Field name="name" label="Nome" defaultValue={device.name} required />
                {showModel && <Field name="model" label="Tipo/modelo (ex.: Smart, L2, PoE)" defaultValue={device.model ?? ""} suggestions={switchTypeSuggestions} />}
                <Field name="portCount" label="Portas" type="number" min="1" max="512" defaultValue={device.portCount} suggestions={switchPortCountSuggestions} required />
                <RackSelect racks={racks} defaultValue={device.rackId ?? ""} />
                <button className={buttonClass}>Salvar</button>
              </form>
              <form action={deleteAction} className="flex items-end">
                <input type="hidden" name="id" value={device.id} />
                <ConfirmButton message={`${deleteMessage} ${device.name}?`}>Excluir</ConfirmButton>
              </form>
            </div>
          </details>
        ))}
      </div>
    </Section>
  );
}

function RackSelect({ racks, defaultValue = "" }: {
  racks: { id: string; name: string }[];
  defaultValue?: string;
}) {
  return (
    <SelectField name="rackId" label="Rack" defaultValue={defaultValue}>
      <option value="">Sem rack</option>
      {racks.map((rack) => <option key={rack.id} value={rack.id}>{rack.name}</option>)}
    </SelectField>
  );
}
