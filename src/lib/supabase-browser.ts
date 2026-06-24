import { createClient } from "@supabase/supabase-js";
import { env } from "@/env";

// Browser client with anon key — used for Realtime chat subscriptions.
export const supabaseBrowser = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { realtime: { params: { eventsPerSecond: 5 } } },
);
