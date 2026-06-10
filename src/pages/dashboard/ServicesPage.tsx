import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Briefcase, Clock, Pencil, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/api/auth";
import { createService, deleteService, getServices, updateService } from "@/api/lawyers";
import { useLawyer } from "./useLawyer";
import { MODALITY_LABELS } from "@/lib/constants";
import { suggestedPriceRange } from "@/lib/pricing";
import { formatMoney } from "@/lib/utils";
import type { Lawyer } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { FieldLabel, Input, Select, Textarea } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/misc";
import type { Service } from "@/types";

const schema = z.object({
  name: z.string().min(3, "Nombre del servicio"),
  description: z.string().min(10, "Describí qué incluye"),
  durationMinutes: z.coerce.number().min(10).max(480),
  price: z.coerce.number().min(0),
  currency: z.enum(["UYU", "ARS", "USD", "BRL", "CLP"]),
  modality: z.enum(["video", "in_person", "phone", "async"]),
  minAdvanceHours: z.coerce.number().min(0).max(168),
  breakAfterMinutes: z.coerce.number().min(0).max(120),
});
type Form = z.infer<typeof schema>;

function ServiceModal({
  lawyerId,
  lawyer,
  service,
  onClose,
}: {
  lawyerId: string;
  lawyer: Lawyer | null | undefined;
  service: Service | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: service
      ? {
          name: service.name,
          description: service.description,
          durationMinutes: service.durationMinutes,
          price: service.price,
          currency: service.currency as Form["currency"],
          modality: service.modality,
          minAdvanceHours: service.minAdvanceHours,
          breakAfterMinutes: service.breakAfterMinutes,
        }
      : {
          durationMinutes: 45,
          currency: "UYU",
          modality: "video",
          minAdvanceHours: 2,
          breakAfterMinutes: 15,
        },
  });

  // Sugerencia de precio para quien no sabe cuánto cobrar (clave para juniors)
  const watchedDuration = form.watch("durationMinutes") || 45;
  const suggestion = lawyer
    ? suggestedPriceRange(lawyer.country, lawyer.yearsExperience, Number(watchedDuration))
    : null;

  const mutation = useMutation({
    mutationFn: (data: Form) =>
      service
        ? updateService(service.id, data)
        : createService({ ...data, lawyerId, isActive: true, maxAdvanceDays: 60 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["my-services", lawyerId] });
      onClose();
    },
  });

  return (
    <Modal open onClose={onClose} title={service ? "Editar servicio" : "Nuevo servicio"} wide>
      <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <FieldLabel label="Nombre" required error={form.formState.errors.name?.message}>
          <Input placeholder="Consulta inicial (45 min)" {...form.register("name")} />
        </FieldLabel>
        <FieldLabel label="Descripción" required error={form.formState.errors.description?.message}>
          <Textarea
            rows={2}
            placeholder="Qué incluye, para quién es, qué se lleva el cliente…"
            {...form.register("description")}
          />
        </FieldLabel>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <FieldLabel label="Duración (min)" required>
            <Input type="number" {...form.register("durationMinutes")} />
          </FieldLabel>
          <FieldLabel label="Precio" required>
            <Input type="number" step="0.01" {...form.register("price")} />
          </FieldLabel>
          <FieldLabel label="Moneda" required>
            <Select {...form.register("currency")}>
              {["UYU", "ARS", "USD", "BRL", "CLP"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </FieldLabel>
          <FieldLabel label="Modalidad" required>
            <Select {...form.register("modality")}>
              {Object.entries(MODALITY_LABELS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </Select>
          </FieldLabel>
        </div>
        {suggestion && (
          <p className="rounded-xl bg-gold-50 border border-gold-200 px-3.5 py-2.5 text-xs leading-relaxed text-navy-600">
            💡 <strong>Precio sugerido para tu perfil</strong> ({lawyer!.yearsExperience}{" "}
            {lawyer!.yearsExperience === 1 ? "año" : "años"} de experiencia, {watchedDuration} min):{" "}
            <span className="font-mono font-bold">
              {formatMoney(suggestion.min, suggestion.currency)} –{" "}
              {formatMoney(suggestion.max, suggestion.currency)}
            </span>
            . También podés poner <strong>0</strong> para ofrecer una primera consulta gratuita:
            es la forma más rápida de conseguir tus primeras reseñas.
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <FieldLabel label="Anticipación mínima (horas)" hint="Cuánto antes pueden reservar">
            <Input type="number" {...form.register("minAdvanceHours")} />
          </FieldLabel>
          <FieldLabel label="Descanso después (min)" hint="Buffer entre consultas">
            <Input type="number" {...form.register("breakAfterMinutes")} />
          </FieldLabel>
        </div>
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {service ? "Guardar cambios" : "Crear servicio"}
        </Button>
      </form>
    </Modal>
  );
}

export function ServicesPage() {
  const { user } = useAuth();
  const { data: lawyer } = useLawyer();
  const queryClient = useQueryClient();
  const lawyerId = user!.lawyerId!;
  const [editing, setEditing] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: services, isLoading } = useQuery({
    queryKey: ["my-services", lawyerId],
    queryFn: () => getServices(lawyerId),
  });

  const removeMutation = useMutation({
    mutationFn: deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-services", lawyerId] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-navy-800">Servicios</h1>
          <p className="text-sm text-navy-400">
            Lo que tus clientes pueden agendar y pagar desde tu perfil.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          Nuevo servicio
        </Button>
      </div>

      {isLoading ? (
        <div className="h-60 animate-pulse rounded-2xl bg-navy-100/50" />
      ) : services && services.length > 0 ? (
        <div className="space-y-3">
          {services.map((s) => (
            <Card key={s.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-lg font-semibold text-navy-800">{s.name}</p>
                  <Badge tone="navy">{MODALITY_LABELS[s.modality]}</Badge>
                </div>
                <p className="mt-0.5 text-sm text-navy-500">{s.description}</p>
                <p className="mt-1 text-xs text-navy-400">
                  <Clock className="mr-1 inline size-3.5" />
                  {s.durationMinutes} min · anticipación {s.minAdvanceHours} h · buffer{" "}
                  {s.breakAfterMinutes} min
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xl font-bold text-navy-800">
                  {formatMoney(s.price, s.currency)}
                </span>
                <Button variant="ghost" size="sm" onClick={() => setEditing(s)}>
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-danger hover:bg-danger-light"
                  onClick={() => {
                    if (confirm(`¿Eliminar "${s.name}"? Los turnos ya agendados no se ven afectados.`)) {
                      removeMutation.mutate(s.id);
                    }
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Briefcase className="size-10" />}
          title="Todavía no creaste servicios"
          subtitle="Creá tu primer servicio para que los clientes puedan agendarte."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus className="size-4" />
              Crear servicio
            </Button>
          }
        />
      )}

      {(creating || editing) && (
        <ServiceModal
          lawyerId={lawyerId}
          lawyer={lawyer}
          service={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
