import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { supabaseAdmin, LOGOS_BUCKET } from "@/lib/supabase";
import { env } from "@/env";

// Tipos de imagen permitidos (SVG excluido a propósito: puede ejecutar JS).
const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  // Solo usuarios logueados pueden subir.
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "no file" }, { status: 400 });
  }

  const ext = ALLOWED[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Tipo de archivo no permitido (solo PNG, JPG, WEBP, GIF)." }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "El archivo supera los 5 MB." }, { status: 413 });
  }

  try {
    // Create bucket if it doesn't exist (no-op if it already exists)
    await supabaseAdmin.storage.createBucket(LOGOS_BUCKET, {
      public: true,
      allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
    });
  } catch {
    // Bucket already exists or creation failed — proceed anyway
  }

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const { error } = await supabaseAdmin.storage
      .from(LOGOS_BUCKET)
      .upload(filename, buffer, { contentType: file.type, upsert: false });

    if (error) {
      console.error("[upload] Supabase error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    console.error("[upload] exception:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const publicUrl = `${env.SUPABASE_URL}/storage/v1/object/public/${LOGOS_BUCKET}/${filename}`;

  return NextResponse.json({ url: publicUrl });
}
