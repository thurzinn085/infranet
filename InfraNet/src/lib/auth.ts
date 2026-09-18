import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { randomBytes, createHash } from "crypto";
import { db } from "./db";
import type { Role } from "@prisma/client";

const COOKIE_NAME = "infranet_session";

// Sessao curta quando "lembrar de mim" NAO esta marcado.
const SHORT_SESSION_HOURS = 12;
// Sessao longa quando "lembrar de mim" esta marcado.
const LONG_SESSION_DAYS = 30;

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET nao configurado");
  return new TextEncoder().encode(secret);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export type SessionUser = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  role: Role;
  emailVerifiedAt: Date | null;
};

// Cria uma sessao no banco (guardando so o hash do token) e devolve o token
// opaco que sera colocado no cookie. O JWT carrega apenas o id da sessao,
// para que ela possa ser revogada a qualquer momento no banco de dados.
export async function createSession(userId: string, rememberMe: boolean) {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);

  const expiresAt = new Date();
  if (rememberMe) {
    expiresAt.setDate(expiresAt.getDate() + LONG_SESSION_DAYS);
  } else {
    expiresAt.setHours(expiresAt.getHours() + SHORT_SESSION_HOURS);
  }

  const session = await db.session.create({
    data: { userId, tokenHash, rememberMe, expiresAt },
  });

  const jwt = await new SignJWT({ sid: session.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(getSecret());

  // O token real fica no cookie httpOnly; o JWT so referencia a sessao.
  const cookieValue = `${jwt}.${rawToken}`;

  cookies().set(COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return session;
}

export async function destroyCurrentSession() {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (raw) {
    const [, rawToken] = raw.split(".");
    if (rawToken) {
      const tokenHash = hashToken(rawToken);
      await db.session.updateMany({
        where: { tokenHash },
        data: { revokedAt: new Date() },
      });
    }
  }
  cookies().delete(COOKIE_NAME);
}

// Valida o cookie de sessao atual: verifica assinatura do JWT, confere que o
// hash do token bate com o que esta no banco, e que a sessao nao expirou nem
// foi revogada. Retorna o usuario autenticado ou null.
export async function getCurrentUser(): Promise<SessionUser | null> {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw || !raw.includes(".")) return null;

  const [jwt, rawToken] = raw.split(".");

  try {
    const { payload } = await jwtVerify(jwt, getSecret());
    const sessionId = payload.sid as string;

    const session = await db.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!session) return null;
    if (session.revokedAt) return null;
    if (session.expiresAt < new Date()) return null;
    if (session.tokenHash !== hashToken(rawToken)) return null;

    const { user } = session;
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      emailVerifiedAt: user.emailVerifiedAt,
    };
  } catch {
    // Token invalido ou expirado — trata como "nao autenticado" em vez de
    // expor detalhes tecnicos ao usuario.
    return null;
  }
}
