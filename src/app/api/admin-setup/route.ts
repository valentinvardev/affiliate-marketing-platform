import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/server/db";

/**
 * Bootstrap del primer admin. SOLO funciona si:
 *  - no existe ningún admin todavía, y
 *  - se pasa ?token=… que coincide con ADMIN_SETUP_TOKEN, y
 *  - están definidos ADMIN_SETUP_USERNAME y ADMIN_SETUP_PASSWORD en el env.
 * Sin credenciales hardcodeadas. Si no está configurado, responde 404.
 */
export async function GET(req: NextRequest) {
  const token = process.env.ADMIN_SETUP_TOKEN;
  const username = process.env.ADMIN_SETUP_USERNAME;
  const password = process.env.ADMIN_SETUP_PASSWORD;

  // Deshabilitado salvo que esté explícitamente configurado por env.
  if (!token || !username || !password) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (req.nextUrl.searchParams.get("token") !== token) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const existing = await db.user.findFirst({ where: { role: "admin" } });
  if (existing) {
    return NextResponse.json({ message: "Admin ya existe." });
  }

  const hashed = await bcrypt.hash(password, 12);
  await db.user.create({
    data: { username, password: hashed, role: "admin", approved: true },
  });

  const defaultColors = [
    { name: "Dorado",  colorPrimary: "oklch(0.74 0.19 55)",  colorBg: "oklch(0.16 0.04 265)" },
    { name: "Verde",   colorPrimary: "oklch(0.72 0.19 145)", colorBg: "oklch(0.15 0.04 165)" },
    { name: "Azul",    colorPrimary: "oklch(0.65 0.22 255)", colorBg: "oklch(0.14 0.05 255)" },
    { name: "Naranja", colorPrimary: "oklch(0.68 0.22 35)",  colorBg: "oklch(0.15 0.04 20)"  },
    { name: "Morado",  colorPrimary: "oklch(0.65 0.22 295)", colorBg: "oklch(0.14 0.05 280)" },
    { name: "Rosa",    colorPrimary: "oklch(0.72 0.18 350)", colorBg: "oklch(0.15 0.04 330)" },
  ];
  await db.colorPreset.createMany({ data: defaultColors });

  return NextResponse.json({ message: "Admin creado." });
}
