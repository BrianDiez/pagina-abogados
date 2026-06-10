import { addDays } from "date-fns";
import { DEMO_MODE } from "@/lib/demo";
import { getSupabase } from "@/lib/supabase";
import { generateSlots } from "@/lib/slots";
import { delay, getDB, persist, uid } from "@/data/demo/store";
import type { Appointment, AppointmentStatus, Slot } from "@/types";

export async function getAvailableSlots(
  lawyerId: string,
  serviceId: string,
  from: Date,
  days: number,
): Promise<Slot[]> {
  if (!DEMO_MODE) {
    const { data, error } = await getSupabase().rpc("get_available_slots", {
      p_lawyer_id: lawyerId,
      p_service_id: serviceId,
      p_from: from.toISOString().slice(0, 10),
      p_to: addDays(from, days).toISOString().slice(0, 10),
    });
    if (error) throw error;
    return (data as { slot_start: string; slot_end: string }[]).map((r) => ({
      start: r.slot_start,
      end: r.slot_end,
    }));
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

/** Crea el turno en pending_payment y devuelve el appointment. El pago lo confirma. */
export async function createBooking(input: BookingInput): Promise<Appointment> {
  const db = getDB();
  const service = db.services.find((s) => s.id === input.serviceId);
  if (!service) throw new Error("Servicio no encontrado");

  // revalidar que el slot siga libre (la BD real lo garantiza con el exclusion constraint)
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

/** Simula el pago (en producción: redirección a MercadoPago + webhook).
 *  Las consultas gratuitas se confirman directo, sin pasarela. */
export async function payAppointment(id: string): Promise<Appointment> {
  const db = getDB();
  const appointment = db.appointments.find((a) => a.id === id);
  if (!appointment) throw new Error("Turno no encontrado");
  appointment.status = "confirmed";
  appointment.paymentStatus = appointment.price === 0 ? "waived" : "paid";
  if (appointment.modality === "video") {
    appointment.videoRoomUrl = `https://legalhub.daily.co/demo-${appointment.id}`;
  }
  persist();
  return delay({ ...appointment }, 900); // latencia de pasarela simulada
}

export async function listLawyerAppointments(lawyerId: string): Promise<Appointment[]> {
  const list = getDB()
    .appointments.filter((a) => a.lawyerId === lawyerId)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return delay(list.map((a) => ({ ...a })));
}

export async function listClientAppointments(clientId: string): Promise<Appointment[]> {
  const db = getDB();
  const list = db.appointments
    .filter((a) => a.clientId === clientId)
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
    .map((a) => {
      const lawyer = db.lawyers.find((l) => l.id === a.lawyerId);
      // lawyer_notes nunca viaja al cliente (en BD: vista appointments_client_view)
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
  const appointment = getDB().appointments.find((a) => a.id === id);
  if (!appointment) throw new Error("Turno no encontrado");
  Object.assign(appointment, patch);
  persist();
  return delay({ ...appointment });
}
