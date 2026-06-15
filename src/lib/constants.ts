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

// Taxonomía completa validada con investigación (UY/AR), ordenada por frecuencia
// de uso. Cada rama trae sus temas. "Inmobiliario" es tema de Civil (no rama);
// "Divorcio", tema de Familia; "Previsional/Seguridad Social" se separa de
// Laboral porque en AR es una especialidad propia; etc.
export const LEGAL_AREAS: LegalArea[] = [
  {
    id: "civil",
    label: "Derecho Civil",
    topics: [
      "Contratos y obligaciones",
      "Daños y perjuicios / Responsabilidad civil",
      "Accidentes de tránsito",
      "Arrendamientos / Alquileres",
      "Propiedad y derechos reales",
      "Compraventa de inmuebles",
      "Propiedad horizontal",
      "Desalojos",
      "Cobro de pesos / ejecuciones",
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
      "Capitulaciones / régimen de bienes",
    ],
  },
  {
    id: "sucesorio",
    label: "Derecho Sucesorio",
    topics: [
      "Sucesiones y herencias",
      "Testamentos",
      "Partición de bienes",
      "Declaratoria de herederos",
      "Cesión de derechos hereditarios",
    ],
  },
  {
    id: "penal",
    label: "Derecho Penal",
    topics: [
      "Defensa penal",
      "Querellas",
      "Excarcelaciones y libertades",
      "Penal económico",
      "Lavado de activos",
      "Delitos contra la administración pública",
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
      "Accidentes y enfermedades de trabajo",
      "Acoso laboral / mobbing",
      "Reclamos salariales",
      "Trabajo no registrado",
      "Negociación colectiva y sindicatos",
      "Personal de servicio doméstico",
    ],
  },
  {
    id: "previsional",
    label: "Seguridad Social y Previsional",
    topics: [
      "Jubilaciones",
      "Pensiones",
      "Reajustes jubilatorios",
      "Incapacidad / invalidez",
      "Trámites ante BPS / ANSES",
      "Moratoria previsional",
    ],
  },
  {
    id: "comercial",
    label: "Derecho Comercial y Societario",
    topics: [
      "Constitución de sociedades",
      "Contratos comerciales",
      "Fusiones y adquisiciones (M&A)",
      "Fideicomisos",
      "Franquicias",
      "Compliance corporativo",
      "Asesoría de empresas y pymes",
      "Startups y tecnología",
      "Criptomonedas y activos digitales",
    ],
  },
  {
    id: "concursal",
    label: "Concursos y Quiebras",
    topics: [
      "Concurso de acreedores",
      "Quiebra",
      "Reestructuración de deudas",
      "Verificación de créditos",
      "Salvataje de empresas (cramdown)",
    ],
  },
  {
    id: "tributario",
    label: "Derecho Tributario",
    topics: [
      "Impuestos (DGI / AFIP)",
      "Defensa ante el fisco",
      "Planificación fiscal",
      "Tributación internacional",
      "Moratorias y planes de pago",
    ],
  },
  {
    id: "administrativo",
    label: "Administrativo y Contencioso Administrativo",
    topics: [
      "Recursos contra el Estado",
      "Empleo / función pública",
      "Contrataciones y licitaciones",
      "Expropiaciones",
      "Responsabilidad del Estado",
      "Regulación de servicios públicos",
    ],
  },
  {
    id: "constitucional",
    label: "Derecho Constitucional y Amparo",
    topics: [
      "Acción de amparo",
      "Inconstitucionalidad",
      "Habeas corpus",
      "Habeas data",
      "Derechos fundamentales",
    ],
  },
  {
    id: "consumidor",
    label: "Derecho del Consumidor",
    topics: ["Reclamos de consumo", "Defensa del consumidor", "Sobreendeudamiento", "Cláusulas abusivas"],
  },
  {
    id: "intelectual",
    label: "Propiedad Intelectual",
    topics: [
      "Marcas",
      "Patentes",
      "Derechos de autor",
      "Nombres de dominio",
      "Combate a la falsificación",
    ],
  },
  {
    id: "informatico",
    label: "Derecho Informático y Protección de Datos",
    topics: [
      "Protección de datos personales",
      "Ciberdelitos",
      "Contratos tecnológicos / SaaS",
      "Comercio electrónico",
      "Inteligencia artificial",
    ],
  },
  {
    id: "bancario",
    label: "Derecho Bancario y Financiero",
    topics: [
      "Contratos bancarios",
      "Mercado de capitales",
      "Fideicomisos financieros",
      "Financiamiento",
      "Defensa del deudor",
      "Fintech",
    ],
  },
  {
    id: "seguros",
    label: "Derecho de Seguros",
    topics: [
      "Reclamos a aseguradoras",
      "Accidentes de tránsito",
      "Seguros de vida",
      "Responsabilidad civil",
      "Reaseguros",
    ],
  },
  {
    id: "salud",
    label: "Derecho de la Salud y Mala Praxis",
    topics: [
      "Mala praxis médica",
      "Responsabilidad médica",
      "Cobertura de medicamentos y prestaciones",
      "Derecho a la salud",
      "Discapacidad",
    ],
  },
  {
    id: "migratorio",
    label: "Derecho Migratorio",
    topics: ["Residencias y radicaciones", "Ciudadanía", "Visados de trabajo e inversión", "Expulsiones"],
  },
  {
    id: "internacional",
    label: "Derecho Internacional",
    topics: [
      "Internacional privado",
      "Internacional público",
      "Contratos internacionales",
      "Arbitraje internacional",
      "Restitución internacional de menores",
      "Cooperación y exhortos",
    ],
  },
  {
    id: "ambiental",
    label: "Derecho Ambiental",
    topics: [
      "Daño ambiental",
      "Evaluación de impacto ambiental",
      "Conflictos por agua y suelo",
      "Gestión de residuos",
      "Cambio climático",
    ],
  },
  {
    id: "aduanero",
    label: "Derecho Aduanero y Comercio Exterior",
    topics: [
      "Infracciones aduaneras",
      "Clasificación arancelaria",
      "Importación y exportación",
      "Zonas francas",
      "Comercio internacional",
    ],
  },
  {
    id: "agrario",
    label: "Derecho Agrario y Rural",
    topics: [
      "Arrendamientos rurales",
      "Compraventa de campos",
      "Aguas y riego",
      "Sanidad animal y vegetal",
      "Cooperativas agrarias",
    ],
  },
  {
    id: "energia",
    label: "Derecho de Minería y Energía",
    topics: [
      "Energías renovables",
      "Concesiones mineras",
      "Hidrocarburos",
      "Regulación energética",
      "Recursos naturales",
    ],
  },
  {
    id: "transporte",
    label: "Derecho Marítimo, Aeronáutico y del Transporte",
    topics: [
      "Derecho marítimo",
      "Derecho aeronáutico",
      "Transporte de cargas",
      "Pesca",
      "Accidentes de transporte",
    ],
  },
  {
    id: "ddhh",
    label: "Derechos Humanos",
    topics: [
      "Discriminación",
      "Violencia institucional",
      "Derechos de género",
      "Libertad de expresión",
      "Litigio de interés público",
    ],
  },
  {
    id: "deportivo",
    label: "Derecho Deportivo",
    topics: [
      "Contratos deportivos",
      "Transferencias de jugadores",
      "Disciplina deportiva",
      "Derechos de imagen",
      "Dopaje",
    ],
  },
  {
    id: "notarial",
    label: "Escribanía / Notariado",
    topics: [
      "Compraventas",
      "Certificaciones",
      "Poderes",
      "Constitución de sociedades",
      "Testamentos",
      "Estudio de títulos",
    ],
  },
  {
    id: "conciliacion",
    label: "Conciliaciones, Mediación y Arbitraje",
    topics: ["Conciliación previa", "Mediación", "Arbitraje", "Justicia de paz"],
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
