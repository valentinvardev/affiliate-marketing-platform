import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";

export const dynamic = "force-dynamic";

const API_URL = "https://smmworld.org/api/v2";
const ALLOWED = new Set(["balance", "services", "status", "add"]);

/**
 * Proxy a SMM World. La API key vive en el servidor (env SMM_KEY) y nunca
 * se expone al cliente. Solo se permiten las acciones whitelisteadas.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const key = process.env.SMM_KEY ?? "";
  if (!key) {
    return NextResponse.json(
      { error: "SMM_KEY no está configurada en el servidor." },
      { status: 500 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const action = String(body.action ?? "");
  if (!ALLOWED.has(action)) {
    return NextResponse.json({ error: "Acción no permitida" }, { status: 400 });
  }

  const form = new URLSearchParams();
  form.set("key", key);
  for (const [k, v] of Object.entries(body)) {
    if (k === "key" || v == null || v === "") continue;
    form.set(k, String(v));
  }

  try {
    const apiRes = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      cache: "no-store",
    });
    const text = await apiRes.text();
    return new NextResponse(text, {
      status: apiRes.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error de red hacia SMM World" },
      { status: 502 },
    );
  }
}
