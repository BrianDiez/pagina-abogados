// Modo demo: la app funciona completa con datos locales mientras
// el proyecto Supabase no esté provisionado (ver README).
export const DEMO_MODE =
  (import.meta.env.VITE_DEMO_MODE ?? "true") !== "false" ||
  !import.meta.env.VITE_SUPABASE_URL;
