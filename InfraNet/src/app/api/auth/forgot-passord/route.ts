import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validators";
import { generateNumericCode, hashCode } from "@/lib/password";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const parsed = forgotPasswordSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Informe um e-mail valido." }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });

  // Mesma resposta exista ou nao a conta — nao revelar informacoes sensiveis.
  const response = NextResponse.json({
    message: "Se existir uma conta com este e-mail, enviamos um codigo de recuperacao.",
  });

  if (!user) return response;

  await db.passwordReset.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const code = generateNumericCode();
  const codeHash = await hashCode(code);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await db.passwordReset.create({ data: { userId: user.id, codeHash, expiresAt } });
  await sendPasswordResetEmail(user.email, user.firstName, code);

  return response;
}
