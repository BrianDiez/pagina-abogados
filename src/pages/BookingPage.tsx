import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Check,
  CalendarCheck2,
  CreditCard,
  Lock,
  Video,
  Clock,
  ChevronLeft,
  PartyPopper,
} from "lucide-react";
import { getLawyerBySlug, getServices } from "@/api/lawyers";
import { createBooking, payAppointment } from "@/api/appointments";
import { usePageMeta } from "@/lib/seo";
import { MODALITY_LABELS } from "@/lib/constants";
import { cn, formatDateLong, formatMoney, formatTime } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SlotPicker } from "@/features/booking/SlotPicker";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { FieldLabel, Input, Select, Textarea } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import type { Appointment, Service, Slot } from "@/types";

const clientSchema = z.object({
  name: z.string().min(3, "Ingresá tu nombre completo"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(6, "Ingresá un teléfono de contacto"),
  country: z.string().min(2),
  notes: z.string().max(300, "Máximo 300 caracteres").optional(),
});
type ClientForm = z.infer<typeof clientSchema>;

const STEPS = ["Servicio", "Fecha y hora", "Tus datos", "Pago"] as const;

function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2">
      {STEPS.map((label, i) => (
        <li key={label} className="flex flex-1 items-center gap-2">
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
              i < current
                ? "bg-success text-white"
                : i === current
                  ? "bg-navy-700 text-white"
                  : "bg-navy-100 text-navy-400",
            )}
          >
            {i < current ? <Check className="size-4" /> : i + 1}
          </span>
          <span
            className={cn(
              "hidden text-xs font-medium sm:block",
              i === current ? "text-navy-800" : "text-navy-400",
            )}
          >
            {label}
          </span>
          {i < STEPS.length - 1 && <span className="h-px flex-1 bg-navy-100" />}
        </li>
      ))}
    </ol>
  );
}

