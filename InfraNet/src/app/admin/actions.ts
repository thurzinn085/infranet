"use server";

import { CableCategory, Prisma, Role, TestResult } from "@prisma/client";
import { revalidatePath } from "next/cache";
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

function report(kind: "notice" | "error", message: string): never {
  redirect(`/admin?${kind}=${encodeURIComponent(message)}`);
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
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
  role: z.nativeEnum(Role),
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
  await db.user.create({ data: { firstName, lastName, email, role, passwordHash } });
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
    await tx.user.update({ where: { id }, data: { firstName, lastName, email, role } });
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
  await requireAdmin();
  const parsed = rackFields.safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Informe um nome válido para o rack.");
  await db.rack.create({ data: parsed.data });
  refreshAdmin("Rack criado.");
}
export async function updateRack(formData: FormData) {
  await requireAdmin();
  const parsed = rackFields.extend({ id: idSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Dados do rack inválidos.");
  await db.rack.update({ where: { id: parsed.data.id }, data: { name: parsed.data.name, location: parsed.data.location } });
  refreshAdmin("Rack atualizado.");
}
export async function deleteRack(formData: FormData) {
  await requireAdmin();
  const parsed = z.object({ id: idSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Rack inválido.");
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
  await requireAdmin();
  const parsed = deviceFields.safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Confira os dados e o número de portas do switch.");
  await db.$transaction(async (tx) => {
    const device = await tx.switch.create({ data: parsed.data });
    await tx.switchPort.createMany({
      data: Array.from({ length: parsed.data.portCount }, (_, index) => ({ switchId: device.id, number: index + 1 })),
    });
  });
  refreshAdmin("Switch criado com suas portas.");
}
export async function updateSwitch(formData: FormData) {
  await requireAdmin();
  const parsed = deviceFields.extend({ id: idSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Confira os dados e o número de portas do switch.");
  const { id, ...data } = parsed.data;
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
  await requireAdmin();
  const parsed = z.object({ id: idSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Switch inválido.");
  const occupied = await db.switchPort.findFirst({
    where: { switchId: parsed.data.id, networkPoint: { isNot: null } },
    select: { number: true },
  });
  if (occupied) report("error", `Desvincule o ponto conectado à porta ${occupied.number} antes de excluir o switch.`);
  await db.switch.delete({ where: { id: parsed.data.id } });
  refreshAdmin("Switch excluído.");
}

export async function createPatchPanel(formData: FormData) {
  await requireAdmin();
  const parsed = patchPanelFields.safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Confira os dados e o número de portas do patch panel.");
  await db.$transaction(async (tx) => {
    const panel = await tx.patchPanel.create({ data: parsed.data });
    await tx.patchPanelPort.createMany({
      data: Array.from({ length: parsed.data.portCount }, (_, index) => ({ patchPanelId: panel.id, number: index + 1 })),
    });
  });
  refreshAdmin("Patch panel criado com suas portas.");
}
export async function updatePatchPanel(formData: FormData) {
  await requireAdmin();
  const parsed = patchPanelFields.extend({ id: idSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Confira os dados e o número de portas do patch panel.");
  const { id, ...data } = parsed.data;
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
  await requireAdmin();
  const parsed = z.object({ id: idSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Patch panel inválido.");
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
  await requireAdmin();
  const parsed = pointFields.safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Confira o código, local e categoria do ponto.");
  if (await db.networkPoint.findUnique({ where: { code: parsed.data.code }, select: { id: true } })) {
    report("error", "Já existe um ponto com este código.");
  }
  if (parsed.data.patchPanelPortId && await db.networkPoint.findUnique({
    where: { patchPanelPortId: parsed.data.patchPanelPortId }, select: { id: true },
  })) report("error", "A porta do patch panel já está vinculada a outro ponto.");
  if (parsed.data.switchPortId && await db.networkPoint.findUnique({
    where: { switchPortId: parsed.data.switchPortId }, select: { id: true },
  })) report("error", "A porta do switch já está vinculada a outro ponto.");
  await db.networkPoint.create({ data: parsed.data });
  refreshAdmin("Ponto de rede criado.");
}
export async function updateNetworkPoint(formData: FormData) {
  await requireAdmin();
  const parsed = pointFields.extend({ id: idSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Confira os dados do ponto de rede.");
  const { id, ...data } = parsed.data;
  if (await db.networkPoint.findFirst({ where: { code: data.code, id: { not: id } }, select: { id: true } })) {
    report("error", "Já existe um ponto com este código.");
  }
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
  await requireAdmin();
  const parsed = z.object({ id: idSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Ponto inválido.");
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
  await requireAdmin();
  const parsed = certificationFields.safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Selecione um ponto e um resultado para a certificação.");
  await db.certificationTest.create({ data: parsed.data });
  refreshAdmin("Certificação registrada.");
}
export async function updateCertification(formData: FormData) {
  await requireAdmin();
  const parsed = certificationFields.extend({ id: idSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Confira os dados da certificação.");
  const { id, ...data } = parsed.data;
  await db.certificationTest.update({ where: { id }, data });
  refreshAdmin("Certificação atualizada.");
}
export async function deleteCertification(formData: FormData) {
  await requireAdmin();
  const parsed = z.object({ id: idSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Certificação inválida.");
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
  await requireAdmin();
  const parsed = bomFields.safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Confira nome, unidade, quantidade e custo do item.");
  await db.bomItem.create({ data: parsed.data });
  refreshAdmin("Item da BOM criado.");
}
export async function updateBomItem(formData: FormData) {
  await requireAdmin();
  const parsed = bomFields.extend({ id: idSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Confira os dados do item da BOM.");
  const { id, ...data } = parsed.data;
  await db.bomItem.update({ where: { id }, data });
  refreshAdmin("Item da BOM atualizado.");
}
export async function deleteBomItem(formData: FormData) {
  await requireAdmin();
  const parsed = z.object({ id: idSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Item da BOM inválido.");
  await db.bomItem.delete({ where: { id: parsed.data.id } });
  refreshAdmin("Item da BOM excluído.");
}

export async function updateBomMargin(formData: FormData) {
  await requireAdmin();
  const parsed = z.object({ marginPercent: z.coerce.number().finite().min(0) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) report("error", "Informe uma margem válida, igual ou maior que zero.");

  await db.$transaction(async (tx) => {
    const settings = await tx.bomSettings.findFirst();
    if (settings) {
      await tx.bomSettings.update({
        where: { id: settings.id },
        data: { marginPercent: parsed.data.marginPercent },
      });
    } else {
      await tx.bomSettings.create({ data: { marginPercent: parsed.data.marginPercent } });
    }
  });
  refreshAdmin("Margem de custo atualizada.");
}
