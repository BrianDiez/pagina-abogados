import type { Modality, Plan } from "@/types";

// Taxonomía de dos niveles: RAMA del derecho (nivel 1) → TEMAS (nivel 2).
// Validado con feedback profesional: "Divorcio" es un tema dentro de Familia,
// "inmobiliario" no es una rama (es un tema de Civil), etc. La rama es lo que
// el cliente busca; los temas afinan. Un profesional elige rama(s) y, opcional,
// temas dentro de ellas.
export interface LegalArea {
  id: string;
  label: string;
  topics: string[];
}

export const LEGAL_AREAS: LegalArea[] = [
  {
    id: "civil",
    label: "Derecho Civil",
    topics: [
      "Contratos y obligaciones",
      "Daños y perjuicios / Responsabilidad civil",
      "Arrendamientos / Alquileres",
      "Propiedad y derechos reales",
      "Compraventa de inmuebles",
      "Desalojos",
      "Cobro de pesos",
      "Prescripción adquisitiva (usucapión)",
    ],
  },
  {
    id: "familia",
    label: "Derecho de Familia",
    topics: [
      "Divorcio",
      "Pensión alimenticia",
      "Tenencia y guarda",
      "Régimen de visitas",
      "Filiación y reconocimiento",
      "Adopción",
      "Violencia doméstica",
      "Unión concubinaria",
      "Curatela e interdicción",
    ],
  },
  {
    id: "sucesorio",
    label: "Derecho Sucesorio",
    topics: ["Sucesiones y herencias", "Testamentos", "Partición de bienes", "Declaratoria de herederos"],
  },
  {
    id: "penal",
    label: "Derecho Penal",
    topics: [
      "Defensa penal",
      "Querellas",
      "Excarcelaciones y libertades",
      "Delitos económicos",
      "Estupefacientes",
      "Violencia y lesiones",
      "Penal juvenil (adolescentes)",
      "Delitos informáticos",
    ],
  },
  {
    id: "laboral",
    label: "Derecho Laboral",
    topics: [
      "Despidos",
      "Accidentes de trabajo",
      "Acoso laboral",
      "Reclamos salariales",
      "Trabajo no registrado",
      "Seguridad social y jubilaciones",
    ],
  },
  {
    id: "comercial",
    label: "Derecho Comercial y Societario",
    topics: [
      "Constitución de sociedades",
      "Contratos comerciales",
      "Concursos y quiebras",
      "Asesoría de empresas y pymes",
      "Startups y tecnología",
      "Criptomonedas y activos digitales",
    ],
  },
  {
    id: "administrativo",
    label: "Contencioso Administrativo",
    topics: ["Recursos contra el Estado", "Empleo público", "Expropiaciones", "Responsabilidad del Estado"],
  },
  {
    id: "tributario",
    label: "Derecho Tributario",
    topics: ["Impuestos (DGI / AFIP)", "Defensa ante el fisco", "Planificación fiscal"],
  },
  {
    id: "consumidor",
    label: "Derecho del Consumidor",
    topics: ["Reclamos de consumo", "Defensa del consumidor", "Sobreendeudamiento"],
  },
  {
    id: "migratorio",
    label: "Derecho Migratorio",
    topics: ["Residencias y radicaciones", "Ciudadanía", "Visados de trabajo e inversión"],
  },
  {
    id: "internacional",
    label: "Derecho Internacional",
    topics: ["Internacional privado", "Contratos internacionales", "Restitución internacional de menores"],
  },
  {
    id: "intelectual",
    label: "Propiedad Intelectual",
    topics: ["Marcas", "Patentes", "Derechos de autor", "Nombres de dominio"],
  },
  {
    id: "notarial",
    label: "Escribanía / Notariado",
    topics: ["Compraventas", "Certificaciones", "Poderes", "Constitución de sociedades", "Testamentos"],
  },
  {
    id: "conciliacion",
    label: "Conciliaciones y Mediación",
    topics: ["Conciliación previa", "Mediación", "Justicia de paz"],
  },
];

/** Compat: muchos componentes importan SPECIALTIES para listar las ramas. */
export const SPECIALTIES = LEGAL_AREAS;

export function specialtyLabel(id: string): string {
  const norm = LEGACY_AREA_MAP[id] ?? id;
  return LEGAL_AREAS.find((s) => s.id === norm)?.label ?? id;
}

export function areaById(id: string): LegalArea | undefined {
  return LEGAL_AREAS.find((s) => s.id === id);
}

/** Temas disponibles para un conjunto de ramas elegidas (para el paso opcional). */
export function topicsForAreas(areaIds: string[]): { area: string; topics: string[] }[] {
  return areaIds
    .map((id) => areaById(id))
    .filter((a): a is LegalArea => !!a)
    .map((a) => ({ area: a.label, topics: a.topics }));
}

