import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateNumericCode, hashCode } from "@/lib/password";
import { sendVerificationEmail } from "@/lib/email";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });

  // Resposta identica exista ou nao a conta, para nao vazar quais e-mails
  // estao cadastrados.
  const response = NextResponse.json({
    message: "Se houver uma conta pendente para este e-mail, um novo codigo foi enviado.",
  });

  if (!user || user.emailVerifiedAt) return response;

  // Invalida codigos anteriores antes de gerar um novo.
  await db.emailVerification.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const code = generateNumericCode();
  const codeHash = await hashCode(code);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await db.emailVerification.create({ data: { userId: user.id, codeHash, expiresAt } });
  await sendVerificationEmail(user.email, user.firstName, code);

  return response;
}
