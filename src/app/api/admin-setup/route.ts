import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/server/db";

export async function GET() {
  const existing = await db.user.findFirst({ where: { role: "admin" } });
  if (existing) {
    return NextResponse.json({ message: "Admin ya existe." });
  }

  const password = await bcrypt.hash("Alcorte22.", 12);
  await db.user.create({
    data: {
      username: "Valentin",
      password,
      role: "admin",
      approved: true,
    },
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

  return NextResponse.json({ message: "Admin creado con presets por defecto." });
}