// Migración de ids viejos → nuevos (seeds y datos previos a la taxonomía de ramas)
const LEGACY_AREA_MAP: Record<string, string> = {
  inmobiliario: "civil",
  sucesiones: "sucesorio",
  marcas: "intelectual",
  contratos: "civil",
  pymes: "comercial",
  cripto: "comercial",
  deportivo: "civil",
};

export function normalizeAreaId(id: string): string {
  return LEGACY_AREA_MAP[id] ?? id;
}

export const CITIES_BY_COUNTRY: Record<"UY" | "AR", readonly string[]> = {
  UY: [
    "Montevideo",
    "Ciudad de la Costa",
    "Punta del Este",
    "Maldonado",
    "Salto",
    "Paysandú",
    "Rivera",
    "Colonia del Sacramento",
    "Tacuarembó",
    "Mercedes",
    "Durazno",
    "Las Piedras",
  ],
  AR: [
    "Buenos Aires (CABA)",
    "La Plata",
    "Mar del Plata",
    "San Isidro",
    "Lomas de Zamora",
    "Córdoba",
    "Rosario",
    "Santa Fe",
    "Mendoza",
    "San Miguel de Tucumán",
    "Salta",
    "Corrientes",
    "Posadas",
    "Resistencia",
    "Neuquén",
    "Paraná",
    "Bahía Blanca",
    "San Juan",
  ],
};

/** Lista plana (filtros del directorio y compatibilidad). */
export const CITIES = [...CITIES_BY_COUNTRY.UY, ...CITIES_BY_COUNTRY.AR] as const;

export const MODALITY_LABELS: Record<Modality, string> = {
  video: "Videollamada",
  in_person: "Presencial",
  phone: "Teléfono",
  async: "Solo online",
};

export const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;

export interface PlanDef {
  id: Plan;
  name: string;
  monthlyUsd: number | null; // null = a consultar
  annualUsd: number | null;
  tagline: string;
  /** Ancla de valor: el precio traducido a la unidad mental del abogado */
  anchor?: string;
  highlight?: boolean;
  features: string[];
  missing?: string[];
}

export const PLANS: PlanDef[] = [
  {
    id: "free",
    name: "Gratuito",
    monthlyUsd: 0,
    annualUsd: 0,
    tagline: "Para probar la plataforma y recién graduados.",
    features: [
      "Perfil público básico",
      "Hasta 3 servicios listados",
      "Agenda online (10 turnos/mes)",
      "Cobros con 5% de comisión",
      "Reviews de clientes",
    ],
    missing: ["Videollamada integrada", "Recordatorios WhatsApp", "Google Calendar", "Estadísticas"],
  },
  {
    id: "essential",
    name: "Esencial",
    monthlyUsd: 9,
    annualUsd: 90,
    tagline: "Para profesionales que empiezan a digitalizarse.",
    anchor: "Cuesta menos de media consulta",
    features: [
      "Servicios y turnos ilimitados",
      "0% comisión de plataforma",
      "Recordatorios por email y WhatsApp",
      "Sincronización Google Calendar",
      "Badge de perfil verificado",
      "Ficha de clientes básica",
      "Widget para tu web + QR",
    ],
    missing: ["Videollamada integrada", "Kit de redes sociales", "Blog profesional"],
  },
  {
    id: "professional",
    name: "Profesional",
    monthlyUsd: 19,
    annualUsd: 180,
    tagline: "Para la mayoría de los profesionales activos.",
    anchor: "Una consulta al mes lo paga",
    highlight: true,
    features: [
      "Todo lo de Esencial",
      "Videollamada integrada con grabación",
      "Sala de espera personalizada",
      "Mensajería con clientes",
      "Documentos compartibles (5 GB)",
      "Estadísticas avanzadas",
      "Kit de redes sociales",
      "Blog profesional (10 artículos)",
      "Paquetes de sesiones prepagas",
    ],
  },
  {
    id: "studio",
    name: "Estudio",
    monthlyUsd: 49,
    annualUsd: 490,
    tagline: "Para estudios jurídicos con equipo.",
    anchor: "Menos de US$ 10 por profesional",
    features: [
      "Todo lo de Profesional",
      "Hasta 5 perfiles bajo un estudio",
      "Dashboard unificado del estudio",
      "Distribución automática de turnos",
      "Destacado en directorio incluido",
      "Videollamadas sin límite + subtítulos",
      "Newsletter a clientes",
      "API access + onboarding personalizado",
    ],
  },
];

export const PLAN_NAMES: Record<Plan, string> = {
  free: "Gratuito",
  essential: "Esencial",
  professional: "Profesional",
  studio: "Estudio",
  enterprise: "Enterprise",
};
