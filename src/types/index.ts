export type ProfessionalType = "lawyer" | "notary" | "tax_advisor" | "other";
export type Modality = "video" | "in_person" | "phone" | "async";
export type Plan = "free" | "essential" | "professional" | "studio" | "enterprise";
export type AppointmentStatus =
  | "pending_payment"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";
export type PaymentStatus = "pending" | "paid" | "refunded" | "partial_refund" | "waived";

/** Matrícula en una jurisdicción (en AR un abogado suele tener varias). */
export interface ProfessionalRegistration {
  jurisdictionId: string; // ver src/lib/jurisdictions.ts
  number: string;
}

export interface LawyerStats {
  avgRating: number | null;
  reviewCount: number;
  completedConsultations: number;
  recommendPct: number | null;
}

export interface Lawyer {
  id: string;
  slug: string;
  displayName: string;
  title: string; // 'Dr.' | 'Dra.' | 'Esc.'
  professionalType: ProfessionalType;
  bio: string;
  photoUrl: string | null;
  yearsExperience: number;
  /** String visible compuesto ("CPACF T°89 F°412 · Fed. …"). */
  matriculaNumber: string;
  /** Detalle por jurisdicción (fuente de verdad del string anterior). */
  registrations?: ProfessionalRegistration[];
  isVerified: boolean;
  country: "UY" | "AR";
  /** departamento (UY) o provincia (AR) */
  province?: string;
  city: string;
  languages: string[];
  specialties: string[]; // ids de ramas (LEGAL_AREAS)
  topics?: string[]; // temas opcionales dentro de las ramas
  modalities: Modality[];
  highlights: string[]; // formación / posgrados / especializaciones
  plan: Plan;
  acceptsNewClients: boolean;
  cancellationPolicyHours: number;
  cancellationLateFeePct: number;
  profileViews: number;
  respondsFast?: boolean;
  stats: LawyerStats;
}

export interface Service {
  id: string;
  lawyerId: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  currency: string;
  modality: Modality;
  isActive: boolean;
  maxAdvanceDays: number;
  minAdvanceHours: number;
  breakAfterMinutes: number;
}

export interface WeeklyAvailability {
  id: string;
  lawyerId: string;
  dayOfWeek: number; // 0 = domingo … 6 = sábado
  startTime: string; // "09:00"
  endTime: string; // "13:00"
  isActive: boolean;
}

export interface TimeBlock {
  id: string;
  lawyerId: string;
  startAt: string; // ISO
  endAt: string;
  reason?: string;
}

export interface ClientRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  country?: string;
}

export interface Appointment {
  id: string;
  lawyerId: string;
  clientId: string;
  serviceId: string;
  status: AppointmentStatus;
  startsAt: string; // ISO
  endsAt: string;
  modality: Modality;
  clientNotes?: string;
  lawyerNotes?: string;
  videoRoomUrl?: string;
  price: number;
  currency: string;
  paymentStatus: PaymentStatus;
  cancelledBy?: "lawyer" | "client" | "admin";
  cancellationReason?: string;
  // denormalizado para listados
  clientName?: string;
  clientEmail?: string;
  serviceName?: string;
  lawyerName?: string;
  lawyerSlug?: string;
}

export interface Review {
  id: string;
  lawyerId: string;
  appointmentId: string;
  ratingOverall: number;
  ratingClarity?: number;
  ratingPunctuality?: number;
  ratingKnowledge?: number;
  ratingTreatment?: number;
  textReview: string;
  wouldRecommend: boolean;
  isAnonymous: boolean;
  clientName: string;
  specialtyConsulted?: string;
  lawyerResponse?: string;
  createdAt: string;
}

export interface Slot {
  start: string; // ISO
  end: string;
}

export interface DirectoryFilters {
  query?: string;
  specialty?: string;
  /** departamento (UY) o provincia (AR) */
  province?: string;
  city?: string;
  modality?: Modality;
  professionalType?: ProfessionalType;
  sort?: "rating" | "consultations" | "price_asc" | "price_desc";
}

// ── Estudios jurídicos (modelo LinkedIn: el estudio es una entidad propia) ──

export interface FirmSocials {
  website?: string;
  linkedin?: string;
  instagram?: string;
  x?: string;
}

export interface Firm {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  description: string;
  logoUrl?: string | null;
  city: string;
  country: "UY" | "AR";
  email?: string;
  phone?: string;
  socials: FirmSocials;
  foundedYear?: number;
  specialties: string[];
  ownerLawyerId: string;
  memberIds: string[];
  isVerified: boolean;
}

/** Consulta dirigida AL ESTUDIO (no a un profesional individual).
 *  Regla de notificación: esto notifica al estudio; las reservas hechas en el
 *  perfil individual de un abogado NO se comparten con el estudio. */
export interface FirmInquiry {
  id: string;
  firmId: string;
  name: string;
  email: string;
  phone?: string;
  specialty?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export type Role = "lawyer" | "client" | "admin";

export interface SessionUser {
  id: string;
  role: Role;
  name: string;
  email: string;
  lawyerId?: string; // si role === 'lawyer'
  clientId?: string; // si role === 'client'
}
