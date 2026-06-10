// Mapeo de filas snake_case de la API Neon a los tipos camelCase del dominio.
import type { Lawyer, Review, Service } from "@/types";
import type { LawyerWithPrice } from "./lawyers";

type Row = Record<string, unknown>;

export function mapLawyer(row: Row): LawyerWithPrice {
  return {
    id: String(row.id),
    slug: String(row.slug),
    displayName: String(row.display_name),
    title: String(row.title ?? ""),
    professionalType: row.professional_type as Lawyer["professionalType"],
    bio: String(row.bio ?? ""),
    photoUrl: (row.photo_url as string | null) ?? null,
    yearsExperience: Number(row.years_experience ?? 0),
    matriculaNumber: String(row.matricula_number ?? ""),
    isVerified: Boolean(row.is_verified),
    country: (row.country as "UY" | "AR") ?? "UY",
    city: String(row.city ?? ""),
    languages: (row.languages as string[]) ?? [],
    specialties: (row.specialties as string[]) ?? [],
    modalities: (row.modalities as Lawyer["modalities"]) ?? [],
    highlights: (row.highlights as string[]) ?? [],
    plan: (row.plan as Lawyer["plan"]) ?? "free",
    acceptsNewClients: Boolean(row.accepts_new_clients ?? true),
    cancellationPolicyHours: Number(row.cancellation_policy_hours ?? 24),
    cancellationLateFeePct: Number(row.cancellation_late_fee_pct ?? 0),
    profileViews: Number(row.profile_views ?? 0),
    stats: {
      avgRating: row.avg_rating === null ? null : Number(row.avg_rating),
      reviewCount: Number(row.review_count ?? 0),
      completedConsultations: Number(row.completed_consultations ?? 0),
      recommendPct: row.recommend_pct === null ? null : Number(row.recommend_pct),
    },
    minPrice:
      row.min_price !== null && row.min_price !== undefined
        ? { amount: Number(row.min_price), currency: String(row.min_price_currency ?? "UYU") }
        : undefined,
    availableToday: Boolean(row.available_today),
  };
}

export function mapService(row: Row): Service {
  return {
    id: String(row.id),
    lawyerId: String(row.lawyer_id),
    name: String(row.name),
    description: String(row.description ?? ""),
    durationMinutes: Number(row.duration_minutes),
    price: Number(row.price),
    currency: String(row.currency),
    modality: row.modality as Service["modality"],
    isActive: Boolean(row.is_active),
    maxAdvanceDays: Number(row.max_advance_days ?? 60),
    minAdvanceHours: Number(row.min_advance_hours ?? 2),
    breakAfterMinutes: Number(row.break_after_minutes ?? 0),
  };
}

export function mapReview(row: Row): Review {
  return {
    id: String(row.id),
    lawyerId: String(row.lawyer_id ?? ""),
    appointmentId: String(row.appointment_id ?? ""),
    ratingOverall: Number(row.rating_overall),
    textReview: String(row.text_review ?? ""),
    wouldRecommend: Boolean(row.would_recommend),
    isAnonymous: false,
    clientName: String(row.client_name ?? "Cliente"),
    specialtyConsulted: (row.specialty_consulted as string) ?? undefined,
    lawyerResponse: (row.lawyer_response as string) ?? undefined,
    createdAt: String(row.created_at),
  };
}
