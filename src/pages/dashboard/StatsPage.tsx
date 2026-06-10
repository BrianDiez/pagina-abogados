import { useMemo } from "react";
import { format, startOfMonth, subMonths, isSameMonth } from "date-fns";
import { es } from "date-fns/locale";
import { BarChart3, Eye, TrendingUp, CalendarCheck } from "lucide-react";
import { useLawyer, useMyAppointments } from "./useLawyer";
import { formatMoney } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/misc";

export function StatsPage() {
  const { data: lawyer } = useLawyer();
  const { data: appointments } = useMyAppointments();

  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const month = startOfMonth(subMonths(now, 5 - i));
      const paid = (appointments ?? []).filter(
        (a) =>
          isSameMonth(new Date(a.startsAt), month) &&
          a.paymentStatus === "paid" &&
          a.status !== "cancelled",
      );
      return {
        label: format(month, "MMM", { locale: es }),
        income: paid.reduce((s, a) => s + a.price, 0),
        count: paid.length,
      };
    });
  }, [appointments]);

  const maxIncome = Math.max(...months.map((m) => m.income), 1);
  const currency = appointments?.[0]?.currency ?? "UYU";
  const completed = (appointments ?? []).filter((a) => a.status === "completed").length;
  const total = (appointments ?? []).filter((a) => a.status !== "cancelled").length;
  const conversionPct = lawyer && lawyer.profileViews > 0
    ? Math.min(100, Math.round((total / lawyer.profileViews) * 1000) / 10)
    : 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-semibold text-navy-800">Estadísticas</h1>
        <p className="text-sm text-navy-400">Cómo está funcionando tu consultorio digital.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Visitas al perfil"
          value={(lawyer?.profileViews ?? 0).toLocaleString("es-UY")}
          sub="Últimos 30 días"
          icon={<Eye className="size-5" />}
        />
        <StatCard
          label="Consultas totales"
          value={String(total)}
          sub={`${completed} completadas`}
          icon={<CalendarCheck className="size-5" />}
        />
        <StatCard
          label="Conversión visita → turno"
          value={`${conversionPct}%`}
          sub="Visitas que terminan en reserva"
          icon={<TrendingUp className="size-5" />}
        />
        <StatCard
          label="Ingresos 6 meses"
          value={formatMoney(months.reduce((s, m) => s + m.income, 0), currency)}
          icon={<BarChart3 className="size-5" />}
        />
      </div>

      <Card className="p-6">
        <h2 className="mb-6 font-display text-xl font-semibold text-navy-800">
          Ingresos por mes
        </h2>
        <div className="flex h-48 items-end gap-3">
          {months.map((m) => (
            <div key={m.label} className="flex flex-1 flex-col items-center gap-2">
              <span className="font-mono text-xs font-semibold text-navy-600">
                {m.income > 0 ? formatMoney(m.income, currency) : ""}
              </span>
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-navy-700 to-navy-500 transition-all"
                style={{ height: `${Math.max(4, (m.income / maxIncome) * 100)}%` }}
                title={`${m.count} consultas`}
              />
              <span className="text-xs font-medium uppercase text-navy-400">{m.label}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-navy-400">
          En el plan Profesional vas a ver además: origen del tráfico, servicios más vistos y
          horarios con más demanda.
        </p>
      </Card>
    </div>
  );
}
