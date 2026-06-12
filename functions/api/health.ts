// GET /api/health — diagnóstico de configuración (solo booleanos, nunca valores)
import { getSql, json, type Handler } from "../../server/db";

export const onRequestGet: Handler = async ({ env }) => {
  const url = env.DATABASE_URL;
  const report: Record<string, unknown> = {
    DATABASE_URL_presente: !!url,
    DATABASE_URL_formato:
      !url
        ? "AUSENTE"
        : url !== url.trim()
          ? "TIENE ESPACIOS AL INICIO/FINAL — borrala y escribila de nuevo"
          : url.startsWith("postgresql://") || url.startsWith("postgres://")
            ? "ok"
            : "NO empieza con postgresql:// — revisar pegado",
    CLERK_SECRET_KEY_presente: !!env.CLERK_SECRET_KEY,
    R2_ACCOUNT_ID_presente: !!env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID_presente: !!env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY_presente: !!env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_presente: !!env.R2_BUCKET,
    R2_PUBLIC_URL_presente: !!env.R2_PUBLIC_URL,
    // Nombres exactos que ve el runtime (entre comillas para detectar espacios).
    // Solo nombres: los valores jamás se exponen.
    variables_detectadas: Object.keys(env as object)
      .filter((k) => !k.startsWith("CF_") && k !== "ASSETS")
      .map((k) => `"${k}"`),
  };

  try {
    const sql = getSql(env);
    await sql`select 1`;
    report.base_de_datos = "CONECTADA ✓";
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    report.base_de_datos = `ERROR: ${message.slice(0, 160)}`;
  }

  return json(report);
};
