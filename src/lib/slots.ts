// Generación de slots disponibles — versión cliente (modo demo).
// En producción la autoridad es la función SQL get_available_slots (misma lógica).
import { addDays, addMinutes, isBefore, isAfter, startOfDay } from "date-fns";
import type { Appointment, Service, Slot, TimeBlock, WeeklyAvailability } from "@/types";

interface SlotInput {
  service: Service;
  availability: WeeklyAvailability[];
  timeBlocks: TimeBlock[];
  appointments: Appointment[]; // solo los del profesional
  from: Date;
  days: number;
  now?: Date;
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return isBefore(aStart, bEnd) && isBefore(bStart, aEnd);
}

function atTime(day: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(day);
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d;
}

export function generateSlots(input: SlotInput): Slot[] {
  const { service, availability, timeBlocks, appointments, from, days } = input;
  const now = input.now ?? new Date();
  const notBefore = addMinutes(now, service.minAdvanceHours * 60);
  const notAfter = addDays(now, service.maxAdvanceDays);

  const activeAppts = appointments.filter(
    (a) => a.status === "confirmed" || a.status === "pending_payment",
  );

  const slots: Slot[] = [];
  for (let i = 0; i < days; i++) {
    const day = startOfDay(addDays(from, i));
    const windows = availability
      .filter((w) => w.isActive && w.dayOfWeek === day.getDay())
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    for (const win of windows) {
      let cursor = atTime(day, win.startTime);
      const windowEnd = atTime(day, win.endTime);

      while (!isAfter(addMinutes(cursor, service.durationMinutes), windowEnd)) {
        const end = addMinutes(cursor, service.durationMinutes);
        const cursorD = cursor; // capturar para los closures
        const blocked =
          isBefore(cursorD, notBefore) ||
          isAfter(cursorD, notAfter) ||
          timeBlocks.some((tb) =>
            overlaps(cursorD, end, new Date(tb.startAt), new Date(tb.endAt)),
          ) ||
          activeAppts.some((a) =>
            overlaps(cursorD, end, new Date(a.startsAt), new Date(a.endsAt)),
          );

        if (!blocked) {
          slots.push({ start: cursorD.toISOString(), end: end.toISOString() });
        }
        cursor = addMinutes(end, service.breakAfterMinutes);
      }
    }
  }
  return slots;
}

/** Agrupa slots por día (clave yyyy-MM-dd local) para el calendario del wizard. */
export function groupSlotsByDay(slots: Slot[]): Map<string, Slot[]> {
  const map = new Map<string, Slot[]>();
  for (const s of slots) {
    const d = new Date(s.start);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const list = map.get(key) ?? [];
    list.push(s);
    map.set(key, list);
  }
  return map;
}
