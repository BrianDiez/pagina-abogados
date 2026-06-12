import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  Inbox,
  Info,
  Mail,
  Phone,
  Plus,
  Save,
  Trash2,
  ExternalLink,
  Crown,
} from "lucide-react";
import { useAuth } from "@/api/auth";
import { useLawyer } from "./useLawyer";
import {
  addFirmMember,
  createFirm,
  getFirmMembers,
  getLawyerFirm,
  listFirmInquiries,
  markInquiryRead,
  removeFirmMember,
  updateFirm,
} from "@/api/firms";
import { listLawyers } from "@/api/lawyers";
import { CITIES_BY_COUNTRY, specialtyLabel } from "@/lib/constants";
import { cn, formatDateShort } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FieldLabel, Input, Select, Textarea } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/misc";
import type { Firm } from "@/types";

const createSchema = z.object({
  name: z.string().min(3, "Nombre del estudio"),
  tagline: z.string().max(120).optional(),
  description: z.string().min(40, "Contá qué hace el estudio (mín. 40 caracteres)").max(1200),
  city: z.string().min(2, "Elegí la ciudad"),
  country: z.enum(["UY", "AR"]),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  linkedin: z.string().url("URL inválida").optional().or(z.literal("")),
  instagram: z.string().url("URL inválida").optional().or(z.literal("")),
});
type CreateForm = z.infer<typeof createSchema>;

function CreateFirmCard({ lawyerId, onCreated }: { lawyerId: string; onCreated: () => void }) {
  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { country: "UY" },
  });
  const firmCountry = form.watch("country");
  const mutation = useMutation({
    mutationFn: (data: CreateForm) =>
      createFirm({
        name: data.name,
        tagline: data.tagline,
        description: data.description,
        city: data.city,
        country: data.country,
        email: data.email || undefined,
        phone: data.phone || undefined,
        socials: {
          website: data.website || undefined,
          linkedin: data.linkedin || undefined,
          instagram: data.instagram || undefined,
        },
        ownerLawyerId: lawyerId,
      }),
    onSuccess: onCreated,
  });

  return (
    <div className="max-w-2xl space-y-5">
      <Card className="flex items-start gap-3 bg-navy-50/60 p-5">
        <Building2 className="mt-0.5 size-6 shrink-0 text-gold-500" />
        <div className="text-sm leading-relaxed text-navy-600">
          <p className="font-semibold text-navy-800">Tu estudio, como en LinkedIn</p>
          <p className="mt-1">
            El estudio tiene su propia página pública con logo, redes y equipo. Tu perfil
            individual muestra la afiliación, y las consultas que lleguen <strong>al estudio</strong>{" "}
            caen en una bandeja compartida. Las reservas de tu perfil individual siguen siendo
            solo tuyas.
          </p>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="font-display text-2xl font-semibold text-navy-800">Crear mi estudio</h2>
        <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldLabel label="Nombre del estudio" required error={form.formState.errors.name?.message}>
              <Input placeholder="Pérez & Asociados" {...form.register("name")} />
            </FieldLabel>
            <FieldLabel label="Eslogan" hint="Una línea que resuma el estudio">
              <Input placeholder="Derecho laboral y de empresa" {...form.register("tagline")} />
            </FieldLabel>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldLabel label="País" required>
              <Select {...form.register("country")}>
                <option value="UY">Uruguay</option>
                <option value="AR">Argentina</option>
              </Select>
            </FieldLabel>
            <FieldLabel label="Ciudad" required error={form.formState.errors.city?.message}>
              <Select {...form.register("city")}>
                <option value="">Elegir…</option>
                {(CITIES_BY_COUNTRY[firmCountry] ?? CITIES_BY_COUNTRY.UY).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </FieldLabel>
          </div>
          <FieldLabel label="Descripción" required error={form.formState.errors.description?.message}>
            <Textarea rows={4} placeholder="Qué hace el estudio, para quién, desde cuándo…" {...form.register("description")} />
          </FieldLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldLabel label="Email del estudio" error={form.formState.errors.email?.message} hint="Acá llegan las consultas">
              <Input placeholder="contacto@estudio.uy" {...form.register("email")} />
            </FieldLabel>
            <FieldLabel label="Teléfono">
              <Input placeholder="+598 2…" {...form.register("phone")} />
            </FieldLabel>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <FieldLabel label="Sitio web" error={form.formState.errors.website?.message}>
              <Input placeholder="https://…" {...form.register("website")} />
            </FieldLabel>
            <FieldLabel label="LinkedIn" error={form.formState.errors.linkedin?.message}>
              <Input placeholder="https://linkedin.com/company/…" {...form.register("linkedin")} />
            </FieldLabel>
            <FieldLabel label="Instagram" error={form.formState.errors.instagram?.message}>
              <Input placeholder="https://instagram.com/…" {...form.register("instagram")} />
            </FieldLabel>
          </div>
          {mutation.isError && (
            <p className="rounded-lg bg-danger-light p-3 text-sm text-danger">
              {(mutation.error as Error).message}
            </p>
          )}
          <Button type="submit" variant="gold" size="lg" disabled={mutation.isPending}>
            Crear estudio
          </Button>
          <p className="text-xs text-navy-400">
            Incluido en el plan Estudio (hasta 5 profesionales). En el modo demo podés probarlo gratis.
          </p>
        </form>
      </Card>
    </div>
  );
}

