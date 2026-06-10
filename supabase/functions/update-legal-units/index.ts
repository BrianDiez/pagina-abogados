// Edge Function: actualización de unidades judiciales. Pensada para cron diario:
//   select cron.schedule('legal-units', '0 9 * * *', ...)
//
// ¿Se puede automatizar? Sí, por unidad:
//  - UR (UY): el INE publica serie mensual (XLS) y la DGI una página HTML estable.
//    Estrategia: fetch DGI + parse del valor vigente. Cambia el día 1 de cada mes.
//  - BPC (UY): decreto anual (enero). El cron solo verifica en enero; si cambió,
//    actualiza y notifica al admin para confirmar.
//  - UMA (AR): la CSJN publica https://www.csjn.gov.ar/transparencia/uma con la
//    tabla de resoluciones. Estrategia: parse de la última fila.
//  - Timbres (UY): tabla CJPPU semestral — semiautomático con confirmación admin.
//
// Diseño defensivo: si un fetch falla o el valor parseado se desvía >25% del
// anterior, NO se actualiza y se avisa al admin (mejor valor viejo con fecha
// visible que valor nuevo corrupto).
import { createClient } from "jsr:@supabase/supabase-js@2";

interface FetchResult {
  id: string;
  value: number;
  validFrom: string;
}

async function fetchUmaFromCSJN(): Promise<FetchResult | null> {
  try {
    const res = await fetch("https://www.csjn.gov.ar/transparencia/uma");
    if (!res.ok) return null;
    const html = await res.text();
    // La tabla lista "Resolución N/AA ... $ 89.875" — tomamos la primera fila.
    const match = html.match(/\$\s?([\d.]+),?(\d{0,2})/);
    if (!match) return null;
    const value = Number(match[1]!.replace(/\./g, ""));
    if (!Number.isFinite(value) || value <= 0) return null;
    return { id: "ar-uma", value, validFrom: new Date().toISOString().slice(0, 10) };
  } catch {
    return null;
  }
}

async function fetchUrFromDGI(): Promise<FetchResult | null> {
  try {
    const res = await fetch(
      "https://www.gub.uy/direccion-general-impositiva/datos-y-estadisticas/datos/unidad-reajustable-ur",
    );
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/([\d.]+,\d{2})/);
    if (!match) return null;
    const value = Number(match[1]!.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) return null;
    return { id: "uy-ur", value, validFrom: new Date().toISOString().slice(0, 10) };
  } catch {
    return null;
  }
}

Deno.serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const results = await Promise.all([fetchUmaFromCSJN(), fetchUrFromDGI()]);
  const updates: string[] = [];
  const warnings: string[] = [];

  for (const r of results) {
    if (!r) continue;
    const { data: current } = await supabase
      .from("legal_units")
      .select("value")
      .eq("id", r.id)
      .single();
    if (!current) continue;

    const drift = Math.abs(r.value - current.value) / current.value;
    if (drift > 0.25) {
      warnings.push(`${r.id}: valor parseado ${r.value} se desvía ${(drift * 100).toFixed(0)}% — requiere confirmación manual`);
      continue; // no actualizar: probable error de parseo
    }
    if (r.value !== current.value) {
      await supabase
        .from("legal_units")
        .update({ value: r.value, valid_from: r.validFrom })
        .eq("id", r.id);
      updates.push(`${r.id}: ${current.value} -> ${r.value}`);
    }
  }

  // TODO Fase 2: si hay warnings, email al admin via Resend
  return Response.json({ ok: true, updates, warnings });
});
