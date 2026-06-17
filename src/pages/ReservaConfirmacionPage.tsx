import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PartyPopper, Clock3, XCircle, Video } from "lucide-react";
import { getBookingStatus } from "@/api/payments";
import { usePageMeta } from "@/lib/seo";
import { formatDateLong, formatMoney, formatTime } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";

export function ReservaConfirmacionPage() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const pago = params.get("pago"); // ok | pendiente | error
  usePageMeta({ title: "Estado de tu reserva", noindex: true });

  const { data: appt, isLoading } = useQuery({
    queryKey: ["booking-status", id],
    queryFn: () => getBookingStatus(id),
    // el webhook puede tardar unos segundos en confirmar; reintenta un par de veces
    refetchInterval: (q) => (q.state.data?.status === "confirmed" ? false : 4000),
  });

  const confirmado = appt?.status === "confirmed" || appt?.paymentStatus === "paid";
  const fallo = pago === "error";

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <Card className="p-8 text-center">
          {isLoading ? (
            <div className="h-40 animate-pulse rounded-xl bg-navy-100/50" />
          ) : fallo ? (
            <>
              <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-danger-light">
                <XCircle className="size-8 text-danger" />
              </span>
              <h1 className="mt-5 font-display text-3xl font-semibold text-navy-800">
                El pago no se completó
              </h1>
              <p className="mt-2 text-navy-500">
                No se realizó ningún cargo. Podés intentar de nuevo cuando quieras.
              </p>
              {appt?.lawyerSlug && (
                <ButtonLink to={`/p/${appt.lawyerSlug}/agendar`} className="mt-6">
                  Volver a intentar
                </ButtonLink>
              )}
            </>
          ) : confirmado ? (
            <>
              <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-success-light">
                <PartyPopper className="size-8 text-success" />
              </span>
              <h1 className="mt-5 font-display text-3xl font-semibold text-navy-800">
                ¡Consulta confirmada!
              </h1>
              <p className="mt-2 text-navy-500">Te enviamos los detalles por email.</p>
              <div className="mt-6 space-y-2 rounded-xl bg-navy-50/70 p-5 text-left text-sm">
                <p className="flex justify-between">
                  <span className="text-navy-400">Profesional</span>
                  <span className="font-medium text-navy-800">{appt?.lawyerName}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-navy-400">Servicio</span>
                  <span className="font-medium text-navy-800">{appt?.serviceName}</span>
                </p>
                {appt?.startsAt && (
                  <p className="flex justify-between">
                    <span className="text-navy-400">Fecha y hora</span>
                    <span className="font-medium capitalize text-navy-800">
                      {formatDateLong(appt.startsAt)} · {formatTime(appt.startsAt)} hs
                    </span>
                  </p>
                )}
                {appt?.price !== undefined && (
                  <p className="flex justify-between">
                    <span className="text-navy-400">Pagado</span>
                    <span className="font-mono font-bold text-success">
                      {formatMoney(appt.price, appt.currency ?? "UYU")}
                    </span>
                  </p>
                )}
              </div>
              {appt?.videoRoomUrl && (
                <p className="mt-4 rounded-xl bg-gold-50 p-4 text-sm text-navy-600">
                  <Video className="mr-1 inline size-4 text-gold-600" />
                  La videollamada se abre desde el link del email, 5 minutos antes del turno.
                </p>
              )}
              <ButtonLink to={appt?.lawyerSlug ? `/p/${appt.lawyerSlug}` : "/"} variant="outline" className="mt-6">
                Volver al perfil
              </ButtonLink>
            </>
          ) : (
            <>
              <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-warn-light">
                <Clock3 className="size-8 text-warn" />
              </span>
              <h1 className="mt-5 font-display text-3xl font-semibold text-navy-800">
                Estamos confirmando tu pago
              </h1>
              <p className="mt-2 text-navy-500">
                MercadoPago está procesando la operación. En cuanto se acredite, vas a recibir la
                confirmación por email. Podés cerrar esta página.
              </p>
              <Button variant="outline" className="mt-6" onClick={() => window.location.reload()}>
                Actualizar estado
              </Button>
            </>
          )}
        </Card>
        <p className="mt-4 text-center text-xs text-navy-400">
          <Link to="/" className="underline">
            Ir al inicio
          </Link>
        </p>
      </div>
      <Footer />
    </div>
  );
}
