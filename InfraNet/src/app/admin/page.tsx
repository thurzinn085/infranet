import { CableCategory, Role, TestResult } from "@prisma/client";
import { redirect } from "next/navigation";
import { getCurrentUser, normalizeRole } from "@/lib/auth";
import { db } from "@/lib/db";
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
  "min-w-0 rounded-md border border-line bg-white px-3 py-2 text-sm text-ink-900";
const buttonClass =
  "rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-ink-900";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { notice?: string; error?: string };
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

  return (
    <main className="min-h-screen bg-ink-100">
      <header className="flex items-center justify-between border-b border-line bg-white px-6 py-4">
        <a href="/dashboard" className="font-semibold text-ink-900">InfraNet</a>
        <a href="/dashboard" className="text-sm text-ink-500 hover:text-ink-900">Voltar ao painel</a>
      </header>

      <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <div>
          <p className="text-sm font-medium text-ink-500">
            {user.role === Role.ADMIN ? "Área administrativa" : "Sua infraestrutura"}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-ink-900">
            {user.role === Role.ADMIN ? "Gerenciar sistema" : "Gerenciar minha infraestrutura"}
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            {user.role === Role.ADMIN
              ? "Administre usuários e gerencie todas as infraestruturas cadastradas."
              : "Crie e gerencie seus equipamentos, pontos de rede, certificações e materiais."}
          </p>
        </div>

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

        {user.role === Role.ADMIN && <Section title={`Usuários (${users.length})`} description="Crie contas e altere nome, e-mail e nível de acesso.">
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

        <Section id="racks" title={`Racks (${racks.length})`} description="Cadastre locais e agrupe switches e patch panels.">
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
        </Section>

        <DeviceSection
          title={`Switches (${switches.length})`}
          id="switches"
          action={createSwitch}
          updateAction={updateSwitch}
          deleteAction={deleteSwitch}
          devices={switches}
          racks={racks}
          deleteMessage="Excluir switch"
        />
        <DeviceSection
          title={`Patch panels (${patchPanels.length})`}
          id="patch-panels"
          action={createPatchPanel}
          updateAction={updatePatchPanel}
          deleteAction={deletePatchPanel}
          devices={patchPanels}
          racks={racks}
          deleteMessage="Excluir patch panel"
          showModel={false}
        />

        <Section id="network-points" title={`Pontos de rede (${points.length})`} description="Gerencie identificador, categoria de cabo e portas vinculadas.">
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
        </Section>

        <Section id="certifications" title={`Certificações (${tests.length})`} description="Registre e atualize os resultados dos testes por ponto de rede.">
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
        </Section>

        <Section id="bom" title={`Materiais / BOM (${bomItems.length})`} description="Gerencie lista de materiais, unidades, quantidades e custos estimados.">
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <article className="rounded-md bg-ink-100 p-4">
              <p className="text-sm text-ink-500">Média do custo unitário</p>
              <p className="mt-1 text-xl font-semibold text-ink-900">
                {(bomItems.length
                  ? bomItems.reduce((sum, item) => sum + item.estimatedCost, 0) / bomItems.length
                  : 0
                ).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
            </article>
            <article className="rounded-md bg-ink-100 p-4">
              <p className="text-sm text-ink-500">Custo total estimado</p>
              <p className="mt-1 text-xl font-semibold text-ink-900">
                {bomItems.reduce((sum, item) => sum + item.estimatedCost * item.quantity, 0)
                  .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
            </article>
          </div>
          <form action={updateBomMargin} className="mb-4 flex flex-wrap items-end gap-3 rounded-md bg-ink-100 p-4">
            <Field
              name="marginPercent"
              label="Margem de custo (%)"
              type="number"
              min="0"
              step="any"
              defaultValue={bomSettings?.marginPercent ?? 0}
              required
            />
            <button className={buttonClass}>Salvar margem</button>
          </form>
          <form action={createBomItem} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Field name="name" label="Material" required />
            <Field name="unit" label="Unidade" required />
            <Field name="quantity" label="Quantidade" type="number" min="0.01" step="any" required />
            <Field name="estimatedCost" label="Custo estimado" type="number" min="0" step="any" required />
            <button className={buttonClass}>Adicionar item</button>
          </form>
          <div className="mt-4 space-y-3">
            {bomItems.map((item) => (
              <details key={item.id} className="rounded-md border border-line p-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                  <span>
                    <span className="block font-medium text-ink-900">{item.name}</span>
                    <span className="text-sm text-ink-500">{item.quantity} {item.unit} · {item.estimatedCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                  </span>
                  <span className="text-sm font-medium text-ink-700">Editar <span aria-hidden="true">⌄</span></span>
                </summary>
                <div className="mt-4 grid gap-2 border-t border-line pt-4 lg:grid-cols-[1fr_auto]">
                  <form action={updateBomItem} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <input type="hidden" name="id" value={item.id} />
                    <Field name="name" label="Material" defaultValue={item.name} required />
                    <Field name="unit" label="Unidade" defaultValue={item.unit} required />
                    <Field name="quantity" label="Quantidade" type="number" min="0.01" step="any" defaultValue={item.quantity} required />
                    <Field name="estimatedCost" label="Custo estimado" type="number" min="0" step="any" defaultValue={item.estimatedCost} required />
                    <button className={buttonClass}>Salvar item</button>
                  </form>
                  <form action={deleteBomItem} className="flex items-end">
                    <input type="hidden" name="id" value={item.id} />
                    <ConfirmButton message={`Excluir o item ${item.name}?`}>Excluir</ConfirmButton>
                  </form>
                </div>
              </details>
            ))}
          </div>
        </Section>
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
    <section id={id} className="scroll-mt-6 rounded-lg border border-line bg-white p-5 shadow-card">
      <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
      <p className="mb-4 mt-1 text-sm text-ink-500">{description}</p>
      {children}
    </section>
  );
}

function Field({
  name, label, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { name: string; label: string }) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-ink-700">
      {label}
      <input name={name} className={inputClass} {...props} />
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
  return (
    <SelectField name="cableCategory" label="Categoria do cabo" defaultValue={defaultValue}>
      {Object.values(CableCategory).map((category) => <option key={category} value={category}>{category.replace("_", " ")}</option>)}
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
        {showModel && <Field name="model" label="Modelo" />}
        <Field name="portCount" label="Quantidade de portas" type="number" min="1" max="512" required />
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
                {showModel && <Field name="model" label="Modelo" defaultValue={device.model ?? ""} />}
                <Field name="portCount" label="Portas" type="number" min="1" max="512" defaultValue={device.portCount} required />
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
