import { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { useMyAppointments } from "./useLawyer";
import { formatDateShort, formatMoney } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/misc";

interface ClientSummary {
  clientId: string;
  name: string;
  email: string;
  consultations: number;
  lastVisit: string;
  totalBilled: number;
  currency: string;
}

export function ClientsPage() {
  const { data: appointments } = useMyAppointments();
  const [query, setQuery] = useState("");

  const clients = useMemo<ClientSummary[]>(() => {
    const map = new Map<string, ClientSummary>();
    for (const a of appointments ?? []) {
      if (a.status === "cancelled") continue;
      const existing = map.get(a.clientId);
      const billed = a.paymentStatus === "paid" ? a.price : 0;
      if (existing) {
        existing.consultations += 1;
        existing.totalBilled += billed;
        if (a.startsAt > existing.lastVisit) existing.lastVisit = a.startsAt;
      } else {
        map.set(a.clientId, {
          clientId: a.clientId,
          name: a.clientName ?? "Cliente",
          email: a.clientEmail ?? "",
          consultations: 1,
          lastVisit: a.startsAt,
          totalBilled: billed,
          currency: a.currency,
        });
      }
    }
    let list = Array.from(map.values()).sort((a, b) => b.lastVisit.localeCompare(a.lastVisit));
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
    }
    return list;
  }, [appointments, query]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-semibold text-navy-800">Clientes</h1>
        <p className="text-sm text-navy-400">
          Tu cartera de clientes con historial de consultas y facturación.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-navy-300" />
        <Input
          placeholder="Buscar por nombre o email…"
          className="pl-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {clients.length > 0 ? (
        <Card className="divide-y divide-navy-100/70">
          {clients.map((c) => (
            <div key={c.clientId} className="flex items-center gap-4 p-4">
              <Avatar name={c.name} size="md" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-navy-800">{c.name}</p>
                <p className="truncate text-sm text-navy-400">{c.email}</p>
              </div>
              <div className="hidden text-right sm:block">
                <p className="font-mono text-sm font-semibold text-navy-700">{c.consultations}</p>
                <p className="text-xs text-navy-400">consultas</p>
              </div>
              <div className="hidden text-right md:block">
                <p className="font-mono text-sm font-semibold text-navy-700">
                  {formatDateShort(c.lastVisit)}
                </p>
                <p className="text-xs text-navy-400">última visita</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-bold text-success">
                  {formatMoney(c.totalBilled, c.currency)}
                </p>
                <p className="text-xs text-navy-400">facturado</p>
              </div>
            </div>
          ))}
        </Card>
      ) : (
        <EmptyState
          icon={<Users className="size-10" />}
          title="Aún no tenés clientes"
          subtitle="Cuando recibas tu primera reserva, el cliente aparece acá automáticamente."
        />
      )}
    </div>
  );
}
