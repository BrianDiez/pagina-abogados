import { useState } from "react";
import { Check, X } from "lucide-react";
import { PLANS } from "@/lib/constants";
import { usePageMeta } from "@/lib/seo";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

export function PricingPage() {
  usePageMeta({
    title: "Planes y precios para profesionales",
    description:
      "Plan gratuito para siempre, Esencial US$ 9, Profesional US$ 19 con videollamada integrada y Estudio US$ 39. 14 días de prueba sin tarjeta, 0% de comisión en planes pagos.",
    path: "/precios",
  });
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionTitle
          center
          eyebrow="Planes y precios"
          title="Un plan para cada etapa de tu carrera"
          subtitle="Todos los planes pagos incluyen 14 días de prueba gratis, sin tarjeta. Precios en USD, cobrados en tu moneda local."
        />

        <div className="mt-8 flex items-center justify-center gap-3">
          <span className={cn("text-sm", !annual ? "font-semibold text-navy-800" : "text-navy-400")}>
            Mensual
          </span>
          <button
            onClick={() => setAnnual((v) => !v)}
            className={cn(
              "relative h-7 w-12 rounded-full transition-colors cursor-pointer",
              annual ? "bg-navy-700" : "bg-navy-200",
            )}
            aria-label="Cambiar facturación"
          >
            <span
              className={cn(
                "absolute top-1 size-5 rounded-full bg-white shadow transition-all",
                annual ? "left-6" : "left-1",
              )}
            />
          </button>
          <span className={cn("text-sm", annual ? "font-semibold text-navy-800" : "text-navy-400")}>
            Anual <span className="text-success">(2 meses gratis)</span>
          </span>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan) => {
            const price = annual ? plan.annualUsd : plan.monthlyUsd;
            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative flex flex-col p-6",
                  plan.highlight && "border-2 border-gold-400 shadow-card-hover",
                )}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold-400 px-3 py-0.5 text-xs font-bold text-navy-900">
                    ⭐ Recomendado
                  </span>
                )}
                <h3 className="font-display text-2xl font-semibold text-navy-800">{plan.name}</h3>
                <p className="mt-1 min-h-10 text-sm text-navy-400">{plan.tagline}</p>
                <p className="mt-4">
                  <span className="font-mono text-4xl font-bold text-navy-800">
                    ${price ?? "—"}
                  </span>
                  <span className="text-sm text-navy-400"> USD / {annual ? "año" : "mes"}</span>
                </p>
                {plan.anchor && (
                  <p className="mt-1 text-xs font-medium text-gold-600">{plan.anchor}</p>
                )}
                <ButtonLink
                  to="/registro/profesional"
                  variant={plan.highlight ? "gold" : "outline"}
                  className="mt-5 w-full"
                >
                  {plan.id === "free" ? "Empezar gratis" : "Probar 14 días gratis"}
                </ButtonLink>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-navy-600">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                  {plan.missing?.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-navy-300">
                      <X className="mt-0.5 size-4 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>

        <Card className="mt-8 flex flex-col items-center justify-between gap-4 bg-navy-900 p-8 text-center sm:flex-row sm:text-left">
          <div>
            <h3 className="font-display text-2xl font-semibold text-white">Enterprise</h3>
            <p className="mt-1 text-sm text-navy-200">
              Colegios de abogados, facultades de derecho y consultoras: profesionales ilimitados,
              white-label y SLA dedicado.
            </p>
          </div>
          <ButtonLink to="/registro/profesional" variant="gold">
            Hablar con el equipo
          </ButtonLink>
        </Card>

        <p className="mt-8 text-center text-xs text-navy-400">
          Los precios son en USD de referencia: el cobro se hace en tu moneda local vía
          MercadoPago. Extras: Destacado en directorio US$ 15/mes · Storage adicional US$ 5 por
          10 GB · Comisión del 5% por transacción solo en el plan Gratuito (en planes pagos,
          0% — solo pagás la comisión propia de la pasarela).
        </p>
      </section>

      <Footer />
    </div>
  );
}
