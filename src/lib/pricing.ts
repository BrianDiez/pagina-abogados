// Precio sugerido por consulta — orientación para profesionales que recién
// empiezan y no saben cuánto cobrar (dolor #1 de juniors según investigación).
// Rangos base por país para una consulta de 45 min; en Fase 2 se calculan
// de los datos agregados reales de la plataforma.

interface PriceRange {
  min: number;
  max: number;
  currency: string;
}

const BASE_45MIN: Record<string, PriceRange> = {
  UY: { min: 1600, max: 3200, currency: "UYU" },
  AR: { min: 35000, max: 70000, currency: "ARS" },
};

function experienceFactor(years: number): number {
  if (years < 3) return 0.6; // recién matriculado: precio accesible para ganar reseñas
  if (years < 7) return 0.8;
  return 1;
}

function roundNice(value: number, currency: string): number {
  const step = currency === "ARS" ? 1000 : 100;
  return Math.round(value / step) * step;
}

export function suggestedPriceRange(
  country: string,
  yearsExperience: number,
  durationMinutes: number,
): PriceRange | null {
  const base = BASE_45MIN[country];
  if (!base) return null;
  const factor = experienceFactor(yearsExperience) * (durationMinutes / 45);
  return {
    min: roundNice(base.min * factor, base.currency),
    max: roundNice(base.max * factor, base.currency),
    currency: base.currency,
  };
}
