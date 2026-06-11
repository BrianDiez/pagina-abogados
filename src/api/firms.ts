// Estudios jurídicos. Regla de notificación clave del producto:
//  - Reserva en el perfil INDIVIDUAL de un abogado → se notifica solo al abogado.
//  - Consulta en el perfil del ESTUDIO → se notifica al estudio (bandeja + email en Fase 2).
import { DEMO_MODE } from "@/lib/backend";
import { apiFetch } from "@/lib/http";
import { delay, getDB, persist, uid } from "@/data/demo/store";
import { getCachedFirm, getLawyerById } from "./lawyers";
import { mapLawyer } from "./mappers";
import type { Firm, FirmInquiry, Lawyer } from "@/types";

type Row = Record<string, unknown>;

function mapFirm(row: Row, memberIds: string[] = []): Firm {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    tagline: (row.tagline as string) ?? undefined,
    description: String(row.description ?? ""),
    logoUrl: (row.logo_url as string | null) ?? null,
    city: String(row.city ?? ""),
    country: (row.country as "UY" | "AR") ?? "UY",
    email: (row.email as string) ?? undefined,
    phone: (row.phone as string) ?? undefined,
    socials: {
      website: (row.website_url as string) ?? undefined,
      linkedin: (row.linkedin_url as string) ?? undefined,
      instagram: (row.instagram_url as string) ?? undefined,
      x: (row.x_url as string) ?? undefined,
    },
    foundedYear: row.founded_year ? Number(row.founded_year) : undefined,
    specialties: (row.specialties as string[]) ?? [],
    ownerLawyerId: String(row.owner_lawyer_id ?? ""),
    memberIds:
      memberIds.length > 0
        ? memberIds
        : Array.from({ length: Number(row.member_count ?? 0) }, (_, i) => `m${i}`),
    isVerified: Boolean(row.is_verified),
  };
}

// cache del bundle de estudio (firm + members) por slug e id
interface FirmBundle {
  firm: Row;
  members: Row[];
}
const firmCache = new Map<string, FirmBundle>();

async function fetchFirmBundle(slugOrId: string): Promise<FirmBundle | null> {
  const cached = firmCache.get(slugOrId);
  if (cached) return cached;
  try {
    const bundle = await apiFetch<FirmBundle>(`/api/firms/${slugOrId}`);
    firmCache.set(String(bundle.firm.slug), bundle);
    firmCache.set(String(bundle.firm.id), bundle);
    return bundle;
  } catch {
    return null;
  }
}

export async function listFirms(): Promise<Firm[]> {
  if (!DEMO_MODE) {
    const rows = await apiFetch<Row[]>("/api/firms");
    return rows.map((r) => mapFirm(r));
  }
  return delay(getDB().firms.map((f) => ({ ...f })));
}

export async function getFirmBySlug(slug: string): Promise<Firm | null> {
  if (!DEMO_MODE) {
    const bundle = await fetchFirmBundle(slug);
    if (!bundle) return null;
    return mapFirm(bundle.firm, bundle.members.map((m) => String(m.id)));
  }
  const firm = getDB().firms.find((f) => f.slug === slug) ?? null;
  return delay(firm ? { ...firm } : null);
}

export async function getFirmMembers(firmId: string): Promise<Lawyer[]> {
  if (!DEMO_MODE) {
    const bundle = await fetchFirmBundle(firmId);
    return (bundle?.members ?? []).map(mapLawyer);
  }
  const db = getDB();
  const firm = db.firms.find((f) => f.id === firmId);
  if (!firm) return [];
  return delay(
    firm.memberIds
      .map((id) => db.lawyers.find((l) => l.id === id))
      .filter((l): l is Lawyer => !!l)
      .map((l) => ({ ...l })),
  );
}

/** El estudio al que pertenece un profesional (afiliación visible en su perfil). */
export async function getLawyerFirm(lawyerId: string): Promise<Firm | null> {
  if (!DEMO_MODE) {
    // el bundle del profesional ya trae la referencia {id, slug, name, logo_url}
    await getLawyerById(lawyerId);
    const ref = getCachedFirm(lawyerId);
    if (!ref) return null;
    return getFirmBySlug(ref.slug);
  }
  const firm = getDB().firms.find((f) => f.memberIds.includes(lawyerId)) ?? null;
  return delay(firm ? { ...firm } : null, 120);
}

export interface CreateFirmInput {
  name: string;
  tagline?: string;
  description: string;
  city: string;
  country: "UY" | "AR";
  email?: string;
  phone?: string;
  socials: Firm["socials"];
  ownerLawyerId: string;
}

function assertDemo(feature: string): void {
  if (!DEMO_MODE) {
    throw new Error(`${feature} via API llega en la siguiente etapa. Probalo en el modo demo.`);
  }
}