function ManageFirm({ firm, lawyerId }: { firm: Firm; lawyerId: string }) {
  const queryClient = useQueryClient();
  const isOwner = firm.ownerLawyerId === lawyerId;
  const [desc, setDesc] = useState<string | null>(null);
  const [newMemberId, setNewMemberId] = useState("");

  const { data: inquiries } = useQuery({
    queryKey: ["firm-inquiries", firm.id],
    queryFn: () => listFirmInquiries(firm.id),
  });
  const { data: members } = useQuery({
    queryKey: ["firm-members", firm.id],
    queryFn: () => getFirmMembers(firm.id),
  });
  const { data: allLawyers } = useQuery({
    queryKey: ["lawyers", "all-for-firm"],
    queryFn: () => listLawyers({}),
    enabled: isOwner,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["firm-members", firm.id] });
    queryClient.invalidateQueries({ queryKey: ["my-firm"] });
    queryClient.invalidateQueries({ queryKey: ["firms"] });
  };

  const readMutation = useMutation({
    mutationFn: markInquiryRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["firm-inquiries", firm.id] }),
  });
  const saveMutation = useMutation({
    mutationFn: () => updateFirm(firm.id, { description: desc ?? firm.description }),
    onSuccess: invalidate,
  });
  const addMutation = useMutation({
    mutationFn: () => addFirmMember(firm.id, newMemberId),
    onSuccess: () => {
      setNewMemberId("");
      invalidate();
    },
  });
  const removeMutation = useMutation({
    mutationFn: (id: string) => removeFirmMember(firm.id, id),
    onSuccess: invalidate,
  });

  const unread = (inquiries ?? []).filter((i) => !i.isRead).length;
  const candidates = (allLawyers ?? []).filter((l) => !firm.memberIds.includes(l.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={firm.name} src={firm.logoUrl} size="md" />
          <div>
            <h1 className="font-display text-3xl font-semibold text-navy-800">{firm.name}</h1>
            <p className="text-sm text-navy-400">
              {firm.city} · {firm.memberIds.length}/5 profesionales
              {isOwner && (
                <span className="ml-2 inline-flex items-center gap-1 text-gold-600">
                  <Crown className="size-3.5" /> Sos el administrador
                </span>
              )}
            </p>
          </div>
        </div>
        <Link
          to={`/e/${firm.slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-600 underline hover:text-navy-800"
        >
          Ver página pública
          <ExternalLink className="size-4" />
        </Link>
      </div>

      <Card className="flex items-start gap-3 bg-gold-50 border-gold-200 p-4">
        <Info className="mt-0.5 size-5 shrink-0 text-gold-600" />
        <p className="text-sm leading-relaxed text-navy-600">
          <strong>Cómo funcionan las notificaciones:</strong> las consultas enviadas a la página
          del estudio llegan a esta bandeja (y por email en el plan Estudio). Las reservas que cada
          profesional recibe en su perfil individual son privadas y <strong>no</strong> se
          comparten con el estudio.
        </p>
      </Card>

      {/* Bandeja de consultas al estudio */}
      <Card className="p-6">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-navy-800">
          <Inbox className="size-5 text-gold-500" />
          Consultas al estudio
          {unread > 0 && (
            <span className="rounded-full bg-danger px-2 py-0.5 text-xs font-bold text-white">
              {unread} sin leer
            </span>
          )}
        </h2>
        <div className="mt-4 space-y-3">
          {(inquiries ?? []).length === 0 && (
            <EmptyState
              title="Sin consultas todavía"
              subtitle="Compartí la página del estudio para empezar a recibir casos derivables."
            />
          )}
          {(inquiries ?? []).map((inq) => (
            <div
              key={inq.id}
              className={cn(
                "rounded-xl border p-4",
                inq.isRead ? "border-navy-100 bg-white" : "border-gold-300 bg-gold-50/60",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Avatar name={inq.name} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-navy-800">
                      {inq.name}
                      {!inq.isRead && (
                        <Badge tone="gold" className="ml-2">
                          Nueva
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-navy-400">
                      {formatDateShort(inq.createdAt)}
                      {inq.specialty && ` · ${specialtyLabel(inq.specialty)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-navy-500">
                  <a href={`mailto:${inq.email}`} className="inline-flex items-center gap-1 hover:text-navy-800">
                    <Mail className="size-3.5" />
                    {inq.email}
                  </a>
                  {inq.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="size-3.5" />
                      {inq.phone}
                    </span>
                  )}
                </div>
              </div>
              <p className="mt-2.5 text-sm leading-relaxed text-navy-600">{inq.message}</p>
              {!inq.isRead && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => readMutation.mutate(inq.id)}
                >
                  Marcar como leída
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Equipo */}
      <Card className="p-6">
        <h2 className="font-display text-xl font-semibold text-navy-800">Equipo</h2>
        <div className="mt-4 divide-y divide-navy-100/70">
          {(members ?? []).map((m) => (
            <div key={m.id} className="flex items-center gap-3 py-3">
              <Avatar name={m.displayName} src={m.photoUrl} size="md" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-navy-800">
                  {m.title} {m.displayName}
                  {m.id === firm.ownerLawyerId && (
                    <Crown className="ml-1.5 inline size-3.5 text-gold-500" />
                  )}
                </p>
                <p className="text-xs text-navy-400">
                  {m.specialties.map(specialtyLabel).slice(0, 2).join(" · ")}
                </p>
              </div>
              <Link to={`/p/${m.slug}`} className="text-xs text-navy-500 underline">
                Ver perfil
              </Link>
              {isOwner && m.id !== firm.ownerLawyerId && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-danger hover:bg-danger-light"
                  onClick={() => {
                    if (confirm(`¿Quitar a ${m.displayName} del estudio?`)) {
                      removeMutation.mutate(m.id);
                    }
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        {isOwner && firm.memberIds.length < 5 && (
          <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-navy-100/70 pt-4">
            <FieldLabel label="Agregar profesional (demo: elegí de la plataforma)">
              <Select value={newMemberId} onChange={(e) => setNewMemberId(e.target.value)} className="min-w-64">
                <option value="">Elegir…</option>
                {candidates.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title} {l.displayName} — {l.city}
                  </option>
                ))}
              </Select>
            </FieldLabel>
            <Button disabled={!newMemberId || addMutation.isPending} onClick={() => addMutation.mutate()}>
              <Plus className="size-4" />
              Agregar
            </Button>
            {addMutation.isError && (
              <p className="w-full text-sm text-danger">{(addMutation.error as Error).message}</p>
            )}
            <p className="w-full text-xs text-navy-400">
              En producción: invitación por email con aceptación del profesional.
            </p>
          </div>
        )}
      </Card>

      {/* Datos del estudio */}
      {isOwner && (
        <Card className="space-y-4 p-6">
          <h2 className="font-display text-xl font-semibold text-navy-800">Datos del estudio</h2>
          <FieldLabel label="Descripción pública">
            <Textarea
              rows={4}
              value={desc ?? firm.description}
              onChange={(e) => setDesc(e.target.value)}
            />
          </FieldLabel>
          <Button onClick={() => saveMutation.mutate()} disabled={desc === null || saveMutation.isPending}>
            <Save className="size-4" />
            {saveMutation.isPending ? "Guardando…" : "Guardar cambios"}
          </Button>
        </Card>
      )}
    </div>
  );
}

export function FirmPage() {
  const { user } = useAuth();
  const { data: lawyer } = useLawyer();
  const queryClient = useQueryClient();
  const lawyerId = user!.lawyerId!;

  const { data: firm, isLoading } = useQuery({
    queryKey: ["my-firm", lawyerId],
    queryFn: () => getLawyerFirm(lawyerId),
  });

  if (isLoading || !lawyer) return <div className="h-96 animate-pulse rounded-2xl bg-navy-100/50" />;

  if (!firm) {
    return (
      <CreateFirmCard
        lawyerId={lawyerId}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ["my-firm", lawyerId] })}
      />
    );
  }

  return <ManageFirm firm={firm} lawyerId={lawyerId} />;
}
