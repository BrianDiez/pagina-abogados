import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { BadgeCheck, CheckCircle2, CreditCard, Link2, QrCode, Save, ShieldAlert } from "lucide-react";
import { useLawyer } from "./useLawyer";
import { updateLawyerProfile } from "@/api/lawyers";
import { connectMercadoPago, disconnectMercadoPago, getMpStatus } from "@/api/payments";
import { PLAN_NAMES } from "@/lib/constants";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { FieldLabel, Input, Textarea } from "@/components/ui/Field";

export function SettingsPage() {
  const { data: lawyer } = useLawyer();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const [bio, setBio] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [accepts, setAccepts] = useState<boolean | null>(null);

  const { data: mp } = useQuery({ queryKey: ["mp-status"], queryFn: getMpStatus });
  const disconnectMutation = useMutation({
    mutationFn: disconnectMercadoPago,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mp-status"] }),
  });
  const justConnected = params.get("mp") === "conectado";

  const mutation = useMutation({
    mutationFn: () =>
      updateLawyerProfile(lawyer!.id, {
        ...(bio !== null ? { bio } : {}),
        ...(accepts !== null ? { acceptsNewClients: accepts } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-lawyer"] });
      queryClient.invalidateQueries({ queryKey: ["lawyer"] });
    },
  });

  if (!lawyer) return <div className="h-96 animate-pulse rounded-2xl bg-navy-100/50" />;

  const profileUrl = `${window.location.origin}/p/${lawyer.slug}`;
  const currentBio = bio ?? lawyer.bio;
  const currentAccepts = accepts ?? lawyer.acceptsNewClients;

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="font-display text-3xl font-semibold text-navy-800">Configuración</h1>
        <p className="text-sm text-navy-400">Tu perfil público, plan y verificación.</p>
      </div>

      {/* Verificación */}
      <Card className="flex items-start gap-3 p-5">
        {lawyer.isVerified ? (
          <>
            <BadgeCheck className="mt-0.5 size-6 shrink-0 fill-gold-400 text-white" />
            <div>
              <p className="font-semibold text-navy-800">Perfil verificado</p>
              <p className="text-sm text-navy-500">
                Matrícula {lawyer.matriculaNumber} validada. Tu badge dorado es visible en el
                directorio y tu perfil.
              </p>
            </div>
          </>
        ) : (
          <>
            <ShieldAlert className="mt-0.5 size-6 shrink-0 text-warn" />
            <div className="flex-1">
              <p className="font-semibold text-navy-800">Verificación pendiente</p>
              <p className="text-sm text-navy-500">
                Subí una foto de tu credencial profesional y tu documento. El equipo valida en 48 h
                hábiles. (Disponible al conectar el backend — Fase 2.)
              </p>
            </div>
            <Badge tone="warn">Pendiente</Badge>
          </>
        )}
      </Card>

      {/* Plan */}
      <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="text-sm text-navy-400">Tu plan actual</p>
          <p className="font-display text-2xl font-semibold text-navy-800">
            {PLAN_NAMES[lawyer.plan]}
          </p>
        </div>
        <ButtonLink to="/precios" variant="outline">
          Cambiar de plan
        </ButtonLink>
      </Card>

      {/* Cobros */}
      <Card className="space-y-3 p-5">
        <p className="flex items-center gap-2 font-semibold text-navy-800">
          <CreditCard className="size-4 text-gold-500" />
          Cobros
        </p>
        <p className="text-sm leading-relaxed text-navy-500">
          Conectá tu cuenta de MercadoPago para recibir los pagos de tus consultas{" "}
          <strong>directo en tu cuenta</strong>. LegalHub nunca retiene tu dinero
          {lawyer.plan === "free" ? (
            <>
              : en el plan Gratuito se separa automáticamente un 5% de comisión en cada cobro
              (en planes pagos es 0%).
            </>
          ) : (
            <>. En tu plan la comisión de LegalHub es 0% — solo pagás la tarifa de MercadoPago.</>
          )}
        </p>
        {(justConnected || mp?.connected) && (
          <div className="flex items-center gap-2 rounded-lg bg-success-light p-3 text-sm text-success">
            <CheckCircle2 className="size-4 shrink-0" />
            Tu cuenta de MercadoPago está conectada. Los pagos llegan directo a tu cuenta.
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {mp?.connected ? (
            <>
              <Badge tone="green">
                <CheckCircle2 className="size-3.5" />
                Conectado
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="text-danger hover:bg-danger-light"
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
              >
                Desconectar
              </Button>
            </>
          ) : mp?.configured ? (
            <>
              <Button variant="gold" onClick={() => connectMercadoPago()}>
                Conectar MercadoPago
              </Button>
              <Badge tone="warn">No conectado</Badge>
            </>
          ) : (
            <>
              <Button variant="outline" disabled title="MercadoPago aún no habilitado en la plataforma">
                Conectar MercadoPago
              </Button>
              <Badge tone="neutral">Próximamente</Badge>
            </>
          )}
        </div>
        {mp?.connected && (
          <p className="text-xs text-navy-400">
            Mientras no conectes, las reservas pagas se confirman igual (modo demostración) sin
            cargo real.
          </p>
        )}
      </Card>

      {/* Compartir */}
      <Card className="space-y-3 p-5">
        <p className="font-semibold text-navy-800">Tu perfil compartible</p>
        <div className="flex flex-wrap items-center gap-2">
          <code className="flex-1 truncate rounded-lg bg-navy-50 px-3 py-2 font-mono text-xs text-navy-600">
            {profileUrl}
          </code>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(profileUrl);
              alert("Link copiado");
            }}
          >
            <Link2 className="size-4" />
            Copiar
          </Button>
          <Button variant="outline" size="sm" disabled title="Disponible en Fase 2">
            <QrCode className="size-4" />
            Descargar QR
          </Button>
        </div>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`Agendá tu consulta conmigo en LegalHub: ${profileUrl}`)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-sm font-medium text-success underline"
        >
          Compartir por WhatsApp →
        </a>
      </Card>

      {/* Perfil */}
      <Card className="space-y-4 p-5">
        <p className="font-semibold text-navy-800">Perfil público</p>
        <FieldLabel label="Bio profesional" hint={`${currentBio.length}/800 caracteres`}>
          <Textarea rows={5} value={currentBio} onChange={(e) => setBio(e.target.value)} />
        </FieldLabel>
        <FieldLabel label="Teléfono de contacto">
          <Input
            value={phone ?? ""}
            placeholder="+598 99 123 456"
            onChange={(e) => setPhone(e.target.value)}
          />
        </FieldLabel>
        <label className="flex items-center gap-2.5 text-sm font-medium text-navy-700">
          <input
            type="checkbox"
            checked={currentAccepts}
            onChange={(e) => setAccepts(e.target.checked)}
            className="size-4 accent-gold-500"
          />
          Acepto nuevos clientes (al desmarcar, tu agenda se pausa sin borrar el perfil)
        </label>
        <Button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || (bio === null && accepts === null)}
        >
          <Save className="size-4" />
          {mutation.isPending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </Card>
    </div>
  );
}
