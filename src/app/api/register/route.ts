import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/server/db";
import { z } from "zod";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const schema = z.object({
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8),
  email: z.string().email().optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  // Anti abuso: límite por IP (5 registros / 15 min).
  const rl = rateLimit(`register:${clientIp(req.headers)}`, 5, 15 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Demasiados intentos. Probá de nuevo en ${rl.retryAfter}s.` },
      { status: 429 },
    );
  }

  const body = (await req.json()) as unknown;
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid" }, { status: 400 });
  }

  const { username, password, email } = parsed.data;

  const existing = await db.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: "El nombre de usuario ya existe." }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);
  await db.user.create({
    data: {
      username,
      password: hashed,
      email: email || null,
      approved: false,
      role: "user",
    },
  });

  return NextResponse.json({ ok: true });
}
