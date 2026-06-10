// i18n liviano para MVP (es-UY default). Estructura lista para migrar a i18next
// en Fase 3 (es-AR, pt-BR). La diferencia clave UY/AR es la terminología notarial.

export type CountryCode = "UY" | "AR";

/** "Escribano" en Uruguay; "Notario" en Argentina y resto de LATAM. */
export function notaryTerm(country: CountryCode = "UY", plural = false): string {
  const base = country === "UY" ? "escribano" : "notario";
  return plural ? `${base}s` : base;
}

export function professionalTypeLabel(
  type: string,
  country: CountryCode = "UY",
): string {
  switch (type) {
    case "lawyer":
      return "Abogado/a";
    case "notary":
      return country === "UY" ? "Escribano/a" : "Notario/a";
    case "tax_advisor":
      return "Asesor/a tributario";
    default:
      return "Profesional jurídico";
  }
}

export const COUNTRY_NAMES: Record<CountryCode, string> = {
  UY: "Uruguay",
  AR: "Argentina",
};
