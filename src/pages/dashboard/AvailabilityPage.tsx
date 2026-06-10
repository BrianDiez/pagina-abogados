import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { Plus, Save, Trash2 } from "lucide-react";
import { useAuth } from "@/api/auth";
import { getAvailability, saveAvailability } from "@/api/lawyers";
import { DAY_NAMES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

interface Row {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

// Orden visual: lunes primero
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function AvailabilityPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const lawyerId = user!.lawyerId!;
  const [rows, setRows] = useState<Row[]>([]);
  const [dirty, setDirty] = useState(false);

  const { data: existing } = useQuery({
    queryKey: ["my-availability", lawyerId],
    queryFn: () => getAvailability(lawyerId),
  });

  useEffect(() => {
    if (existing && !dirty) {
      setRows(
        existing
          .filter((a) => a.isActive)
          .map((a) => ({ dayOfWeek: a.dayOfWeek, startTime: a.startTime, endTime: a.endTime })),
      );
    }
  }, [existing, dirty]);

  const mutation = useMutation({
    mutationFn: () =>
      saveAvailability(
        lawyerId,
        rows.map((r) => ({ ...r, isActive: true })),
      ),
    onSuccess: () => {
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["my-availability", lawyerId] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
    },
  });

  function update(index: number, patch: Partial<Row>) {
    setDirty(true);
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRow(day: number) {
    setDirty(true);
    setRows((prev) => [...prev, { dayOfWeek: day, startTime: "09:00", endTime: "12:00" }]);
  }

  function removeRow(index: number) {
    setDirty(true);
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-navy-800">Disponibilidad</h1>
          <p className="text-sm text-navy-400">
            Tus ventanas semanales de atención. Los slots se calculan según la duración de cada
            servicio.
          </p>
        </div>
        <Button onClick={() => mutation.mutate()} disabled={!dirty || mutation.isPending} variant="gold">
          <Save className="size-4" />
          {mutation.isPending ? "Guardando…" : dirty ? "Guardar cambios" : "Guardado"}
        </Button>
      </div>

      <div className="space-y-3">
        {DAY_ORDER.map((day) => {
          const dayRows = rows
            .map((r, index) => ({ ...r, index }))
            .filter((r) => r.dayOfWeek === day);
          const active = dayRows.length > 0;
          return (
            <Card key={day} className={cn("p-4", !active && "opacity-70")}>
              <div className="flex flex-wrap items-center gap-4">
                <p className={cn("w-28 font-medium", active ? "text-navy-800" : "text-navy-400")}>
                  {DAY_NAMES[day]}
                </p>
                <div className="flex flex-1 flex-wrap items-center gap-3">
                  {dayRows.length === 0 && (
                    <span className="text-sm text-navy-300">Sin atención</span>
                  )}
                  {dayRows.map((r) => (
                    <span key={r.index} className="flex items-center gap-1.5">
                      <Input
                        type="time"
                        value={r.startTime}
                        onChange={(e) => update(r.index, { startTime: e.target.value })}
                        className="w-28 font-mono"
                      />
                      <span className="text-navy-400">–</span>
                      <Input
                        type="time"
                        value={r.endTime}
                        onChange={(e) => update(r.index, { endTime: e.target.value })}
                        className="w-28 font-mono"
                      />
                      <button
                        onClick={() => removeRow(r.index)}
                        className="rounded-lg p-1.5 text-navy-300 hover:bg-danger-light hover:text-danger cursor-pointer"
                        aria-label="Quitar franja"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </span>
                  ))}
                </div>
                <Button variant="ghost" size="sm" onClick={() => addRow(day)}>
                  <Plus className="size-4" />
                  Agregar franja
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-navy-400">
        💡 Consejo: dejá buffers entre consultas desde la configuración de cada servicio, y usá
        bloqueos puntuales (vacaciones, audiencias) desde la agenda — disponible en Fase 2.
      </p>
    </div>
  );
}
