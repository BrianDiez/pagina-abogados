import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Video, Star } from "lucide-react";
import { useAuth } from "@/api/auth";
import { listClientAppointments } from "@/api/appointments";
import { createReview } from "@/api/reviews";
import { formatDateLong, formatMoney, formatTime } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StarInput } from "@/components/ui/Rating";
import { Textarea } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/misc";
import type { Appointment, AppointmentStatus } from "@/types";

const statusBadge: Record<AppointmentStatus, { label: string; tone: "navy" | "gold" | "green" | "red" | "warn" | "neutral" }> = {
  confirmed: { label: "Confirmado", tone: "navy" },
  pending_payment: { label: "Pendiente de pago", tone: "warn" },
  completed: { label: "Completado", tone: "green" },
  cancelled: { label: "Cancelado", tone: "red" },
  no_show: { label: "No asistió", tone: "red" },
};

function ReviewModal({
  appointment,
  onClose,
}: {
  appointment: Appointment;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [recommend, setRecommend] = useState(true);

  const mutation = useMutation({
    mutationFn: () =>
      createReview({
        lawyerId: appointment.lawyerId,
        appointmentId: appointment.id,
        ratingOverall: rating,
        textReview: text,
        wouldRecommend: recommend,
        isAnonymous: false,
        clientName: appointment.clientName ?? "Cliente",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      onClose();
    },
  });

  const words = text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <Modal open onClose={onClose} title={`Reseñar a ${appointment.lawyerName}`}>
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium text-navy-700">¿Cómo fue tu consulta?</p>
          <StarInput value={rating} onChange={setRating} />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-navy-700">
            Contá tu experiencia <span className="text-navy-400">(mínimo 30 palabras)</span>
          </p>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} />
          <p className="mt-1 text-xs text-navy-400">{words} / 30 palabras</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-navy-700">
          <input
            type="checkbox"
            checked={recommend}
            onChange={(e) => setRecommend(e.target.checked)}
            className="accent-gold-500"
          />
          Recomendaría a este profesional
        </label>
        {mutation.isError && (
          <p className="rounded-lg bg-danger-light p-3 text-sm text-danger">
            {(mutation.error as Error).message}
          </p>
        )}
        <Button
          className="w-full"
          disabled={words < 30 || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          Publicar reseña
        </Button>
      </div>
    </Modal>
  );
}

export function ClientAccountPage() {
  const { user } = useAuth();
  const [reviewing, setReviewing] = useState<Appointment | null>(null);

  const { data: appointments } = useQuery({
    queryKey: ["client-appointments", user?.clientId],
    queryFn: () => listClientAppointments(user!.clientId!),
    enabled: !!user?.clientId,
  });

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "lawyer") return <Navigate to="/dashboard" replace />;

  const upcoming = (appointments ?? []).filter(
    (a) => (a.status === "confirmed" || a.status === "pending_payment") && new Date(a.startsAt) > new Date(),
  );
  const past = (appointments ?? []).filter((a) => !upcoming.includes(a));

  function AppointmentCard({ a }: { a: Appointment }) {
    const badge = statusBadge[a.status];
    return (
      <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-lg font-semibold text-navy-800">{a.serviceName}</p>
            <Badge tone={badge.tone}>{badge.label}</Badge>
          </div>
          <p className="text-sm text-navy-500">
            con{" "}
            <Link to={`/p/${a.lawyerSlug}`} className="font-medium text-navy-700 underline">
              {a.lawyerName}
            </Link>
          </p>
          <p className="mt-1 text-sm capitalize text-navy-400">
            <CalendarDays className="mr-1 inline size-4" />
            {formatDateLong(a.startsAt)} · {formatTime(a.startsAt)} hs ·{" "}
            <span className="font-mono">{formatMoney(a.price, a.currency)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          {a.status === "confirmed" && a.videoRoomUrl && (
            <a href={a.videoRoomUrl} target="_blank" rel="noreferrer">
              <Button variant="gold" size="sm">
                <Video className="size-4" />
                Entrar a la sala
              </Button>
            </a>
          )}
          {a.status === "completed" && (
            <Button variant="outline" size="sm" onClick={() => setReviewing(a)}>
              <Star className="size-4" />
              Dejar reseña
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-semibold text-navy-800">Mis consultas</h1>
        <p className="mt-1 text-navy-500">Hola {user.name.split(" ")[0]} 👋</p>

        <h2 className="mt-8 mb-3 font-display text-xl font-semibold text-navy-800">Próximas</h2>
        <div className="space-y-3">
          {upcoming.length > 0 ? (
            upcoming.map((a) => <AppointmentCard key={a.id} a={a} />)
          ) : (
            <EmptyState
              title="No tenés consultas agendadas"
              action={<ButtonLink to="/abogados">Buscar un profesional</ButtonLink>}
            />
          )}
        </div>

        {past.length > 0 && (
          <>
            <h2 className="mt-10 mb-3 font-display text-xl font-semibold text-navy-800">
              Historial
            </h2>
            <div className="space-y-3">
              {past.map((a) => (
                <AppointmentCard key={a.id} a={a} />
              ))}
            </div>
          </>
        )}
      </div>
      {reviewing && <ReviewModal appointment={reviewing} onClose={() => setReviewing(null)} />}
      <Footer />
    </div>
  );
}
