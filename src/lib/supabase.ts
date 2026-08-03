import { createClient } from "@supabase/supabase-js";
import { env } from "@/env";

// Server-side client with service role (for uploads from API routes)
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
);

export const LOGOS_BUCKET = "bucket";

/** Bucket separado para los videos de tutoriales (público, solo lectura). */
export const TUTORIALS_BUCKET = "tutorials";
