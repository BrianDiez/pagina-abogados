import type { Modality, Plan } from "@/types";

export const SPECIALTIES = [
  { id: "civil", label: "Derecho Civil" },
  { id: "penal", label: "Derecho Penal" },
  { id: "familia", label: "Familia y Divorcio" },
  { id: "laboral", label: "Derecho Laboral" },
  { id: "comercial", label: "Comercial / Societario" },
  { id: "inmobiliario", label: "Derecho Inmobiliario" },
  { id: "sucesiones", label: "Sucesiones y Herencias" },
  { id: "migratorio", label: "Derecho Migratorio" },
  { id: "tributario", label: "Tributario / Impositivo" },
  { id: "consumidor", label: "Derecho del Consumidor" },
  { id: "internacional", label: "Internacional Privado" },
  { id: "marcas", label: "Propiedad Intelectual / Marcas" },
  { id: "deportivo", label: "Derecho Deportivo" },
  { id: "notarial", label: "Escribanía / Notariado" },
  { id: "contratos", label: "Contratos y Documentos" },
  { id: "pymes", label: "Asesoría de Empresas" },
  { id: "cripto", label: "Cripto y Activos Digitales" },
] as const;

export function specialtyLabel(id: string): string {
  return SPECIALTIES.find((s) => s.id === id)?.label ?? id;
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
