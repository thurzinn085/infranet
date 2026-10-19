"use server";

import { CableCategory, Prisma, Role, TestResult } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword, isPasswordValid } from "@/lib/password";

const idSchema = z.string().trim().min(1);
const nameSchema = z.string().trim().min(1).max(120);
const optionalText = z.string().trim().max(500).transform((value) => value || null);
const optionalId = z.string().trim().transform((value) => value || null);
const portCountSchema = z.coerce.number().int().min(1).max(512);

const adminSections = new Set([
  "users",
  "racks",
  "switches",
  "patch-panels",
  "network-points",
  "certifications",
  "bom",
]);

function currentAdminSection() {
  const referer = headers().get("referer");
  const requestedSection = referer ? new URL(referer).searchParams.get("section") : null;
  return requestedSection && adminSections.has(requestedSection) ? requestedSection : "racks";
}

function report(kind: "notice" | "error", message: string): never {
  redirect(`/admin?section=${currentAdminSection()}&${kind}=${encodeURIComponent(message)}`);
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

function ownerScope(user: Awaited<ReturnType<typeof requireUser>>) {
  return user.role === "ADMIN" ? {} : { ownerId: user.id };
}

async function ensureRackAccess(user: Awaited<ReturnType<typeof requireUser>>, rackId: string | null) {
  if (rackId && !await db.rack.findFirst({ where: { id: rackId, ...ownerScope(user) }, select: { id: true } })) {
    report("error", "Rack não encontrado na sua infraestrutura.");
  }
}

async function ensurePortAccess(
  user: Awaited<ReturnType<typeof requireUser>>,
  portId: string | null,
  kind: "switch" | "patchPanel"
) {
  if (!portId) return;
  const port = kind === "switch"
    ? await db.switchPort.findFirst({ where: { id: portId, switch: ownerScope(user) }, select: { id: true } })
    : await db.patchPanelPort.findFirst({ where: { id: portId, patchPanel: ownerScope(user) }, select: { id: true } });
  if (!port) report("error", "Porta não encontrada na sua infraestrutura.");
}

function refreshAdmin(message: string) {
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  report("notice", message);
}

async function updateSwitchPortRows(tx: Prisma.TransactionClient, switchId: string, portCount: number) {
  const occupiedPort = await tx.switchPort.findFirst({
    where: { switchId, number: { gt: portCount }, networkPoint: { isNot: null } },
    select: { number: true },
  });
  if (occupiedPort) return occupiedPort.number;

  await tx.switchPort.deleteMany({ where: { switchId, number: { gt: portCount } } });
  await tx.switchPort.createMany({
    data: Array.from({ length: portCount }, (_, index) => ({ switchId, number: index + 1 })),
    skipDuplicates: true,
  });
  return null;
}

async function updatePatchPanelPortRows(
  tx: Prisma.TransactionClient,
  patchPanelId: string,
  portCount: number
) {
  const occupiedPort = await tx.patchPanelPort.findFirst({
    where: { patchPanelId, number: { gt: portCount }, networkPoint: { isNot: null } },
    select: { number: true },
  });
  if (occupiedPort) return occupiedPort.number;

  await tx.patchPanelPort.deleteMany({ where: { patchPanelId, number: { gt: portCount } } });
  await tx.patchPanelPort.createMany({
    data: Array.from({ length: portCount }, (_, index) => ({ patchPanelId, number: index + 1 })),
    skipDuplicates: true,
  });
  return null;
}

const userFields = z.object({
  firstName: nameSchema,
  lastName: z.string().trim().max(120).transform((value) => value || null),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  role: z.enum(["ADMIN", "USER"]),
});

export async function createUser(formData: FormData) {
  await requireAdmin();
  const parsed = userFields.extend({
    password: z.string().refine(isPasswordValid, "Use 6 caracteres, uma letra maiúscula e um número."),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", parsed.error.issues[0]?.message ?? "Dados inválidos.");

  const { firstName, lastName, email, role, password } = parsed.data;
  if (await db.user.findUnique({ where: { email }, select: { id: true } })) {
    report("error", "Já existe uma conta cadastrada com este e-mail.");
  }
  const passwordHash = await hashPassword(password);
  await db.user.create({
    data: { firstName, lastName, email, role: role === "ADMIN" ? Role.ADMIN : Role.LEITOR, passwordHash },
  });
  refreshAdmin("Usuário criado.");
}

export async function updateUser(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = userFields.extend({ id: idSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", parsed.error.issues[0]?.message ?? "Dados inválidos.");
  const { id, firstName, lastName, email, role } = parsed.data;
  if (await db.user.findFirst({ where: { email, id: { not: id } }, select: { id: true } })) {
    report("error", "Outro usuário já está usando este e-mail.");
  }

  const error = await db.$transaction(async (tx) => {
    const target = await tx.user.findUnique({ where: { id }, select: { role: true } });
    if (!target) return "Usuário não encontrado.";
    if (id === admin.id && role !== Role.ADMIN) {
      return "Não é possível remover seu próprio perfil de administrador.";
    }
    if (target.role === Role.ADMIN && role !== Role.ADMIN) {
      const admins = await tx.user.count({ where: { role: Role.ADMIN } });
      if (admins <= 1) return "Não é possível remover o último administrador.";
    }
    await tx.user.update({
      where: { id },
      data: { firstName, lastName, email, role: role === "ADMIN" ? Role.ADMIN : Role.LEITOR },
    });
    return null;
  }, { isolationLevel: "Serializable" });
  if (error) report("error", error);
  refreshAdmin("Usuário atualizado.");
}

export async function deleteUser(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = z.object({ id: idSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Usuário inválido.");
  if (parsed.data.id === admin.id) report("error", "Você não pode excluir sua própria conta.");

  const error = await db.$transaction(async (tx) => {
    const target = await tx.user.findUnique({ where: { id: parsed.data.id }, select: { role: true } });
    if (!target) return "Usuário não encontrado.";
    if (target.role === Role.ADMIN && await tx.user.count({ where: { role: Role.ADMIN } }) <= 1) {
      return "Não é possível excluir o último administrador.";
    }
    await tx.user.delete({ where: { id: parsed.data.id } });
    return null;
  }, { isolationLevel: "Serializable" });
  if (error) report("error", error);
  refreshAdmin("Usuário excluído.");
}

export async function resetUserPassword(formData: FormData) {
  await requireAdmin();
  const parsed = z.object({
    id: idSchema,
    password: z.string().refine(isPasswordValid, "Use 6 caracteres, uma letra maiúscula e um número."),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", parsed.error.issues[0]?.message ?? "Senha inválida.");

  const passwordHash = await hashPassword(parsed.data.password);
  await db.$transaction([
    db.user.update({ where: { id: parsed.data.id }, data: { passwordHash } }),
    db.session.updateMany({
      where: { userId: parsed.data.id, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
  refreshAdmin("Senha alterada; sessões antigas do usuário foram encerradas.");
}

const rackFields = z.object({ name: nameSchema, location: optionalText });
export async function createRack(formData: FormData) {
  const user = await requireUser();
  const parsed = rackFields.safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Informe um nome válido para o rack.");
  await db.rack.create({ data: { ...parsed.data, ownerId: user.id } });
  refreshAdmin("Rack criado.");
}
export async function updateRack(formData: FormData) {
  const user = await requireUser();
  const parsed = rackFields.extend({ id: idSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Dados do rack inválidos.");
  if (!await db.rack.findFirst({ where: { id: parsed.data.id, ...ownerScope(user) }, select: { id: true } })) {
    report("error", "Rack não encontrado na sua infraestrutura.");
  }
  await db.rack.update({ where: { id: parsed.data.id }, data: { name: parsed.data.name, location: parsed.data.location } });
  refreshAdmin("Rack atualizado.");
}
export async function deleteRack(formData: FormData) {
  const user = await requireUser();
  const parsed = z.object({ id: idSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Rack inválido.");
  if (!await db.rack.findFirst({ where: { id: parsed.data.id, ...ownerScope(user) }, select: { id: true } })) {
    report("error", "Rack não encontrado na sua infraestrutura.");
  }
  const [switches, panels] = await Promise.all([
    db.switch.count({ where: { rackId: parsed.data.id } }),
    db.patchPanel.count({ where: { rackId: parsed.data.id } }),
  ]);
  if (switches + panels > 0) report("error", "Mova ou exclua os equipamentos deste rack antes de removê-lo.");
  await db.rack.delete({ where: { id: parsed.data.id } });
  refreshAdmin("Rack excluído.");
}

const deviceFields = z.object({
  name: nameSchema,
  model: optionalText,
  portCount: portCountSchema,
  rackId: optionalId,
});
const patchPanelFields = z.object({
  name: nameSchema,
  portCount: portCountSchema,
  rackId: optionalId,
});
export async function createSwitch(formData: FormData) {
  const user = await requireUser();
  const parsed = deviceFields.safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Confira os dados e o número de portas do switch.");
  await ensureRackAccess(user, parsed.data.rackId);
  await db.$transaction(async (tx) => {
    const device = await tx.switch.create({ data: { ...parsed.data, ownerId: user.id } });
    await tx.switchPort.createMany({
      data: Array.from({ length: parsed.data.portCount }, (_, index) => ({ switchId: device.id, number: index + 1 })),
    });
  });
  refreshAdmin("Switch criado com suas portas.");
}
export async function updateSwitch(formData: FormData) {
  const user = await requireUser();
  const parsed = deviceFields.extend({ id: idSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Confira os dados e o número de portas do switch.");
  const { id, ...data } = parsed.data;
  if (!await db.switch.findFirst({ where: { id, ...ownerScope(user) }, select: { id: true } })) {
    report("error", "Switch não encontrado na sua infraestrutura.");
  }
  await ensureRackAccess(user, data.rackId);
  const occupiedPort = await db.$transaction(async (tx) => {
    const blockedPort = await updateSwitchPortRows(tx, id, data.portCount);
    if (blockedPort) return blockedPort;
    await tx.switch.update({ where: { id }, data });
    return null;
  });
  if (occupiedPort) report("error", `A porta ${occupiedPort} está vinculada a um ponto de rede.`);
  refreshAdmin("Switch atualizado.");
}
export async function deleteSwitch(formData: FormData) {
  const user = await requireUser();
  const parsed = z.object({ id: idSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Switch inválido.");
  if (!await db.switch.findFirst({ where: { id: parsed.data.id, ...ownerScope(user) }, select: { id: true } })) {
    report("error", "Switch não encontrado na sua infraestrutura.");
  }
  const occupied = await db.switchPort.findFirst({
    where: { switchId: parsed.data.id, networkPoint: { isNot: null } },
    select: { number: true },
  });
  if (occupied) report("error", `Desvincule o ponto conectado à porta ${occupied.number} antes de excluir o switch.`);
  await db.switch.delete({ where: { id: parsed.data.id } });
  refreshAdmin("Switch excluído.");
}

export async function createPatchPanel(formData: FormData) {
  const user = await requireUser();
  const parsed = patchPanelFields.safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Confira os dados e o número de portas do patch panel.");
  await ensureRackAccess(user, parsed.data.rackId);
  await db.$transaction(async (tx) => {
    const panel = await tx.patchPanel.create({ data: { ...parsed.data, ownerId: user.id } });
    await tx.patchPanelPort.createMany({
      data: Array.from({ length: parsed.data.portCount }, (_, index) => ({ patchPanelId: panel.id, number: index + 1 })),
    });
  });
  refreshAdmin("Patch panel criado com suas portas.");
}
export async function updatePatchPanel(formData: FormData) {
  const user = await requireUser();
  const parsed = patchPanelFields.extend({ id: idSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Confira os dados e o número de portas do patch panel.");
  const { id, ...data } = parsed.data;
  if (!await db.patchPanel.findFirst({ where: { id, ...ownerScope(user) }, select: { id: true } })) {
    report("error", "Patch panel não encontrado na sua infraestrutura.");
  }
  await ensureRackAccess(user, data.rackId);
  const occupiedPort = await db.$transaction(async (tx) => {
    const blockedPort = await updatePatchPanelPortRows(tx, id, data.portCount);
    if (blockedPort) return blockedPort;
    await tx.patchPanel.update({ where: { id }, data });
    return null;
  });
  if (occupiedPort) report("error", `A porta ${occupiedPort} está vinculada a um ponto de rede.`);
  refreshAdmin("Patch panel atualizado.");
}
export async function deletePatchPanel(formData: FormData) {
  const user = await requireUser();
  const parsed = z.object({ id: idSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Patch panel inválido.");
  if (!await db.patchPanel.findFirst({ where: { id: parsed.data.id, ...ownerScope(user) }, select: { id: true } })) {
    report("error", "Patch panel não encontrado na sua infraestrutura.");
  }
  const occupied = await db.patchPanelPort.findFirst({
    where: { patchPanelId: parsed.data.id, networkPoint: { isNot: null } },
    select: { number: true },
  });
  if (occupied) report("error", `Desvincule o ponto conectado à porta ${occupied.number} antes de excluir o patch panel.`);
  await db.patchPanel.delete({ where: { id: parsed.data.id } });
  refreshAdmin("Patch panel excluído.");
}

const pointFields = z.object({
  code: nameSchema,
  location: z.string().trim().min(1).max(200),
  cableCategory: z.nativeEnum(CableCategory),
  patchPanelPortId: optionalId,
  switchPortId: optionalId,
});
export async function createNetworkPoint(formData: FormData) {
  const user = await requireUser();
  const parsed = pointFields.safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Confira o código, local e categoria do ponto.");
  if (await db.networkPoint.findFirst({
    where: { code: parsed.data.code, ownerId: user.id },
    select: { id: true },
  })) {
    report("error", "Já existe um ponto com este código.");
  }
  await ensurePortAccess(user, parsed.data.patchPanelPortId, "patchPanel");
  await ensurePortAccess(user, parsed.data.switchPortId, "switch");
  if (parsed.data.patchPanelPortId && await db.networkPoint.findFirst({
    where: { patchPanelPortId: parsed.data.patchPanelPortId }, select: { id: true },
  })) report("error", "A porta do patch panel já está vinculada a outro ponto.");
  if (parsed.data.switchPortId && await db.networkPoint.findFirst({
    where: { switchPortId: parsed.data.switchPortId }, select: { id: true },
  })) report("error", "A porta do switch já está vinculada a outro ponto.");
  await db.networkPoint.create({ data: { ...parsed.data, ownerId: user.id } });
  refreshAdmin("Ponto de rede criado.");
}
export async function updateNetworkPoint(formData: FormData) {
  const user = await requireUser();
  const parsed = pointFields.extend({ id: idSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Confira os dados do ponto de rede.");
  const { id, ...data } = parsed.data;
  const existing = await db.networkPoint.findFirst({
    where: { id, ...ownerScope(user) },
    select: { id: true, ownerId: true },
  });
  if (!existing) report("error", "Ponto não encontrado na sua infraestrutura.");
  if (await db.networkPoint.findFirst({
    where: { code: data.code, ownerId: existing.ownerId, id: { not: id } },
    select: { id: true },
  })) {
    report("error", "Já existe um ponto com este código.");
  }
  await ensurePortAccess(user, data.patchPanelPortId, "patchPanel");
  await ensurePortAccess(user, data.switchPortId, "switch");
  if (data.patchPanelPortId && await db.networkPoint.findFirst({
    where: { patchPanelPortId: data.patchPanelPortId, id: { not: id } }, select: { id: true },
  })) report("error", "A porta do patch panel já está vinculada a outro ponto.");
  if (data.switchPortId && await db.networkPoint.findFirst({
    where: { switchPortId: data.switchPortId, id: { not: id } }, select: { id: true },
  })) report("error", "A porta do switch já está vinculada a outro ponto.");
  await db.networkPoint.update({ where: { id }, data });
  refreshAdmin("Ponto de rede atualizado.");
}
export async function deleteNetworkPoint(formData: FormData) {
  const user = await requireUser();
  const parsed = z.object({ id: idSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Ponto inválido.");
  if (!await db.networkPoint.findFirst({ where: { id: parsed.data.id, ...ownerScope(user) }, select: { id: true } })) {
    report("error", "Ponto não encontrado na sua infraestrutura.");
  }
  await db.networkPoint.delete({ where: { id: parsed.data.id } });
  refreshAdmin("Ponto de rede e certificações relacionadas excluídos.");
}

const certificationFields = z.object({
  networkPointId: idSchema,
  result: z.nativeEnum(TestResult),
  performedBy: optionalText,
  notes: optionalText,
});
export async function createCertification(formData: FormData) {
  const user = await requireUser();
  const parsed = certificationFields.safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Selecione um ponto e um resultado para a certificação.");
  if (!await db.networkPoint.findFirst({
    where: { id: parsed.data.networkPointId, ...ownerScope(user) },
    select: { id: true },
  })) report("error", "Ponto não encontrado na sua infraestrutura.");
  await db.certificationTest.create({ data: parsed.data });
  refreshAdmin("Certificação registrada.");
}
export async function updateCertification(formData: FormData) {
  const user = await requireUser();
  const parsed = certificationFields.extend({ id: idSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Confira os dados da certificação.");
  const { id, ...data } = parsed.data;
  const existing = await db.certificationTest.findFirst({
    where: { id, networkPoint: ownerScope(user) },
    select: { id: true },
  });
  if (!existing) report("error", "Certificação não encontrada na sua infraestrutura.");
  if (!await db.networkPoint.findFirst({
    where: { id: data.networkPointId, ...ownerScope(user) },
    select: { id: true },
  })) report("error", "Ponto não encontrado na sua infraestrutura.");
  await db.certificationTest.update({ where: { id }, data });
  refreshAdmin("Certificação atualizada.");
}
export async function deleteCertification(formData: FormData) {
  const user = await requireUser();
  const parsed = z.object({ id: idSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Certificação inválida.");
  if (!await db.certificationTest.findFirst({
    where: { id: parsed.data.id, networkPoint: ownerScope(user) },
    select: { id: true },
  })) report("error", "Certificação não encontrada na sua infraestrutura.");
  await db.certificationTest.delete({ where: { id: parsed.data.id } });
  refreshAdmin("Certificação excluída.");
}

const bomFields = z.object({
  name: nameSchema,
  unit: z.string().trim().min(1).max(40),
  quantity: z.coerce.number().finite().positive(),
  estimatedCost: z.coerce.number().finite().min(0),
});
export async function createBomItem(formData: FormData) {
  const user = await requireUser();
  const parsed = bomFields.safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Confira nome, unidade, quantidade e custo do item.");
  await db.bomItem.create({ data: { ...parsed.data, ownerId: user.id } });
  refreshAdmin("Item da BOM criado.");
}
export async function updateBomItem(formData: FormData) {
  const user = await requireUser();
  const parsed = bomFields.extend({ id: idSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Confira os dados do item da BOM.");
  const { id, ...data } = parsed.data;
  if (!await db.bomItem.findFirst({ where: { id, ...ownerScope(user) }, select: { id: true } })) {
    report("error", "Item da BOM não encontrado na sua infraestrutura.");
  }
  await db.bomItem.update({ where: { id }, data });
  refreshAdmin("Item da BOM atualizado.");
}
export async function deleteBomItem(formData: FormData) {
  const user = await requireUser();
  const parsed = z.object({ id: idSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Item da BOM inválido.");
  if (!await db.bomItem.findFirst({ where: { id: parsed.data.id, ...ownerScope(user) }, select: { id: true } })) {
    report("error", "Item da BOM não encontrado na sua infraestrutura.");
  }
  await db.bomItem.delete({ where: { id: parsed.data.id } });
  refreshAdmin("Item da BOM excluído.");
}

export async function updateBomMargin(formData: FormData) {
  const user = await requireUser();
  const parsed = z.object({ marginPercent: z.coerce.number().finite().min(0) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Informe uma margem válida, igual ou maior que zero.");

  await db.$transaction(async (tx) => {
    const settings = user.role === "ADMIN"
      ? await tx.bomSettings.findFirst({ where: { OR: [{ userId: user.id }, { userId: null }] } })
      : await tx.bomSettings.findUnique({ where: { userId: user.id } });
    if (settings) {
      await tx.bomSettings.update({
        where: { id: settings.id },
        data: { marginPercent: parsed.data.marginPercent },
      });
    } else {
      await tx.bomSettings.create({
        data: { userId: user.id, marginPercent: parsed.data.marginPercent },
      });
    }
  });
  refreshAdmin("Margem de custo atualizada.");
}
