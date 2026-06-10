import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { isSameDay, isSameMonth } from "date-fns";
import {
  CalendarDays,
  DollarSign,
  Eye,
  Star,
  Video,
  ArrowRight,
  Share2,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Rocket,
} from "lucide-react";
import { useLawyer, useMyAppointments } from "./useLawyer";
import { getAvailability, getServices } from "@/api/lawyers";
import { useAuth } from "@/api/auth";
import { cn, formatMoney, formatTime } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState, StatCard } from "@/components/ui/misc";

export function DashboardHome() {
  const { data: lawyer } = useLawyer();
  const { data: appointments } = useMyAppointments();
  const { user } = useAuth();
  const { data: myServices } = useQuery({
    queryKey: ["my-services", user?.lawyerId],
    queryFn: () => getServices(user!.lawyerId!),
    enabled: !!user?.lawyerId,
  });
  const { data: myAvailability } = useQuery({
    queryKey: ["my-availability", user?.lawyerId],
    queryFn: () => getAvailability(user!.lawyerId!),
    enabled: !!user?.lawyerId,
  });

  if (!lawyer) return <div className="h-96 animate-pulse rounded-2xl bg-navy-100/50" />;

  // Checklist de arranque: guía a los recién matriculados a dejar el perfil operativo
  const checklist = [
    { label: "Subí tu foto profesional", done: !!lawyer.photoUrl, to: "/dashboard/configuracion" },
    { label: "Completá tu bio (mín. 60 caracteres)", done: lawyer.bio.length >= 60, to: "/dashboard/configuracion" },
    { label: "Creá tu primer servicio", done: (myServices ?? []).length > 0, to: "/dashboard/servicios" },
    { label: "Configurá tus horarios de atención", done: (myAvailability ?? []).length > 0, to: "/dashboard/disponibilidad" },
    { label: "Verificá tu matrícula", done: lawyer.isVerified, to: "/dashboard/configuracion" },
  ];
  const doneCount = checklist.filter((c) => c.done).length;
  const showChecklist = doneCount < checklist.length;

  const now = new Date();
  const today = (appointments ?? []).filter(
    (a) => isSameDay(new Date(a.startsAt), now) && a.status !== "cancelled",
  );
  const upcoming = (appointments ?? []).filter(
    (a) => new Date(a.startsAt) > now && (a.status === "confirmed" || a.status === "pending_payment"),
  );
  const monthIncome = (appointments ?? [])
    .filter(
      (a) =>
        isSameMonth(new Date(a.startsAt), now) &&
        a.paymentStatus === "paid" &&
        a.status !== "cancelled",
    )
    .reduce((sum, a) => sum + a.price, 0);
  const mainCurrency = appointments?.[0]?.currency ?? "UYU";

  function copyProfileLink() {
    const url = `${window.location.origin}/p/${lawyer!.slug}`;
    navigator.clipboard.writeText(url);
    alert(`Link copiado: ${url}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-navy-800">
            Hola, {lawyer.title} {lawyer.displayName.split(" ")[0]}
          </h1>
          <p className="text-sm text-navy-400">Esto está pasando con tu consultorio hoy.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyProfileLink}>
            <Share2 className="size-4" />
            Compartir mi perfil
          </Button>
          <ButtonLink to={`/p/${lawyer.slug}`} variant="ghost" size="sm">
            Ver perfil público
          </ButtonLink>
        </div>
      </div>

      {showChecklist && (
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-navy-800">
              <Rocket className="size-5 text-gold-500" />
              Dejá tu consultorio listo
            </h2>
            <span className="font-mono text-sm font-bold text-navy-600">
              {doneCount}/{checklist.length}
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-navy-100">
            <div
              className="h-full rounded-full bg-gold-400 transition-all"
              style={{ width: `${(doneCount / checklist.length) * 100}%` }}
            />
          </div>
          <ul className="mt-4 space-y-1">
            {checklist.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors",
                    item.done
                      ? "text-navy-300 line-through"
                      : "text-navy-700 hover:bg-navy-50 font-medium",
                  )}
                >
                  {item.done ? (
                    <CheckCircle2 className="size-4.5 shrink-0 text-success" />
                  ) : (
                    <Circle className="size-4.5 shrink-0 text-navy-300" />
                  )}
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-navy-400">
            Los perfiles completos y verificados reciben hasta 4× más consultas.
          </p>
        </Card>
      )}

      {!lawyer.isVerified && !showChecklist && (
        <Card className="flex items-start gap-3 border-gold-300 bg-gold-50 p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-gold-600" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-navy-800">Tu perfil aún no está verificado</p>
            <p className="text-navy-500">
              Los perfiles verificados reciben hasta 4× más consultas. Subí tu matrícula y documento
              desde Configuración: lo validamos en 48 h.
            </p>
          </div>
          <ButtonLink to="/dashboard/configuracion" size="sm" variant="gold">
            Verificar ahora
          </ButtonLink>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Turnos hoy"
          value={String(today.length)}
          sub={`${upcoming.length} próximos en total`}
          icon={<CalendarDays className="size-5" />}
        />
        <StatCard
          label="Ingresos del mes"
          value={formatMoney(monthIncome, mainCurrency)}
          sub="Pagos confirmados"
          icon={<DollarSign className="size-5" />}
        />
        <StatCard
          label="Calificación"
          value={lawyer.stats.avgRating ? lawyer.stats.avgRating.toFixed(1) : "—"}
          sub={`${lawyer.stats.reviewCount} reseñas`}
          icon={<Star className="size-5" />}
        />
        <StatCard
          label="Visitas al perfil"
          value={lawyer.profileViews.toLocaleString("es-UY")}
          sub="Últimos 30 días"
          icon={<Eye className="size-5" />}
        />
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-navy-800">Agenda de hoy</h2>
          <Link
            to="/dashboard/agenda"
            className="inline-flex items-center gap-1 text-sm font-medium text-navy-600 hover:text-navy-800"
          >
            Ver agenda completa
            <ArrowRight className="size-4" />
          </Link>
        </div>
        {today.length > 0 ? (
          <div className="divide-y divide-navy-100/70">
            {today.map((a) => (
              <div key={a.id} className="flex items-center gap-4 py-3.5">
                <span className="font-mono text-base font-bold text-gold-600">
                  {formatTime(a.startsAt)}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-navy-800">{a.clientName}</p>
                  <p className="text-xs text-navy-400">{a.serviceName}</p>
                </div>
                <Badge tone={a.status === "confirmed" ? "navy" : a.status === "completed" ? "green" : "warn"}>
                  {a.status === "confirmed"
                    ? "Confirmado"
                    : a.status === "completed"
                      ? "Completado"
                      : "Pendiente pago"}
                </Badge>
                {a.videoRoomUrl && a.status === "confirmed" && (
                  <a href={a.videoRoomUrl} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="gold">
                      <Video className="size-4" />
                      Unirme
                    </Button>
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sin turnos para hoy"
            subtitle="Compartí tu perfil para recibir nuevas consultas."
          />
        )}
      </Card>
    </div>
  );
}
