import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validators";
import { hashPassword, generateNumericCode, hashCode } from "@/lib/password";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados invalidos.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { firstName, lastName, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Ja existe uma conta cadastrada com este e-mail." },
      { status: 409 }
    );
  }

  // Regra de negocio critica: a PRIMEIRA conta do sistema recebe ADMIN
  // automaticamente. Isso e decidido aqui, no backend, consultando o banco —
  // nunca a partir de um valor enviado pelo cliente.
  const userCount = await db.user.count();
  const role = userCount === 0 ? "ADMIN" : "LEITOR";

  const passwordHash = await hashPassword(password);

  const user = await db.user.create({
    data: { firstName, lastName, email, passwordHash, role },
  });

  const code = generateNumericCode();
  const codeHash = await hashCode(code);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await db.emailVerification.create({
    data: { userId: user.id, codeHash, expiresAt },
  });

  await sendVerificationEmail(user.email, user.firstName, code);

  return NextResponse.json({
    message: "Conta criada. Enviamos um codigo de confirmacao para o seu e-mail.",
  });
}