export function BookingPage() {
  const { slug = "" } = useParams();
  const [params] = useSearchParams();
  const preselectedServiceId = params.get("servicio");

  const [step, setStep] = useState(0);
  const [service, setService] = useState<Service | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [clientData, setClientData] = useState<ClientForm | null>(null);
  const [confirmed, setConfirmed] = useState<Appointment | null>(null);

  const { data: lawyer } = useQuery({
    queryKey: ["lawyer", slug],
    queryFn: () => getLawyerBySlug(slug),
  });

  usePageMeta({ title: "Agendar consulta", noindex: true });

  const { data: services } = useQuery({
    queryKey: ["services", lawyer?.id],
    queryFn: () => getServices(lawyer!.id),
    enabled: !!lawyer,
  });

  // Preselección de servicio via query param
  if (services && preselectedServiceId && !service && step === 0) {
    const match = services.find((s) => s.id === preselectedServiceId);
    if (match) {
      setService(match);
      setStep(1);
    }
  }

  const form = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
    defaultValues: { country: "UY" },
  });

  const payMutation = useMutation({
    mutationFn: async () => {
      if (!lawyer || !service || !slot || !clientData) throw new Error("Faltan datos");
      const appointment = await createBooking({
        lawyerId: lawyer.id,
        serviceId: service.id,
        slot,
        client: {
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          country: clientData.country,
        },
        notes: clientData.notes,
      });
      return payAppointment(appointment.id);
    },
    onSuccess: (appointment) => setConfirmed(appointment),
  });

  if (!lawyer) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-3xl animate-pulse px-4 py-12">
          <div className="h-96 rounded-2xl bg-navy-100/50" />
        </div>
      </div>
    );
  }

  // ── Confirmación final ──
  if (confirmed) {
    const isVideo = confirmed.modality === "video";
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
          <Card className="p-8 text-center">
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-success-light">
              <PartyPopper className="size-8 text-success" />
            </span>
            <h1 className="mt-5 font-display text-3xl font-semibold text-navy-800">
              ¡Consulta confirmada!
            </h1>
            <p className="mt-2 text-navy-500">
              Te enviamos los detalles a <strong>{confirmed.clientEmail}</strong>
            </p>
            <div className="mt-6 space-y-2 rounded-xl bg-navy-50/70 p-5 text-left text-sm">
              <p className="flex justify-between">
                <span className="text-navy-400">Profesional</span>
                <span className="font-medium text-navy-800">
                  {lawyer.title} {lawyer.displayName}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-navy-400">Servicio</span>
                <span className="font-medium text-navy-800">{confirmed.serviceName}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-navy-400">Fecha</span>
                <span className="font-medium capitalize text-navy-800">
                  {formatDateLong(confirmed.startsAt)}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-navy-400">Hora</span>
                <span className="font-mono font-bold text-navy-800">
                  {formatTime(confirmed.startsAt)} hs
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-navy-400">Pagado</span>
                <span className="font-mono font-bold text-success">
                  {formatMoney(confirmed.price, confirmed.currency)}
                </span>
              </p>
            </div>
            {isVideo && confirmed.videoRoomUrl && (
              <p className="mt-4 rounded-xl bg-gold-50 p-4 text-sm text-navy-600">
                <Video className="mr-1 inline size-4 text-gold-600" />
                La videollamada se abre desde el link del email, disponible 5 minutos antes del
                turno.
              </p>
            )}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <ButtonLink to={`/p/${lawyer.slug}`} variant="outline">
                Volver al perfil
              </ButtonLink>
              <ButtonLink to="/registro" variant="primary">
                Crear cuenta para gestionar mis consultas
              </ButtonLink>
            </div>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link
          to={`/p/${lawyer.slug}`}
          className="mb-5 inline-flex items-center gap-1 text-sm text-navy-500 hover:text-navy-800"
        >
          <ChevronLeft className="size-4" />
          Volver al perfil
        </Link>

        <Card className="mb-6 flex items-center gap-4 p-5">
          <Avatar name={lawyer.displayName} src={lawyer.photoUrl} size="md" />
          <div>
            <p className="font-display text-lg font-semibold text-navy-800">
              Agendar con {lawyer.title} {lawyer.displayName}
            </p>
            <p className="text-sm text-navy-400">
              {lawyer.city} · Cancelación gratis hasta {lawyer.cancellationPolicyHours} h antes
            </p>
          </div>
        </Card>

        <Stepper current={step} />

        <div className="mt-8">
          {/* Paso 1: Servicio */}
          {step === 0 && (
            <div className="space-y-3">
              {(services ?? []).map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setService(s);
                    setSlot(null);
                    setStep(1);
                  }}
                  className={cn(
                    "w-full rounded-2xl border bg-white p-5 text-left transition-all cursor-pointer",
                    service?.id === s.id
                      ? "border-gold-400 shadow-card-hover"
                      : "border-navy-100 hover:border-navy-300 hover:shadow-card",
                  )}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-display text-lg font-semibold text-navy-800">{s.name}</p>
                      <p className="mt-0.5 text-sm text-navy-500">{s.description}</p>
                      <p className="mt-1.5 flex items-center gap-3 text-xs text-navy-400">
                        <span>
                          <Clock className="mr-1 inline size-3.5" />
                          {s.durationMinutes} min
                        </span>
                        <Badge tone="navy">{MODALITY_LABELS[s.modality]}</Badge>
                      </p>
                    </div>
                    <span className="font-mono text-xl font-bold text-navy-800">
                      {formatMoney(s.price, s.currency)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Paso 2: Slot */}
          {step === 1 && service && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-navy-500">
                  <strong className="text-navy-800">{service.name}</strong> ·{" "}
                  {service.durationMinutes} min ·{" "}
                  <span className="font-mono font-semibold">
                    {formatMoney(service.price, service.currency)}
                  </span>
                </p>
                <Button variant="ghost" size="sm" onClick={() => setStep(0)}>
                  Cambiar servicio
                </Button>
              </div>
              <SlotPicker
                lawyerId={lawyer.id}
                serviceId={service.id}
                selected={slot}
                onSelect={setSlot}
              />
              <div className="mt-6 flex justify-end">
                <Button disabled={!slot} onClick={() => setStep(2)} size="lg">
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {/* Paso 3: Datos del cliente */}
          {step === 2 && (
            <form
              onSubmit={form.handleSubmit((data) => {
                setClientData(data);
                setStep(3);
              })}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldLabel label="Nombre completo" required error={form.formState.errors.name?.message}>
                  <Input placeholder="Ana García" {...form.register("name")} />
                </FieldLabel>
                <FieldLabel label="Email" required error={form.formState.errors.email?.message}>
                  <Input type="email" placeholder="ana@email.com" {...form.register("email")} />
                </FieldLabel>
                <FieldLabel label="Teléfono" required error={form.formState.errors.phone?.message}>
                  <Input placeholder="+598 99 123 456" {...form.register("phone")} />
                </FieldLabel>
                <FieldLabel label="País" required>
                  <Select {...form.register("country")}>
                    <option value="UY">Uruguay</option>
                    <option value="AR">Argentina</option>
                    <option value="BR">Brasil</option>
                    <option value="CL">Chile</option>
                    <option value="OTRO">Otro</option>
                  </Select>
                </FieldLabel>
              </div>
              <FieldLabel
                label="Contanos brevemente tu consulta"
                hint="Opcional, máximo 300 caracteres. Ayuda al profesional a preparar la reunión."
                error={form.formState.errors.notes?.message}
              >
                <Textarea
                  placeholder="Ej.: Me despidieron la semana pasada sin causa y quiero saber qué me corresponde…"
                  {...form.register("notes")}
                />
              </FieldLabel>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  Atrás
                </Button>
                <Button type="submit" size="lg">
                  Continuar al pago
                </Button>
              </div>
            </form>
          )}

          {/* Paso 4: Pago */}
          {step === 3 && service && slot && clientData && (
            <div className="grid gap-6 md:grid-cols-[1fr_280px]">
              <Card className="p-6">
                <h3 className="flex items-center gap-2 font-display text-xl font-semibold text-navy-800">
                  <CreditCard className="size-5 text-gold-500" />
                  Pago seguro
                </h3>
                <p className="mt-1 text-sm text-navy-400">
                  Elegí el método. El pago confirma tu turno al instante.
                </p>
                <div className="mt-5 space-y-2.5">
                  {["MercadoPago — tarjeta, QR o transferencia", "PayPal — tarjetas internacionales"].map(
                    (m, i) => (
                      <label
                        key={m}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-navy-200 p-4 text-sm font-medium text-navy-700 transition-colors hover:border-gold-400 has-checked:border-gold-500 has-checked:bg-gold-50"
                      >
                        <input
                          type="radio"
                          name="payment-method"
                          defaultChecked={i === 0}
                          className="accent-gold-500"
                        />
                        {m}
                      </label>
                    ),
                  )}
                </div>
                <p className="mt-4 rounded-lg bg-navy-50 p-3 text-xs leading-relaxed text-navy-500">
                  Política de cancelación: gratis hasta {lawyer.cancellationPolicyHours} h antes del
                  turno.
                  {lawyer.cancellationLateFeePct > 0 &&
                    ` Después se retiene el ${lawyer.cancellationLateFeePct}% del pago.`}{" "}
                  La no presentación no se reembolsa.
                </p>
                {payMutation.isError && (
                  <p className="mt-3 rounded-lg bg-danger-light p-3 text-sm text-danger">
                    {(payMutation.error as Error).message}
                  </p>
                )}
                <Button
                  size="lg"
                  variant="gold"
                  className="mt-5 w-full"
                  onClick={() => payMutation.mutate()}
                  disabled={payMutation.isPending}
                >
                  <Lock className="size-4" />
                  {payMutation.isPending
                    ? "Procesando pago…"
                    : `Pagar ${formatMoney(service.price, service.currency)}`}
                </Button>
                <p className="mt-2 text-center text-[11px] text-navy-300">
                  Demo: el pago es simulado, no se realiza ningún cargo.
                </p>
              </Card>

              <Card className="h-fit space-y-3 p-5 text-sm">
                <h4 className="flex items-center gap-2 font-semibold text-navy-800">
                  <CalendarCheck2 className="size-4 text-gold-500" />
                  Resumen
                </h4>
                <p className="flex justify-between">
                  <span className="text-navy-400">Servicio</span>
                  <span className="text-right font-medium text-navy-700">{service.name}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-navy-400">Fecha</span>
                  <span className="text-right font-medium capitalize text-navy-700">
                    {formatDateLong(slot.start)}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="text-navy-400">Hora</span>
                  <span className="font-mono font-bold text-navy-700">{formatTime(slot.start)} hs</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-navy-400">Modalidad</span>
                  <span className="font-medium text-navy-700">{MODALITY_LABELS[service.modality]}</span>
                </p>
                <div className="border-t border-navy-100 pt-3">
                  <p className="flex justify-between text-base">
                    <span className="font-medium text-navy-800">Total</span>
                    <span className="font-mono font-bold text-navy-800">
                      {formatMoney(service.price, service.currency)}
                    </span>
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="w-full" onClick={() => setStep(2)}>
                  Editar datos
                </Button>
              </Card>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
