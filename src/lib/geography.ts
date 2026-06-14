// Geografía de dos niveles: región (departamento UY / provincia AR) → ciudad.
// La región es el nivel principal (importa para jurisdicción y directorio);
// la ciudad es opcional y se filtra por la región elegida.

export interface Region {
  name: string; // departamento (UY) o provincia (AR)
  cities: string[]; // ciudades/localidades principales
  /** jurisdicción de matriculación local más probable (ver jurisdictions.ts) */
  jurisdiction?: string;
}

export const GEOGRAPHY: Record<"UY" | "AR", Region[]> = {
  UY: [
    { name: "Artigas", cities: ["Artigas", "Bella Unión"] },
    {
      name: "Canelones",
      cities: [
        "Canelones",
        "Las Piedras",
        "Ciudad de la Costa",
        "Pando",
        "La Paz",
        "Progreso",
        "Santa Lucía",
        "Atlántida",
        "Toledo",
      ],
    },
    { name: "Cerro Largo", cities: ["Melo", "Río Branco", "Fraile Muerto"] },
    {
      name: "Colonia",
      cities: ["Colonia del Sacramento", "Carmelo", "Juan Lacaze", "Nueva Helvecia", "Rosario", "Tarariras"],
    },
    { name: "Durazno", cities: ["Durazno", "Sarandí del Yí"] },
    { name: "Flores", cities: ["Trinidad"] },
    { name: "Florida", cities: ["Florida", "Sarandí Grande"] },
    { name: "Lavalleja", cities: ["Minas", "José Pedro Varela"] },
    {
      name: "Maldonado",
      cities: ["Maldonado", "Punta del Este", "San Carlos", "Piriápolis", "Pan de Azúcar"],
    },
    { name: "Montevideo", cities: ["Montevideo"] },
    { name: "Paysandú", cities: ["Paysandú", "Guichón", "Quebracho"] },
    { name: "Río Negro", cities: ["Fray Bentos", "Young"] },
    { name: "Rivera", cities: ["Rivera", "Tranqueras", "Vichadero"] },
    { name: "Rocha", cities: ["Rocha", "Chuy", "La Paloma", "Castillos", "Lascano"] },
    { name: "Salto", cities: ["Salto", "Constitución"] },
    { name: "San José", cities: ["San José de Mayo", "Ciudad del Plata", "Libertad"] },
    { name: "Soriano", cities: ["Mercedes", "Dolores", "Cardona"] },
    { name: "Tacuarembó", cities: ["Tacuarembó", "Paso de los Toros"] },
    { name: "Treinta y Tres", cities: ["Treinta y Tres", "Vergara"] },
  ],
  AR: [
    {
      name: "Ciudad Autónoma de Buenos Aires",
      cities: ["Buenos Aires (CABA)"],
      jurisdiction: "ar-cpacf",
    },
    {
      name: "Buenos Aires",
      jurisdiction: "ar-pba",
      cities: [
        "La Plata",
        "Mar del Plata",
        "Bahía Blanca",
        "Tandil",
        "San Nicolás",
        "Quilmes",
        "Lomas de Zamora",
        "San Isidro",
        "Vicente López",
        "Morón",
        "Pergamino",
        "Junín",
        "Olavarría",
        "Necochea",
        "Avellaneda",
      ],
    },
    { name: "Catamarca", jurisdiction: "ar-catamarca", cities: ["San Fernando del Valle de Catamarca"] },
    { name: "Chaco", jurisdiction: "ar-chaco", cities: ["Resistencia", "Presidencia Roque Sáenz Peña", "Barranqueras"] },
    { name: "Chubut", jurisdiction: "ar-chubut", cities: ["Rawson", "Comodoro Rivadavia", "Trelew", "Puerto Madryn", "Esquel"] },
    { name: "Córdoba", jurisdiction: "ar-cordoba", cities: ["Córdoba", "Río Cuarto", "Villa María", "San Francisco", "Villa Carlos Paz"] },
    { name: "Corrientes", jurisdiction: "ar-corrientes", cities: ["Corrientes", "Goya", "Paso de los Libres", "Mercedes"] },
    { name: "Entre Ríos", jurisdiction: "ar-entre-rios", cities: ["Paraná", "Concordia", "Gualeguaychú", "Concepción del Uruguay"] },
    { name: "Formosa", jurisdiction: "ar-formosa", cities: ["Formosa", "Clorinda"] },
    { name: "Jujuy", jurisdiction: "ar-jujuy", cities: ["San Salvador de Jujuy", "Palpalá", "Libertador General San Martín"] },
    { name: "La Pampa", jurisdiction: "ar-la-pampa", cities: ["Santa Rosa", "General Pico"] },
    { name: "La Rioja", jurisdiction: "ar-la-rioja", cities: ["La Rioja", "Chilecito"] },
    { name: "Mendoza", jurisdiction: "ar-mendoza", cities: ["Mendoza", "San Rafael", "Godoy Cruz", "Maipú", "Luján de Cuyo", "San Martín"] },
    { name: "Misiones", jurisdiction: "ar-misiones", cities: ["Posadas", "Oberá", "Eldorado", "Puerto Iguazú"] },
    { name: "Neuquén", jurisdiction: "ar-neuquen", cities: ["Neuquén", "Cutral Có", "Plottier", "San Martín de los Andes"] },
    { name: "Río Negro", jurisdiction: "ar-rio-negro", cities: ["Viedma", "San Carlos de Bariloche", "General Roca", "Cipolletti"] },
    { name: "Salta", jurisdiction: "ar-salta", cities: ["Salta", "San Ramón de la Nueva Orán", "Tartagal"] },
    { name: "San Juan", jurisdiction: "ar-san-juan", cities: ["San Juan", "Rivadavia", "Rawson", "Chimbas"] },
    { name: "San Luis", jurisdiction: "ar-san-luis", cities: ["San Luis", "Villa Mercedes", "Merlo"] },
    { name: "Santa Cruz", jurisdiction: "ar-santa-cruz", cities: ["Río Gallegos", "Caleta Olivia", "El Calafate"] },
    { name: "Santa Fe", jurisdiction: "ar-santa-fe", cities: ["Santa Fe", "Rosario", "Rafaela", "Venado Tuerto", "Reconquista"] },
    { name: "Santiago del Estero", jurisdiction: "ar-santiago-del-estero", cities: ["Santiago del Estero", "La Banda", "Termas de Río Hondo"] },
    { name: "Tierra del Fuego", jurisdiction: "ar-tierra-del-fuego", cities: ["Ushuaia", "Río Grande"] },
    { name: "Tucumán", jurisdiction: "ar-tucuman", cities: ["San Miguel de Tucumán", "Yerba Buena", "Concepción", "Tafí Viejo"] },
  ],
};

export function regionsOf(country: "UY" | "AR"): Region[] {
  return GEOGRAPHY[country] ?? GEOGRAPHY.UY;
}

export function citiesOf(country: "UY" | "AR", regionName: string): string[] {
  return regionsOf(country).find((r) => r.name === regionName)?.cities ?? [];
}

export function regionByName(country: "UY" | "AR", regionName: string): Region | undefined {
  return regionsOf(country).find((r) => r.name === regionName);
}

/** Etiqueta del nivel 1 según el país. */
export function regionLabel(country: "UY" | "AR"): string {
  return country === "UY" ? "Departamento" : "Provincia";
}

/** Reverse-lookup: la región (departamento/provincia) que contiene una ciudad. */
export function provinceOfCity(country: "UY" | "AR", city: string): string | undefined {
  return regionsOf(country).find((r) => r.cities.includes(city))?.name;
}
