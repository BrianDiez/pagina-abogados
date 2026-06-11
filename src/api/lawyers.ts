import { DEMO_MODE } from "@/lib/backend";
import { apiFetch } from "@/lib/http";
import { delay, getDB, persist, uid } from "@/data/demo/store";
import { mapLawyer, mapReview, mapService } from "./mappers";
import type { DirectoryFilters, Lawyer, Review, Service, WeeklyAvailability } from "@/types";

export interface LawyerWithPrice extends Lawyer {
  minPrice?: { amount: number; currency: string };
  availableToday?: boolean;
}

// Bundle del perfil (modo neon): un solo fetch trae profesional + servicios +
// reseñas + disponibilidad; se cachea por id para getServices/listReviews.
interface ProfileBundle {
  lawyer: Record<string, unknown>;
  services: Record<string, unknown>[];
  reviews: Record<string, unknown>[];
  availability: { day_of_week: number; start_time: string; end_time: string }[];
  firm: { id: string; slug: string; name: string; logo_url: string | null } | null;
}
const bundleCache = new Map<string, ProfileBundle>();

async function fetchBundle(slugOrId: string): Promise<ProfileBundle | null> {
  try {
    const bundle = await apiFetch<ProfileBundle>(`/api/lawyers/${slugOrId}`);
    bundleCache.set(String(bundle.lawyer.id), bundle);
    return bundle;
  } catch {
    return null;
  }
}

