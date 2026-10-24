import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validators";
import { hashPassword, verifySecurityAnswer } from "@/lib/password";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function POST(req: NextRequest) {
  const parsed = resetPasswordSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados invalidos.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, securityAnswer, password } = parsed.data;
  const genericError = { error: "E-mail ou resposta incorretos." };
  const user = await db.user.findUnique({ where: { email } });
  if (!user?.securityQuestion || !user.securityAnswerHash) {
    return NextResponse.json(genericError, { status: 400 });
  }

  const now = new Date();
  if (user.securityRecoveryLockedUntil && user.securityRecoveryLockedUntil > now) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em 15 minutos." },
      { status: 429 }
    );
  }

  if (user.securityRecoveryLockedUntil && user.securityRecoveryLockedUntil <= now) {
    await db.user.update({
      where: { id: user.id },
      data: { securityRecoveryAttempts: 0, securityRecoveryLockedUntil: null },
    });
  }

  const isValid = await verifySecurityAnswer(securityAnswer, user.securityAnswerHash);
  if (!isValid) {
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: { securityRecoveryAttempts: { increment: 1 } },
      select: { securityRecoveryAttempts: true },
    });
    if (updatedUser.securityRecoveryAttempts >= MAX_ATTEMPTS) {
      await db.user.update({
        where: { id: user.id },
        data: { securityRecoveryLockedUntil: new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) },
      });
      return NextResponse.json(
        { error: "Muitas tentativas. Tente novamente em 15 minutos." },
        { status: 429 }
      );
    }
    return NextResponse.json(genericError, { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        securityRecoveryAttempts: 0,
        securityRecoveryLockedUntil: null,
      },
    }),
    db.session.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ message: "Senha redefinida com sucesso." });
}
