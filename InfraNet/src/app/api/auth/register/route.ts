import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validators";
import { hashPassword, hashSecurityAnswer } from "@/lib/password";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { firstName, lastName, email, password, securityQuestion, securityAnswer } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Já existe uma conta cadastrada com este e-mail." },
      { status: 409 }
    );
  }

  // Regra de negocio critica: a PRIMEIRA conta do sistema recebe ADMIN
  // automaticamente. Isso e decidido aqui, no backend, consultando o banco —
  // nunca a partir de um valor enviado pelo cliente.
  const userCount = await db.user.count();
  const role = userCount === 0 ? "ADMIN" : "LEITOR";

  const passwordHash = await hashPassword(password);
  const securityAnswerHash = await hashSecurityAnswer(securityAnswer);

  await db.user.create({
    data: {
      firstName,
      lastName,
      email,
      passwordHash,
      securityQuestion,
      securityAnswerHash,
      role,
    },
  });

  return NextResponse.json({
    message: "Conta criada com sucesso.",
  });
}