export async function createFirm(input: CreateFirmInput): Promise<Firm> {
  assertDemo("La creación de estudios");
  const db = getDB();
  if (db.firms.some((f) => f.memberIds.includes(input.ownerLawyerId))) {
    throw new Error("Ya pertenecés a un estudio. Salí del actual para crear otro.");
  }
  const slugBase = input.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  let slug = slugBase;
  if (db.firms.some((f) => f.slug === slug)) slug = `${slugBase}-${uid("").slice(1, 5)}`;

  const owner = db.lawyers.find((l) => l.id === input.ownerLawyerId);
  const firm: Firm = {
    id: uid("frm"),
    slug,
    name: input.name,
    tagline: input.tagline,
    description: input.description,
    logoUrl: null,
    city: input.city,
    country: input.country,
    email: input.email,
    phone: input.phone,
    socials: input.socials,
    specialties: owner?.specialties ?? [],
    ownerLawyerId: input.ownerLawyerId,
    memberIds: [input.ownerLawyerId],
    isVerified: false,
  };
  db.firms.push(firm);
  persist();
  return delay({ ...firm });
}

export async function updateFirm(id: string, patch: Partial<Firm>): Promise<Firm> {
  assertDemo("La edición de estudios");
  const firm = getDB().firms.find((f) => f.id === id);
  if (!firm) throw new Error("Estudio no encontrado");
  Object.assign(firm, patch);
  persist();
  return delay({ ...firm });
}

export async function addFirmMember(firmId: string, lawyerId: string): Promise<Firm> {
  assertDemo("La gestión de miembros");
  const db = getDB();
  const firm = db.firms.find((f) => f.id === firmId);
  if (!firm) throw new Error("Estudio no encontrado");
  if (db.firms.some((f) => f.memberIds.includes(lawyerId))) {
    throw new Error("Ese profesional ya pertenece a un estudio");
  }
  if (firm.memberIds.length >= 5) {
    throw new Error("El plan Estudio incluye hasta 5 perfiles");
  }
  firm.memberIds.push(lawyerId);
  const lawyer = db.lawyers.find((l) => l.id === lawyerId);
  if (lawyer) {
    firm.specialties = [...new Set([...firm.specialties, ...lawyer.specialties])];
  }
  persist();
  return delay({ ...firm });
}

export async function removeFirmMember(firmId: string, lawyerId: string): Promise<Firm> {
  assertDemo("La gestión de miembros");
  const firm = getDB().firms.find((f) => f.id === firmId);
  if (!firm) throw new Error("Estudio no encontrado");
  if (firm.ownerLawyerId === lawyerId) {
    throw new Error("El dueño no puede salir del estudio (transferí la propiedad primero)");
  }
  firm.memberIds = firm.memberIds.filter((id) => id !== lawyerId);
  persist();
  return delay({ ...firm });
}

// ── Consultas al estudio (la notificación va al estudio, no al individuo) ──

function mapInquiry(row: Row): FirmInquiry {
  return {
    id: String(row.id),
    firmId: String(row.firm_id),
    name: String(row.name),
    email: String(row.email),
    phone: (row.phone as string) ?? undefined,
    specialty: (row.specialty as string) ?? undefined,
    message: String(row.message),
    isRead: Boolean(row.is_read),
    createdAt: String(row.created_at),
  };
}

export async function createFirmInquiry(
  input: Omit<FirmInquiry, "id" | "isRead" | "createdAt">,
): Promise<FirmInquiry> {
  if (!DEMO_MODE) {
    const row = await apiFetch<Row>("/api/firm-inquiries", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return mapInquiry(row);
  }
  const inquiry: FirmInquiry = {
    ...input,
    id: uid("inq"),
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  getDB().firmInquiries.push(inquiry);
  persist();
  return delay({ ...inquiry }, 500);
}

export async function listFirmInquiries(firmId: string): Promise<FirmInquiry[]> {
  if (!DEMO_MODE) {
    const rows = await apiFetch<Row[]>(`/api/firm-inquiries?firmId=${firmId}`, { auth: true });
    return rows.map(mapInquiry);
  }
  return delay(
    getDB()
      .firmInquiries.filter((i) => i.firmId === firmId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((i) => ({ ...i })),
  );
}

export async function markInquiryRead(id: string): Promise<void> {
  if (!DEMO_MODE) {
    await apiFetch<void>("/api/firm-inquiries", {
      method: "PATCH",
      auth: true,
      body: JSON.stringify({ id }),
    });
    return;
  }
  const inquiry = getDB().firmInquiries.find((i) => i.id === id);
  if (inquiry) {
    inquiry.isRead = true;
    persist();
  }
  return delay(undefined, 100);
}
