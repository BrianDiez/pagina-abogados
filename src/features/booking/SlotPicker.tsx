import { useEffect, useMemo, useState } from "react";
import { addDays, format, isSameDay, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarX2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAvailableSlots } from "@/api/appointments";
import { formatTime, cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/misc";
import type { Slot } from "@/types";

const DAYS_VISIBLE = 7;
const DAYS_FETCH = 21;

export function SlotPicker({
  lawyerId,
  serviceId,
  selected,
  onSelect,
}: {
  lawyerId: string;
  serviceId: string;
  selected: Slot | null;
  onSelect: (slot: Slot) => void;
}) {
  const [offset, setOffset] = useState(0);
  const windowStart = useMemo(() => startOfDay(addDays(new Date(), offset)), [offset]);

  const { data: slots, isLoading } = useQuery({
    queryKey: ["slots", lawyerId, serviceId, windowStart.toISOString()],
    queryFn: () => getAvailableSlots(lawyerId, serviceId, windowStart, DAYS_FETCH),
  });

  const days = Array.from({ length: DAYS_VISIBLE }, (_, i) => addDays(windowStart, i));
  const [activeDay, setActiveDay] = useState<Date>(days[0]!);

  // Al cambiar de semana, volver al primer día visible
  useEffect(() => {
    setActiveDay(startOfDay(addDays(new Date(), offset)));
  }, [offset]);

  const slotsOfDay = (slots ?? []).filter((s) => isSameDay(new Date(s.start), activeDay));
  const countOfDay = (d: Date) => (slots ?? []).filter((s) => isSameDay(new Date(s.start), d)).length;

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOffset((o) => Math.max(0, o - DAYS_VISIBLE))}
          disabled={offset === 0}
          className="rounded-lg border border-navy-200 p-2 text-navy-500 hover:bg-navy-50 disabled:opacity-40 cursor-pointer"
          aria-label="Semana anterior"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="grid flex-1 grid-cols-7 gap-1.5">
          {days.map((d) => {
            const count = countOfDay(d);
            const active = isSameDay(d, activeDay);
            return (
              <button
                key={d.toISOString()}
                onClick={() => setActiveDay(d)}
                disabled={count === 0}
                className={cn(
                  "flex flex-col items-center rounded-xl border py-2 transition-colors cursor-pointer",
                  active
                    ? "border-navy-700 bg-navy-700 text-white"
                    : count > 0
                      ? "border-navy-200 bg-white text-navy-700 hover:border-navy-400"
                      : "border-navy-100 bg-navy-50/50 text-navy-300 cursor-not-allowed",
                )}
              >
                <span className="text-[10px] font-medium uppercase">
                  {format(d, "EEE", { locale: es })}
                </span>
                <span className="font-mono text-lg font-bold leading-tight">{format(d, "d")}</span>
                <span className={cn("text-[10px]", active ? "text-gold-300" : "text-navy-400")}>
                  {count > 0 ? `${count} hs` : "—"}
                </span>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setOffset((o) => o + DAYS_VISIBLE)}
          className="rounded-lg border border-navy-200 p-2 text-navy-500 hover:bg-navy-50 cursor-pointer"
          aria-label="Semana siguiente"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <p className="mt-4 text-sm font-medium capitalize text-navy-700">
        {format(activeDay, "EEEE d 'de' MMMM", { locale: es })}
      </p>

      {isLoading ? (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-navy-100/60" />
          ))}
        </div>
      ) : slotsOfDay.length > 0 ? (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {slotsOfDay.map((slot) => {
            const isSelected = selected?.start === slot.start;
            return (
              <button
                key={slot.start}
                onClick={() => onSelect(slot)}
                className={cn(
                  "rounded-lg border py-2.5 font-mono text-sm font-semibold transition-colors cursor-pointer",
                  isSelected
                    ? "border-gold-500 bg-gold-400 text-navy-900"
                    : "border-navy-200 bg-white text-navy-700 hover:border-gold-400 hover:bg-gold-50",
                )}
              >
                {formatTime(slot.start)}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-3">
          <EmptyState
            icon={<CalendarX2 className="size-8" />}
            title="Sin horarios disponibles este día"
            subtitle="Probá con otro día de la semana."
          />
        </div>
      )}
    </div>
  );
}
