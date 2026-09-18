import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validators";
import { hashPassword, verifyCode } from "@/lib/password";

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  const parsed = resetPasswordSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados invalidos.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, code, password } = parsed.data;
  const genericError = { error: "Codigo invalido ou expirado." };

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json(genericError, { status: 400 });
  }

  const reset = await db.passwordReset.findFirst({
    where: { userId: user.id, usedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!reset) {
    return NextResponse.json(genericError, { status: 400 });
  }

  if (reset.expiresAt < new Date()) {
    return NextResponse.json({ error: "Este codigo expirou. Solicite um novo." }, { status: 400 });
  }

  if (reset.attempts >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: "Numero maximo de tentativas excedido. Solicite um novo codigo." },
      { status: 429 }
    );
  }

  const isValid = await verifyCode(code, reset.codeHash);
  if (!isValid) {
    await db.passwordReset.update({
      where: { id: reset.id },
      data: { attempts: { increment: 1 } },
    });
    return NextResponse.json(genericError, { status: 400 });
  }

  const passwordHash = await hashPassword(password);

  await db.$transaction([
    db.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
    db.user.update({ where: { id: user.id }, data: { passwordHash } }),
    // Por seguranca, revoga todas as sessoes ativas apos a troca de senha.
    db.session.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ message: "Senha redefinida com sucesso." });
}
