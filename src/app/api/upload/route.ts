import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin, LOGOS_BUCKET } from "@/lib/supabase";
import { env } from "@/env";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "no file" }, { status: 400 });
  }

  // Ensure bucket exists and is public — safe to call even if it already exists
  const { error: bucketError } = await supabaseAdmin.storage.createBucket(LOGOS_BUCKET, {
    public: true,
    allowedMimeTypes: ["image/*"],
  });
  if (bucketError && !bucketError.message.includes("already exists")) {
    console.error("[upload] bucket create error:", bucketError.message);
  }

  const ext = file.name.split(".").pop() ?? "png";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage
    .from(LOGOS_BUCKET)
    .upload(filename, buffer, { contentType: file.type, upsert: false });

  if (error) {
    console.error("[upload] Supabase upload error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const publicUrl = `${env.SUPABASE_URL}/storage/v1/object/public/${LOGOS_BUCKET}/${filename}`;

  return NextResponse.json({ url: publicUrl });
}
