import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validators";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const parsed = loginSchema.safeParse(await req.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
  }

  const { email, password, rememberMe } = parsed.data;
  const genericError = { error: "E-mail ou senha incorretos." };

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json(genericError, { status: 401 });
  }

  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) {
    return NextResponse.json(genericError, { status: 401 });
  }

  if (!user.emailVerifiedAt) {
    return NextResponse.json(
      { error: "Confirme seu e-mail antes de entrar.", needsVerification: true, email: user.email },
      { status: 403 }
    );
  }

  await createSession(user.id, rememberMe);

  return NextResponse.json({
    message: "Login realizado com sucesso.",
    user: { id: user.id, firstName: user.firstName, role: user.role },
  });
}
