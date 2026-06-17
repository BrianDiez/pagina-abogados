import { DEMO_MODE } from "@/lib/backend";
import { apiFetch } from "@/lib/http";
import type { Appointment } from "@/types";

export interface MpStatus {
  configured: boolean; // ¿la plataforma tiene MP integrado?
  connected: boolean; // ¿este profesional conectó su cuenta?
  mpUserId?: string | null;
  connectedAt?: string | null;
}

export async function getMpStatus(): Promise<MpStatus> {
  if (DEMO_MODE) return { configured: false, connected: false };
  return apiFetch<MpStatus>("/api/mp/status", { auth: true });
}

/** Inicia el flujo OAuth: redirige al profesional a MercadoPago. */
export async function connectMercadoPago(): Promise<void> {
  const { url } = await apiFetch<{ url: string }>("/api/mp/connect", { auth: true });
  window.location.href = url;
}

export async function disconnectMercadoPago(): Promise<void> {
  await apiFetch("/api/mp/status", { method: "POST", auth: true });
}

interface PreferenceResult {
  initPoint?: string;
  fallback?: boolean;
}

/** Crea la preferencia de pago. Devuelve initPoint (ir a MP) o fallback (demo). */
export async function createPaymentPreference(appointmentId: string): Promise<PreferenceResult> {
  return apiFetch<PreferenceResult>("/api/payments/create", {
    method: "POST",
    body: JSON.stringify({ appointmentId }),
  });
}

/** Estado público de un turno (pantalla de retorno desde MercadoPago). */
export async function getBookingStatus(id: string): Promise<Partial<Appointment> & {
  serviceName?: string;
  lawyerName?: string;
  lawyerSlug?: string;
}> {
  const row = await apiFetch<Record<string, unknown>>(`/api/bookings?id=${id}`);
  return {
    id: String(row.id),
    status: row.status as Appointment["status"],
    paymentStatus: row.payment_status as Appointment["paymentStatus"],
    startsAt: String(row.starts_at),
    modality: row.modality as Appointment["modality"],
    price: Number(row.price),
    currency: String(row.currency),
    videoRoomUrl: (row.video_room_url as string) ?? undefined,
    serviceName: (row.service_name as string) ?? undefined,
    lawyerName: (row.lawyer_name as string) ?? undefined,
    lawyerSlug: (row.lawyer_slug as string) ?? undefined,
  };
}
