// Estudios jurídicos. Regla de notificación clave del producto:
//  - Reserva en el perfil INDIVIDUAL de un abogado → se notifica solo al abogado.
//  - Consulta en el perfil del ESTUDIO → se notifica al estudio (bandeja + email en Fase 2).
import { delay, getDB, persist, uid } from "@/data/demo/store";
import type { Firm, FirmInquiry, Lawyer } from "@/types";

export async function listFirms(): Promise<Firm[]> {
  return delay(getDB().firms.map((f) => ({ ...f })));
}

export async function getFirmBySlug(slug: string): Promise<Firm | null> {
  const firm = getDB().firms.find((f) => f.slug === slug) ?? null;
  return delay(firm ? { ...firm } : null);
}

export async function getFirmMembers(firmId: string): Promise<Lawyer[]> {
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

export async function createFirm(input: CreateFirmInput): Promise<Firm> {
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
  const firm = getDB().firms.find((f) => f.id === id);
  if (!firm) throw new Error("Estudio no encontrado");
  Object.assign(firm, patch);
  persist();
  return delay({ ...firm });
}

export async function addFirmMember(firmId: string, lawyerId: string): Promise<Firm> {
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

export async function createFirmInquiry(
  input: Omit<FirmInquiry, "id" | "isRead" | "createdAt">,
): Promise<FirmInquiry> {
  const inquiry: FirmInquiry = {
    ...input,
    id: uid("inq"),
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  getDB().firmInquiries.push(inquiry);
  persist();
  // Fase 2: edge function -> email a firm.email + miembros via Resend
  return delay({ ...inquiry }, 500);
}

export async function listFirmInquiries(firmId: string): Promise<FirmInquiry[]> {
  return delay(
    getDB()
      .firmInquiries.filter((i) => i.firmId === firmId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((i) => ({ ...i })),
  );
}

export async function markInquiryRead(id: string): Promise<void> {
  const inquiry = getDB().firmInquiries.find((i) => i.id === id);
  if (inquiry) {
    inquiry.isRead = true;
    persist();
  }
  return delay(undefined, 100);
}
