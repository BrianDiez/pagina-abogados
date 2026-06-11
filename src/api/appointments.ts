import { addDays } from "date-fns";
import { DEMO_MODE } from "@/lib/backend";
import { apiFetch } from "@/lib/http";
import { generateSlots } from "@/lib/slots";
import { delay, getDB, persist, uid } from "@/data/demo/store";
import type { Appointment, AppointmentStatus, Slot } from "@/types";

function mapAppointmentRow(row: Record<string, unknown>): Appointment {
  return {
    id: String(row.id),
    lawyerId: String(row.lawyer_id),
    clientId: String(row.client_id),
    serviceId: String(row.service_id),
    status: row.status as AppointmentStatus,
    startsAt: String(row.starts_at),
    endsAt: String(row.ends_at),
    modality: row.modality as Appointment["modality"],
    clientNotes: (row.client_notes as string) ?? undefined,
    videoRoomUrl: (row.video_room_url as string) ?? undefined,
    price: Number(row.price),
    currency: String(row.currency),
    paymentStatus: row.payment_status as Appointment["paymentStatus"],
    clientName: (row.client_name as string) ?? undefined,
    clientEmail: (row.client_email as string) ?? undefined,
    serviceName: (row.service_name as string) ?? undefined,
  };
}

export async function getAvailableSlots(
  lawyerId: string,
  serviceId: string,
  from: Date,
  days: number,
): Promise<Slot[]> {
  if (!DEMO_MODE) {
    const params = new URLSearchParams({
      lawyerId,
      serviceId,
      from: from.toISOString().slice(0, 10),
      days: String(days),
    });
    return apiFetch<Slot[]>(`/api/slots?${params}`);
  }

  const db = getDB();
  const service = db.services.find((s) => s.id === serviceId);
  if (!service) return [];
  return delay(
    generateSlots({
      service,
      availability: db.availability.filter((a) => a.lawyerId === lawyerId),
      timeBlocks: db.timeBlocks.filter((t) => t.lawyerId === lawyerId),
      appointments: db.appointments.filter((a) => a.lawyerId === lawyerId),
      from,
      days,
    }),
    300,
  );
}

export interface BookingInput {
  lawyerId: string;
  serviceId: string;
  slot: Slot;
  client: { name: string; email: string; phone: string; country: string };
  notes?: string;
}

/** Crea el turno en pending_payment (o confirmado directo si es gratuito). */
export async function createBooking(input: BookingInput): Promise<Appointment> {
  if (!DEMO_MODE) {
    const row = await apiFetch<Record<string, unknown>>("/api/bookings", {
      method: "POST",
      body: JSON.stringify({
        lawyerId: input.lawyerId,
        serviceId: input.serviceId,
        start: input.slot.start,
        client: input.client,
        notes: input.notes,
      }),
    });
    return { ...mapAppointmentRow(row), clientEmail: input.client.email };
  }

  const db = getDB();
  const service = db.services.find((s) => s.id === input.serviceId);
  if (!service) throw new Error("Servicio no encontrado");

  const clash = db.appointments.some(
    (a) =>
      a.lawyerId === input.lawyerId &&
      (a.status === "confirmed" || a.status === "pending_payment") &&
      new Date(a.startsAt) < new Date(input.slot.end) &&
      new Date(input.slot.start) < new Date(a.endsAt),
  );
  if (clash) throw new Error("Ese horario acaba de ser reservado. Elegí otro, por favor.");

  let client = db.clients.find((c) => c.email.toLowerCase() === input.client.email.toLowerCase());
  if (!client) {
    client = { id: uid("cli"), ...input.client };
    db.clients.push(client);
  }

  const appointment: Appointment = {
    id: uid("apt"),
    lawyerId: input.lawyerId,
    clientId: client.id,
    serviceId: service.id,
    status: "pending_payment",
    startsAt: input.slot.start,
    endsAt: input.slot.end,
    modality: service.modality,
    clientNotes: input.notes,
    price: service.price,
    currency: service.currency,
    paymentStatus: "pending",
    clientName: client.name,
    clientEmail: client.email,
    serviceName: service.name,
  };
  db.appointments.push(appointment);
  persist();
  return delay({ ...appointment }, 400);
}

/** Pago: gateway 'demo' hasta integrar MercadoPago (split de pagos). */
export async function payAppointment(id: string): Promise<Appointment> {
  if (!DEMO_MODE) {
    const row = await apiFetch<Record<string, unknown>>(
      `/api/bookings?id=${id}&action=demo-pay`,
      { method: "PATCH" },
    );
    return mapAppointmentRow(row);
  }

  const db = getDB();
  const appointment = db.appointments.find((a) => a.id === id);
  if (!appointment) throw new Error("Turno no encontrado");
  appointment.status = "confirmed";
  appointment.paymentStatus = appointment.price === 0 ? "waived" : "paid";
  if (appointment.modality === "video") {
    appointment.videoRoomUrl = `https://legalhub.daily.co/demo-${appointment.id}`;
  }
  persist();
  return delay({ ...appointment }, 900);
}

export async function listLawyerAppointments(lawyerId: string): Promise<Appointment[]> {
  if (!DEMO_MODE) {
    const rows = await apiFetch<Record<string, unknown>[]>("/api/me/appointments", {
      auth: true,
    });
    return rows.map((r) => ({
      ...mapAppointmentRow(r),
      lawyerNotes: (r.lawyer_notes as string) ?? undefined,
    }));
  }
  const list = getDB()
    .appointments.filter((a) => a.lawyerId === lawyerId)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return delay(list.map((a) => ({ ...a })));
}

export async function listClientAppointments(clientId: string): Promise<Appointment[]> {
  if (!DEMO_MODE) {
    const rows = await apiFetch<Record<string, unknown>[]>("/api/me/bookings", { auth: true });
    return rows.map((r) => ({
      ...mapAppointmentRow(r),
      lawyerName: (r.lawyer_name as string) ?? undefined,
      lawyerSlug: (r.lawyer_slug as string) ?? undefined,
    }));
  }
  const db = getDB();
  const list = db.appointments
    .filter((a) => a.clientId === clientId)
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
    .map((a) => {
      const lawyer = db.lawyers.find((l) => l.id === a.lawyerId);
      const { lawyerNotes: _private, ...visible } = a;
      return { ...visible, lawyerName: lawyer?.displayName, lawyerSlug: lawyer?.slug };
    });
  return delay(list);
}

export async function updateAppointment(
  id: string,
  patch: Partial<Pick<Appointment, "status" | "lawyerNotes" | "cancelledBy">> & {
    status?: AppointmentStatus;
    cancelledBy?: "lawyer" | "client";
  },
): Promise<Appointment> {
  if (!DEMO_MODE) {
    const row = await apiFetch<Record<string, unknown>>("/api/me/appointments", {
      method: "PATCH",
      auth: true,
      body: JSON.stringify({ id, ...patch }),
    });
    return mapAppointmentRow(row);
  }
  const appointment = getDB().appointments.find((a) => a.id === id);
  if (!appointment) throw new Error("Turno no encontrado");
  Object.assign(appointment, patch);
  persist();
  return delay({ ...appointment });
}