export function getCachedFirm(lawyerId: string) {
  return bundleCache.get(lawyerId)?.firm ?? null;
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
    const params = new URLSearchParams();
    if (filters.specialty) params.set("especialidad", filters.specialty);
    if (filters.city) params.set("ciudad", filters.city);
    if (filters.modality) params.set("modalidad", filters.modality);
    if (filters.professionalType) params.set("tipo", filters.professionalType);
    if (filters.query) params.set("q", filters.query);
    const rows = await apiFetch<Record<string, unknown>[]>(`/api/lawyers?${params}`);
    let result = rows.map(mapLawyer);
    switch (filters.sort) {
      case "consultations":
        result = result.sort(
          (a, b) => b.stats.completedConsultations - a.stats.completedConsultations,
        );
        break;
      case "price_asc":
        result = result.sort(
          (a, b) => (a.minPrice?.amount ?? Infinity) - (b.minPrice?.amount ?? Infinity),
        );
        break;
      case "price_desc":
        result = result.sort((a, b) => (b.minPrice?.amount ?? 0) - (a.minPrice?.amount ?? 0));
        break;
    }
    return result;
  }

  let result: LawyerWithPrice[] = getDB().lawyers.map((l) => ({
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
  result.sort((a, b) => Number(b.isVerified) - Number(a.isVerified));

  return delay(result);
}

export async function getLawyerBySlug(slug: string): Promise<LawyerWithPrice | null> {
  if (!DEMO_MODE) {
    const bundle = await fetchBundle(slug);
    if (!bundle) return null;
    const lawyer = mapLawyer(bundle.lawyer);
    const services = bundle.services.map(mapService);
    if (services.length > 0) {
      const cheapest = services.reduce((a, b) => (a.price <= b.price ? a : b));
      lawyer.minPrice = { amount: cheapest.price, currency: cheapest.currency };
    }
    const dow = new Date().getDay();
    lawyer.availableToday = bundle.availability.some((a) => a.day_of_week === dow);
    return lawyer;
  }
  const lawyer = getDB().lawyers.find((l) => l.slug === slug) ?? null;
  return delay(
    lawyer
      ? { ...lawyer, minPrice: minPriceOf(lawyer.id), availableToday: hasAvailabilityToday(lawyer.id) }
      : null,
  );
}

export async function getLawyerById(id: string): Promise<Lawyer | null> {
  if (!DEMO_MODE) {
    const cached = bundleCache.get(id);
    if (cached) return mapLawyer(cached.lawyer);
    const bundle = await fetchBundle(id);
    return bundle ? mapLawyer(bundle.lawyer) : null;
  }
  return delay(getDB().lawyers.find((l) => l.id === id) ?? null, 80);
}

export async function getServices(lawyerId: string): Promise<Service[]> {
  if (!DEMO_MODE) {
    const cached = bundleCache.get(lawyerId) ?? (await fetchBundle(lawyerId));
    return (cached?.services ?? []).map(mapService);
  }
  return delay(getDB().services.filter((s) => s.lawyerId === lawyerId && s.isActive));
}

export async function getLawyerReviews(lawyerId: string): Promise<Review[]> {
  const cached = bundleCache.get(lawyerId) ?? (await fetchBundle(lawyerId));
  return (cached?.reviews ?? []).map((r) => mapReview({ ...r, lawyer_id: lawyerId }));
}

export async function getAvailability(lawyerId: string): Promise<WeeklyAvailability[]> {
  if (!DEMO_MODE) {
    const cached = bundleCache.get(lawyerId) ?? (await fetchBundle(lawyerId));
    return (cached?.availability ?? []).map((a, i) => ({
      id: `av-${i}`,
      lawyerId,
      dayOfWeek: a.day_of_week,
      startTime: a.start_time.slice(0, 5),
      endTime: a.end_time.slice(0, 5),
      isActive: true,
    }));
  }
  return delay(getDB().availability.filter((a) => a.lawyerId === lawyerId), 100);
}

// ── Mutaciones del panel del profesional ──

export async function updateLawyerProfile(id: string, patch: Partial<Lawyer>): Promise<Lawyer> {
  if (!DEMO_MODE) {
    const row = await apiFetch<Record<string, unknown>>("/api/me/profile", {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(patch),
    });
    bundleCache.delete(id);
    return mapLawyer(row);
  }
  const db = getDB();
  const lawyer = db.lawyers.find((l) => l.id === id);
  if (!lawyer) throw new Error("Profesional no encontrado");
  Object.assign(lawyer, patch);
  persist();
  return delay({ ...lawyer });
}

export async function createService(data: Omit<Service, "id">): Promise<Service> {
  if (!DEMO_MODE) {
    const row = await apiFetch<Record<string, unknown>>("/api/me/services", {
      method: "POST",
      auth: true,
      body: JSON.stringify(data),
    });
    bundleCache.delete(data.lawyerId);
    return mapService(row);
  }
  const service: Service = { ...data, id: uid("svc") };
  getDB().services.push(service);
  persist();
  return delay(service);
}

export async function updateService(id: string, patch: Partial<Service>): Promise<Service> {
  if (!DEMO_MODE) {
    const row = await apiFetch<Record<string, unknown>>("/api/me/services", {
      method: "PATCH",
      auth: true,
      body: JSON.stringify({ id, ...patch }),
    });
    bundleCache.delete(String(row.lawyer_id));
    return mapService(row);
  }
  const service = getDB().services.find((s) => s.id === id);
  if (!service) throw new Error("Servicio no encontrado");
  Object.assign(service, patch);
  persist();
  return delay({ ...service });
}

export async function deleteService(id: string): Promise<void> {
  if (!DEMO_MODE) {
    await apiFetch<void>(`/api/me/services?id=${id}`, { method: "DELETE", auth: true });
    bundleCache.clear();
    return;
  }
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
  if (!DEMO_MODE) {
    const created = await apiFetch<
      { id: string; day_of_week: number; start_time: string; end_time: string }[]
    >("/api/me/availability", {
      method: "PUT",
      auth: true,
      body: JSON.stringify({
        rows: rows.map((r) => ({
          dayOfWeek: r.dayOfWeek,
          startTime: r.startTime,
          endTime: r.endTime,
        })),
      }),
    });
    bundleCache.delete(lawyerId);
    return created.map((a) => ({
      id: a.id,
      lawyerId,
      dayOfWeek: a.day_of_week,
      startTime: a.start_time.slice(0, 5),
      endTime: a.end_time.slice(0, 5),
      isActive: true,
    }));
  }
  const db = getDB();
  db.availability = db.availability.filter((a) => a.lawyerId !== lawyerId);
  const created = rows.map((r) => ({ ...r, id: uid("av"), lawyerId }));
  db.availability.push(...created);
  persist();
  return delay(created);
}
