import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isPast } from "date-fns";
import { es } from "date-fns/locale";
import { Video, StickyNote, CheckCircle2, XCircle } from "lucide-react";
import { useMyAppointments } from "./useLawyer";
import { updateAppointment } from "@/api/appointments";
import { useAuth } from "@/api/auth";
import { formatMoney, formatTime, cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/misc";
import type { Appointment, AppointmentStatus } from "@/types";

const statusMeta: Record<AppointmentStatus, { label: string; tone: "navy" | "warn" | "red" | "green" | "neutral"; bar: string }> = {
  confirmed: { label: "Confirmado", tone: "navy", bar: "bg-navy-600" },
  pending_payment: { label: "Pendiente de pago", tone: "warn", bar: "bg-warn" },
  cancelled: { label: "Cancelado", tone: "red", bar: "bg-danger" },
  completed: { label: "Completado", tone: "green", bar: "bg-success" },
  no_show: { label: "No asistió", tone: "red", bar: "bg-danger" },
};

function NotesModal({ appointment, onClose }: { appointment: Appointment; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [notes, setNotes] = useState(appointment.lawyerNotes ?? "");
  const mutation = useMutation({
    mutationFn: () => updateAppointment(appointment.id, { lawyerNotes: notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-appointments", user?.lawyerId] });
      onClose();
    },
  });
  return (
    <Modal open onClose={onClose} title={`Notas — ${appointment.clientName}`}>
      <p className="mb-3 text-xs text-navy-400">
        Privadas: el cliente nunca ve estas notas.
      </p>
      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} />
      <Button className="mt-4 w-full" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
        Guardar notas
      </Button>
    </Modal>
  );
}

export function AgendaPage() {
  const { data: appointments, isLoading } = useMyAppointments();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [notesFor, setNotesFor] = useState<Appointment | null>(null);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      updateAppointment(id, { status, ...(status === "cancelled" ? { cancelledBy: "lawyer" as const } : {}) }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["my-appointments", user?.lawyerId] }),
  });

  const grouped = useMemo(() => {
    const now = new Date();
    const filtered = (appointments ?? []).filter((a) =>
      tab === "upcoming" ? new Date(a.endsAt) >= now : new Date(a.endsAt) < now,
    );
    const sorted = [...filtered].sort((a, b) =>
      tab === "upcoming" ? a.startsAt.localeCompare(b.startsAt) : b.startsAt.localeCompare(a.startsAt),
    );
    const map = new Map<string, Appointment[]>();
    for (const a of sorted) {
      const key = format(new Date(a.startsAt), "EEEE d 'de' MMMM", { locale: es });
      map.set(key, [...(map.get(key) ?? []), a]);
    }
    return map;
  }, [appointments, tab]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold text-navy-800">Agenda</h1>
        <div className="flex rounded-xl border border-navy-200 bg-white p-1">
          {(["upcoming", "past"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer",
                tab === t ? "bg-navy-700 text-white" : "text-navy-500 hover:text-navy-800",
              )}
            >
              {t === "upcoming" ? "Próximos" : "Historial"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-72 animate-pulse rounded-2xl bg-navy-100/50" />
      ) : grouped.size === 0 ? (
        <EmptyState
          title={tab === "upcoming" ? "No hay turnos próximos" : "Sin historial todavía"}
          subtitle="Cuando recibas reservas las vas a ver acá."
        />
      ) : (
        Array.from(grouped.entries()).map(([day, list]) => (
          <div key={day}>
            <h2 className="mb-2 text-sm font-semibold capitalize text-navy-500">{day}</h2>
            <div className="space-y-2.5">
              {list.map((a) => {
                const meta = statusMeta[a.status];
                const started = isPast(new Date(a.startsAt));
                return (
                  <Card key={a.id} className="flex items-stretch overflow-hidden">
                    <span className={cn("w-1.5 shrink-0", meta.bar)} />
                    <div className="flex flex-1 flex-col gap-3 p-4 sm:flex-row sm:items-center">
                      <div className="w-20 shrink-0">
                        <p className="font-mono text-lg font-bold text-navy-800">
                          {formatTime(a.startsAt)}
                        </p>
                        <p className="text-xs text-navy-400">{formatTime(a.endsAt)}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-navy-800">{a.clientName}</p>
                          <Badge tone={meta.tone}>{meta.label}</Badge>
                        </div>
                        <p className="text-sm text-navy-500">
                          {a.serviceName} ·{" "}
                          <span className="font-mono">{formatMoney(a.price, a.currency)}</span>
                        </p>
                        {a.clientNotes && (
                          <p className="mt-1 line-clamp-1 text-xs italic text-navy-400">
                            “{a.clientNotes}”
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {a.status === "confirmed" && a.videoRoomUrl && (
                          <a href={a.videoRoomUrl} target="_blank" rel="noreferrer">
                            <Button size="sm" variant="gold">
                              <Video className="size-4" />
                              Sala
                            </Button>
                          </a>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => setNotesFor(a)}>
                          <StickyNote className="size-4" />
                          Notas
                        </Button>
                        {a.status === "confirmed" && started && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => statusMutation.mutate({ id: a.id, status: "completed" })}
                          >
                            <CheckCircle2 className="size-4" />
                            Completar
                          </Button>
                        )}
                        {(a.status === "confirmed" || a.status === "pending_payment") && !started && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-danger hover:bg-danger-light"
                            onClick={() => {
                              if (confirm(`¿Cancelar el turno de ${a.clientName}? Se le notificará por email.`)) {
                                statusMutation.mutate({ id: a.id, status: "cancelled" });
                              }
                            }}
                          >
                            <XCircle className="size-4" />
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))
      )}
      {notesFor && <NotesModal appointment={notesFor} onClose={() => setNotesFor(null)} />}
    </div>
  );
}
