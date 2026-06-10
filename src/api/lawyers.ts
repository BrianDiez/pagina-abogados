import { DEMO_MODE } from "@/lib/demo";
import { getSupabase } from "@/lib/supabase";
import { delay, getDB, persist, uid } from "@/data/demo/store";
import type { DirectoryFilters, Lawyer, Service, WeeklyAvailability } from "@/types";

export interface LawyerWithPrice extends Lawyer {
  minPrice?: { amount: number; currency: string };
  availableToday?: boolean;
}

function minPriceOf(lawyerId: string): { amount: number; currency: string } | undefined {
  const services = getDB().services.filter((s) => s.lawyerId === lawyerId && s.isActive);
  if (services.length === 0) return undefined;
  const cheapest = services.reduce((a, b) => (a.price <= b.price ? a : b));
  return { amount: cheapest.price, currency: cheapest.currency };
}

function hasAvailabilityToday(lawyerId: string): boolean {
  const dow = new Date().getDay();
  return getDB().availability.some(
    (a) => a.lawyerId === lawyerId && a.isActive && a.dayOfWeek === dow,
  );
}

export async function listLawyers(filters: DirectoryFilters = {}): Promise<LawyerWithPrice[]> {
  if (!DEMO_MODE) {
    // Fase 2: query a Supabase con lawyer_stats join
    const { data, error } = await getSupabase()
      .from("lawyers")
      .select("*")
      .eq("is_active", true);
    if (error) throw error;
    return data as unknown as LawyerWithPrice[];
  }

  let result: LawyerWithPrice[] = getDB()
    .lawyers.filter((l) => l.plan !== undefined)
    .map((l) => ({
      ...l,
      minPrice: minPriceOf(l.id),
      availableToday: hasAvailabilityToday(l.id) && l.acceptsNewClients,
    }));

  const { query, specialty, city, modality, professionalType, sort } = filters;
  if (query) {
    const q = query.toLowerCase();
    result = result.filter(
      (l) =>
        l.displayName.toLowerCase().includes(q) ||
        l.bio.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q),
    );
  }
  if (specialty) result = result.filter((l) => l.specialties.includes(specialty));
  if (city) result = result.filter((l) => l.city === city);
  if (modality) result = result.filter((l) => l.modalities.includes(modality));
  if (professionalType) result = result.filter((l) => l.professionalType === professionalType);

  switch (sort) {
    case "consultations":
      result.sort((a, b) => b.stats.completedConsultations - a.stats.completedConsultations);
      break;
    case "price_asc":
      result.sort((a, b) => (a.minPrice?.amount ?? Infinity) - (b.minPrice?.amount ?? Infinity));
      break;
    case "price_desc":
      result.sort((a, b) => (b.minPrice?.amount ?? 0) - (a.minPrice?.amount ?? 0));
      break;
    case "rating":
    default:
      result.sort(
        (a, b) =>
          (b.stats.avgRating ?? 0) * Math.log10(b.stats.reviewCount + 1) -
          (a.stats.avgRating ?? 0) * Math.log10(a.stats.reviewCount + 1),
      );
  }
  // Los verificados siempre arriba de los no verificados
  result.sort((a, b) => Number(b.isVerified) - Number(a.isVerified));

  return delay(result);
}

export async function getLawyerBySlug(slug: string): Promise<LawyerWithPrice | null> {
  if (!DEMO_MODE) {
    const { data, error } = await getSupabase()
      .from("lawyers")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return data as unknown as LawyerWithPrice | null;
  }
  const lawyer = getDB().lawyers.find((l) => l.slug === slug) ?? null;
  return delay(
    lawyer
      ? { ...lawyer, minPrice: minPriceOf(lawyer.id), availableToday: hasAvailabilityToday(lawyer.id) }
      : null,
  );
}

export async function getLawyerById(id: string): Promise<Lawyer | null> {
  return delay(getDB().lawyers.find((l) => l.id === id) ?? null, 80);
}

export async function getServices(lawyerId: string): Promise<Service[]> {
  if (!DEMO_MODE) {
    const { data, error } = await getSupabase()
      .from("services")
      .select("*")
      .eq("lawyer_id", lawyerId)
      .eq("is_active", true);
    if (error) throw error;
    return data as unknown as Service[];
  }
  return delay(getDB().services.filter((s) => s.lawyerId === lawyerId && s.isActive));
}

export async function getAvailability(lawyerId: string): Promise<WeeklyAvailability[]> {
  return delay(getDB().availability.filter((a) => a.lawyerId === lawyerId), 100);
}

// ── Mutaciones del panel profesional (demo; Fase 2 → Supabase) ──

export async function updateLawyerProfile(id: string, patch: Partial<Lawyer>): Promise<Lawyer> {
  const db = getDB();
  const lawyer = db.lawyers.find((l) => l.id === id);
  if (!lawyer) throw new Error("Profesional no encontrado");
  Object.assign(lawyer, patch);
  persist();
  return delay({ ...lawyer });
}

export async function createService(data: Omit<Service, "id">): Promise<Service> {
  const service: Service = { ...data, id: uid("svc") };
  getDB().services.push(service);
  persist();
  return delay(service);
}

export async function updateService(id: string, patch: Partial<Service>): Promise<Service> {
  const service = getDB().services.find((s) => s.id === id);
  if (!service) throw new Error("Servicio no encontrado");
  Object.assign(service, patch);
  persist();
  return delay({ ...service });
}

export async function deleteService(id: string): Promise<void> {
  const service = getDB().services.find((s) => s.id === id);
  if (service) {
    service.isActive = false;
    persist();
  }
  return delay(undefined);
}

export async function saveAvailability(
  lawyerId: string,
  rows: Omit<WeeklyAvailability, "id" | "lawyerId">[],
): Promise<WeeklyAvailability[]> {
  const db = getDB();
  db.availability = db.availability.filter((a) => a.lawyerId !== lawyerId);
  const created = rows.map((r) => ({ ...r, id: uid("av"), lawyerId }));
  db.availability.push(...created);
  persist();
  return delay(created);
}
