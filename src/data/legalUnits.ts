// Unidades y valores judiciales de referencia (UY/AR).
// Dolor real del ejercicio: "¿cuánto vale hoy la UR / la BPC / la UMA?"
// En Fase 2 estos valores viven en la tabla legal_units y se actualizan por
// cron (edge function update-legal-units); acá está la foto seed con fuentes.

export interface LegalUnit {
  id: string;
  country: "UY" | "AR";
  code: string;
  name: string;
  description: string;
  value: number;
  currency: "UYU" | "ARS";
  /** desde cuándo rige este valor */
  validFrom: string;
  /** con qué frecuencia cambia */
  frequency: "mensual" | "anual" | "variable (por acordada)" | "semestral";
  source: string;
  sourceUrl: string;
  /** true si el valor exacto debe verificarse en la tabla oficial (p. ej. timbres con varias denominaciones) */
  approximate?: boolean;
}

export const LEGAL_UNITS: LegalUnit[] = [
  {
    id: "uy-ur",
    country: "UY",
    code: "UR",
    name: "Unidad Reajustable",
    description:
      "Se ajusta todos los meses según el Índice Medio de Salarios. Se usa en alquileres, honorarios y multas.",
    value: 1921.36,
    currency: "UYU",
    validFrom: "2026-06-01",
    frequency: "mensual",
    source: "INE / DGI",
    sourceUrl: "https://www.gub.uy/direccion-general-impositiva/datos-y-estadisticas/datos/unidad-reajustable-ur",
  },
  {
    id: "uy-bpc",
    country: "UY",
    code: "BPC",
    name: "Base de Prestaciones y Contribuciones",
    description:
      "Unidad de referencia de prestaciones, franjas de IRPF/IASS y montos legales. Se fija por decreto cada enero.",
    value: 6864,
    currency: "UYU",
    validFrom: "2026-01-01",
    frequency: "anual",
    source: "Decreto 11/026 — BPS",
    sourceUrl: "https://www.impo.com.uy/bases/decretos-originales/11-2026",
  },
  {
    id: "uy-timbre",
    country: "UY",
    code: "Timbre prof.",
    name: "Timbre profesional (escrito judicial)",
    description:
      "Timbre de la Caja de Profesionales por escrito ante órganos jurisdiccionales. Existen varias denominaciones según el acto: verificá la tabla vigente.",
    value: 250,
    currency: "UYU",
    validFrom: "2025-01-01",
    frequency: "semestral",
    source: "CJPPU / DGI",
    sourceUrl: "https://www.cjppu.org.uy/timbres.php",
    approximate: true,
  },
  {
    id: "ar-uma",
    country: "AR",
    code: "UMA",
    name: "Unidad de Medida Arancelaria",
    description:
      "Unidad de la ley 27.423 para honorarios de abogados en la justicia nacional y federal. La CSJN publica el valor con cada aumento salarial judicial.",
    value: 89875,
    currency: "ARS",
    validFrom: "2026-03-05",
    frequency: "variable (por acordada)",
    source: "CSJN — Res. 235/26",
    sourceUrl: "https://www.csjn.gov.ar/transparencia/uma",
  },
];

export function unitsByCountry(country: "UY" | "AR"): LegalUnit[] {
  return LEGAL_UNITS.filter((u) => u.country === country);
}

/** Parsea cantidades con coma o punto decimal ("0,12" / "0.12"). */
export function parseQuantity(raw: string): number | null {
  const normalized = raw.trim().replace(/\./g, "").replace(",", ".");
  // si el usuario escribió "0.12" sin miles, el replace de puntos lo rompería:
  const simple = raw.trim().replace(",", ".");
  const candidate = /^\d{1,3}(\.\d{3})+(,\d+)?$/.test(raw.trim())
    ? Number(normalized)
    : Number(simple);
  return Number.isFinite(candidate) && candidate >= 0 ? candidate : null;
}
