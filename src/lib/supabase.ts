import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DEMO_MODE } from "./demo";

let client: SupabaseClient | null = null;

/** Cliente Supabase. En modo demo no se instancia (la capa api/ usa el store local). */
export function getSupabase(): SupabaseClient {
  if (DEMO_MODE) {
    throw new Error("Supabase no disponible en modo demo. Configurá .env (ver README).");
  }
  if (!client) {
    client = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
    );
  }
  return client;
}
