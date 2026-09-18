import { NextResponse } from "next/server";
import { destroyCurrentSession } from "@/lib/auth";

export async function POST() {
  await destroyCurrentSession();
  return NextResponse.json({ message: "Sessao encerrada." });
}
