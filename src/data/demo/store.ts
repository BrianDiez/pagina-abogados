// Store en memoria + localStorage para el modo demo.
// Las mutaciones (turnos creados, servicios editados…) sobreviven al refresh;
// la semilla se regenera cada 24h para que la agenda demo nunca quede vieja.
import type {
  Appointment,
  ClientRecord,
  Firm,
  FirmInquiry,
  Lawyer,
  Review,
  Service,
  TimeBlock,
  WeeklyAvailability,
} from "@/types";
import { normalizeAreaId } from "@/lib/constants";
import { provinceOfCity } from "@/lib/geography";
import {
  seedAppointments,
  seedAvailability,
  seedClients,
  seedFirmInquiries,
  seedFirms,
  seedLawyers,
  seedReviews,
  seedServices,
  seedTimeBlocks,
} from "./seed";

// Deriva la región (departamento/provincia) desde la ciudad de cada seed,
// así el directorio demo filtra por provincia sin duplicar el dato en la semilla.
function withProvince(lawyers: Lawyer[]): Lawyer[] {
  return lawyers.map((l) => ({
    ...l,
    province: l.province ?? provinceOfCity(l.country, l.city),
    // migra ids viejos de ramas (inmobiliario→civil, sucesiones→sucesorio…) y dedupe
    specialties: [...new Set(l.specialties.map(normalizeAreaId))],
  }));
}

interface DemoDB {
  seededAt: number;
  lawyers: Lawyer[];
  services: Service[];
  availability: WeeklyAvailability[];
  timeBlocks: TimeBlock[];
  clients: ClientRecord[];
  appointments: Appointment[];
  reviews: Review[];
  firms: Firm[];
  firmInquiries: FirmInquiry[];
}

// v5: taxonomía ramas→temas (ids de especialidad migrados)
const KEY = "legalhub-demo-db-v5";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function freshDB(): DemoDB {
  return {
    seededAt: Date.now(),
    lawyers: withProvince(structuredClone(seedLawyers)),
    services: structuredClone(seedServices),
    availability: structuredClone(seedAvailability),
    timeBlocks: structuredClone(seedTimeBlocks),
    clients: structuredClone(seedClients),
    appointments: structuredClone(seedAppointments),
    reviews: structuredClone(seedReviews),
    firms: structuredClone(seedFirms),
    firmInquiries: structuredClone(seedFirmInquiries),
  };
}

let db: DemoDB | null = null;

export function getDB(): DemoDB {
  if (db) return db;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoDB;
      if (Date.now() - parsed.seededAt < MAX_AGE_MS && parsed.firms) {
        db = parsed;
        return db;
      }
    }
  } catch {
    // semilla corrupta -> regenerar
  }
  db = freshDB();
  persist();
  return db;
}

export function persist() {
  if (db) localStorage.setItem(KEY, JSON.stringify(db));
}

export function resetDemoDB() {
  db = freshDB();
  persist();
}

export function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Simula latencia de red para que los estados de carga sean visibles/realistas. */
export function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
