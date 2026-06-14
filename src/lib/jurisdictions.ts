// Jurisdicciones de matriculación profesional por país.
//
// ARGENTINA — la matrícula es POR JURISDICCIÓN y un abogado suele tener varias:
//  * CPACF (ley 23.187): habilita CABA y la justicia federal con asiento en CABA.
//  * Matrícula federal: para litigar ante la justicia federal del interior se
//    requiere inscripción ante la Cámara Federal de la jurisdicción (la "doble
//    matriculación"; existe un proyecto de matrícula federal única, aún no ley).
//  * Prov. de Buenos Aires: colegios departamentales (La Plata, San Isidro, etc.)
//    agrupados en Colproba.
//  * Resto: un colegio por provincia.
//
// URUGUAY — no hay colegiación obligatoria: el título se registra ante la
// Suprema Corte de Justicia. El CAU (abogados) y la AEU (escribanos) son
// asociaciones voluntarias.

import type { ProfessionalRegistration } from "@/types";

export interface Jurisdiction {
  id: string;
  country: "UY" | "AR";
  label: string;
  /** etiqueta corta para componer el string visible "Mat. X · Y" */
  short: string;
  hint: string;
}

const AR_PROVINCES = [
  "Córdoba",
  "Santa Fe",
  "Mendoza",
  "Tucumán",
  "Entre Ríos",
  "Salta",
  "Corrientes",
  "Misiones",
  "Chaco",
  "Neuquén",
  "Río Negro",
  "Jujuy",
  "San Juan",
  "San Luis",
  "Santiago del Estero",
  "Catamarca",
  "La Rioja",
  "Formosa",
  "La Pampa",
  "Chubut",
  "Santa Cruz",
  "Tierra del Fuego",
] as const;

export const JURISDICTIONS: Jurisdiction[] = [
  // ── Uruguay ──
  {
    id: "uy-scj",
    country: "UY",
    label: "Suprema Corte de Justicia (registro de título)",
    short: "SCJ",
    hint: "N° de inscripción en la matrícula de la SCJ",
  },
  {
    id: "uy-cau",
    country: "UY",
    label: "Colegio de Abogados del Uruguay (socio, voluntario)",
    short: "CAU",
    hint: "N° de socio CAU",
  },
  {
    id: "uy-aeu",
    country: "UY",
    label: "Asociación de Escribanos del Uruguay (voluntario)",
    short: "AEU",
    hint: "N° de afiliación AEU",
  },
  // ── Argentina ──
  {
    id: "ar-cpacf",
    country: "AR",
    label: "CPACF — Capital Federal (CABA y justicia federal de CABA)",
    short: "CPACF",
    hint: "Ej.: T°89 F°412",
  },
  {
    id: "ar-federal",
    country: "AR",
    label: "Matrícula Federal (Cámara Federal de tu jurisdicción)",
    short: "Fed.",
    hint: "T°/F° o N° ante la Cámara Federal",
  },
  {
    id: "ar-pba",
    country: "AR",
    label: "Prov. de Buenos Aires — colegio departamental (Colproba)",
    short: "PBA",
    hint: "T°/F° + colegio (ej.: T°XX F°XX San Isidro)",
  },
  ...AR_PROVINCES.map((p) => ({
    id: `ar-${p
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")}`,
    country: "AR" as const,
    label: `Colegio de Abogados de ${p}`,
    short: p,
    hint: "N° o T°/F° según el colegio",
  })),
  {
    id: "ar-otra",
    country: "AR",
    label: "Otra jurisdicción / colegio",
    short: "Otra",
    hint: "Indicá colegio y número",
  },
];

export function jurisdictionsByCountry(country: "UY" | "AR"): Jurisdiction[] {
  return JURISDICTIONS.filter((j) => j.country === country);
}

/** IDs sugeridos (ordenados) según el colegio local de la provincia/departamento:
 *  colegio local primero, después Federal y CPACF — el combo típico del litigante.
 *  Es para SUGERIR (ordenar arriba), nunca para filtrar: un abogado puede tener
 *  matrículas de otras jurisdicciones (un rosarino, Santa Fe + Federal; etc.). */
export function suggestedJurisdictionIds(country: "UY" | "AR", localId?: string): string[] {
  if (country === "UY") return ["uy-scj", "uy-cau", "uy-aeu"];
  const base = ["ar-federal", "ar-cpacf"];
  if (!localId) return ["ar-cpacf", "ar-federal", "ar-pba"];
  return [localId, ...base.filter((id) => id !== localId)];
}

export function jurisdictionById(id: string): Jurisdiction | undefined {
  return JURISDICTIONS.find((j) => j.id === id);
}

export type { ProfessionalRegistration };

/** String visible: "CPACF T°89 F°412 · Fed. T°12 F°33" */
export function registrationsDisplay(regs: ProfessionalRegistration[]): string {
  return regs
    .filter((r) => r.number.trim())
    .map((r) => `${jurisdictionById(r.jurisdictionId)?.short ?? ""} ${r.number.trim()}`.trim())
    .join(" · ");
}

export function defaultJurisdiction(country: "UY" | "AR", localId?: string): string {
  return suggestedJurisdictionIds(country, localId)[0]!;
}
