import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  CalendarCheck,
  CreditCard,
  MessageCircleOff,
  SearchX,
  Video,
  ShieldCheck,
  Star,
  TrendingUp,
  ChevronDown,
  ArrowRight,
  Wallet,
  Clock,
} from "lucide-react";
import { listLawyers } from "@/api/lawyers";
import { faqJsonLd, organizationJsonLd, usePageMeta } from "@/lib/seo";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LawyerCard } from "@/components/LawyerCard";
import { ButtonLink } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/misc";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const painPoints = [
  {
    icon: MessageCircleOff,
    problem: "¿Seguís coordinando turnos por WhatsApp a las 11 de la noche?",
    solution: "Agenda online con tus horarios: tus clientes reservan solos y vos recuperás tus noches.",
  },
  {
    icon: SearchX,
    problem: "¿Tus clientes no te encuentran en Google?",
    solution: "Perfil profesional indexado y optimizado para búsquedas por especialidad y ciudad.",
  },
  {
    icon: Wallet,
    problem: "¿Cobrás en efectivo y sin registro?",
    solution: "Cobro online al agendar con MercadoPago: recibo automático y dashboard de ingresos.",
  },
  {
    icon: Video,
    problem: "¿La videollamada es por Zoom con link manual?",
    solution: "Sala de video integrada que se crea sola al confirmarse el turno. Sin links sueltos.",
  },
];

const steps = [
  {
    n: "1",
    title: "Creá tu perfil verificado",
    text: "Cargá tu matrícula, especialidades y experiencia. Verificamos tu identidad profesional en 48 horas.",
  },
  {
    n: "2",
    title: "Configurá servicios y horarios",
    text: "Definí qué consultas ofrecés, a qué precio y cuándo. La agenda se administra sola.",
  },
  {
    n: "3",
    title: "Compartí y empezá a cobrar",
    text: "Tu perfil es tu landing page: compartilo en redes, WhatsApp o tu web y recibí consultas pagas.",
  },
];

const faqs = [
  {
    q: "¿Puedo agendar sin cobrar, o cobrar sin agendar?",
    a: "Sí a ambas. Podés ofrecer servicios gratuitos (primera llamada de orientación) y también generar links de pago sueltos para cobrar trabajos fuera de la agenda.",
  },
  {
    q: "¿Es legal publicitar mis servicios como abogado en la plataforma?",
    a: "Sí. LegalHub es un directorio profesional con información objetiva (matrícula, especialidad, experiencia), el formato aceptado por las normas deontológicas de los colegios de la región. No usamos publicidad comparativa ni promesas de resultados.",
  },
  {
    q: "¿Cómo funciona la videollamada?",
    a: "Al confirmarse un turno online se genera automáticamente una sala privada. Vos y tu cliente reciben el link por email, y 5 minutos antes aparece el botón \"Entrar a la sala\". Funciona en el navegador, también desde el celular, sin instalar nada.",
  },
  {
    q: "¿Cuándo recibo el dinero de mis consultas?",
    a: "El pago va directo a tu cuenta de MercadoPago al confirmarse el turno, según los plazos de acreditación de tu cuenta (inmediato a 14 días según tu configuración). LegalHub no retiene tu dinero en los planes pagos.",
  },
  {
    q: "¿Hay comisión sobre los pagos?",
    a: "En el plan Gratuito, 5% + la comisión de la pasarela. En todos los planes pagos la comisión de LegalHub es 0%: solo pagás la suscripción mensual y la comisión propia de MercadoPago.",
  },
  {
    q: "¿Puedo cancelar cuando quiera?",
    a: "Sí, sin permanencia ni penalidades. Si cancelás, tu perfil pasa al plan Gratuito y no perdés tu historial ni tus reseñas.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen((v) => !v)}
      className="w-full rounded-xl border border-navy-100 bg-white px-5 py-4 text-left transition-shadow hover:shadow-card cursor-pointer"
    >
      <span className="flex items-center justify-between gap-4">
        <span className="font-medium text-navy-800">{q}</span>
        <ChevronDown className={cn("size-5 shrink-0 text-gold-500 transition-transform", open && "rotate-180")} />
      </span>
      {open && <p className="mt-3 text-sm leading-relaxed text-navy-500">{a}</p>}
    </button>
  );
}

export function LandingPage() {
  usePageMeta({
    title: "LegalHub — Tu consultoría legal, online y profesional",
    description:
      "La plataforma para abogados y escribanos en Uruguay y Argentina: agenda online, cobro de consultas, videollamada integrada y reseñas verificadas. Creá tu perfil gratis.",
    path: "/",
    jsonLd: [organizationJsonLd, faqJsonLd(faqs)],
  });

  const { data: featured } = useQuery({
    queryKey: ["lawyers", "featured"],
    queryFn: () => listLawyers({ sort: "rating" }),
    select: (list) => list.filter((l) => l.isVerified).slice(0, 3),
  });

  return (
    <div className="min-h-screen">
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden bg-navy-900">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, #C9A96E 0, transparent 40%), radial-gradient(circle at 80% 70%, #5F7AA8 0, transparent 45%)",
          }}
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-gold-400/10 px-3.5 py-1 text-xs font-medium text-gold-300">
              <ShieldCheck className="size-3.5" />
              Para abogados, escribanos y notarios de Uruguay y Argentina
            </p>
            <h1 className="font-display text-4xl font-semibold leading-[1.1] text-white sm:text-5xl lg:text-6xl">
              Tu consultoría legal,
              <span className="text-gold-400"> online y profesional</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-navy-100">
              La plataforma para profesionales del derecho que quieren crecer.
              Agenda, cobros, videollamada y recomendaciones — todo desde un solo lugar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink to="/registro/profesional" variant="gold" size="lg">
                Crear mi perfil gratis
                <ArrowRight className="size-4" />
              </ButtonLink>
              <ButtonLink
                to="/abogados"
                variant="outline"
                size="lg"
                className="border-navy-500 bg-transparent text-white hover:bg-navy-800 hover:border-navy-400"
              >
                Busco un profesional
              </ButtonLink>
            </div>
            <p className="mt-6 text-sm text-navy-300">
              14 días de prueba en planes pagos · Sin tarjeta · Cancelás cuando quieras
            </p>
          </motion.div>

          {/* Mockup mini-dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="hidden lg:block"
          >
            <div className="rounded-2xl border border-navy-700 bg-navy-800/80 p-5 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between border-b border-navy-700 pb-3">
                <p className="text-sm font-medium text-white">Agenda de hoy</p>
                <span className="rounded-full bg-success/20 px-2.5 py-0.5 text-xs text-emerald-300">
                  3 turnos confirmados
                </span>
              </div>
              {[
                { t: "09:00", name: "Mariana L.", svc: "Consulta inicial", paid: "$U 2.400" },
                { t: "10:00", name: "Romina A.", svc: "Tenencia compartida", paid: "$U 2.400" },
                { t: "14:30", name: "Diego F.", svc: "Seguimiento", paid: "$U 1.500" },
              ].map((row) => (
                <div key={row.t} className="flex items-center gap-3 border-b border-navy-700/60 py-3 last:border-0">
                  <span className="font-mono text-sm font-bold text-gold-400">{row.t}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{row.name}</p>
                    <p className="text-xs text-navy-300">{row.svc}</p>
                  </div>
                  <span className="font-mono text-xs text-emerald-300">{row.paid}</span>
                  <Video className="size-4 text-navy-300" />
                </div>
              ))}
              <div className="mt-3 flex items-center justify-between rounded-xl bg-navy-900/80 px-4 py-3">
                <span className="text-xs text-navy-300">Ingresos del mes</span>
                <span className="font-mono text-lg font-bold text-white">$U 86.300</span>
                <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
                  <TrendingUp className="size-3.5" /> +24%
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* PAIN POINTS */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <SectionTitle
          center
          eyebrow="Por qué existimos"
          title="Ejercés el derecho. Nosotros nos ocupamos del resto."
          subtitle="Cuatro problemas que todo profesional independiente reconoce — y cómo los resolvemos."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {painPoints.map(({ icon: Icon, problem, solution }) => (
            <Card key={problem} hover className="p-6">
              <Icon className="size-7 text-gold-500" />
              <h3 className="mt-4 font-display text-xl font-semibold text-navy-800">{problem}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-500">{solution}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionTitle
            center
            eyebrow="Cómo funciona"
            title="De cero a recibir consultas pagas en 5 minutos"
          />
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="relative">
                <span className="font-display text-6xl font-bold text-gold-200">{s.n}</span>
                <h3 className="mt-2 font-display text-2xl font-semibold text-navy-800">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-500">{s.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 grid gap-5 rounded-2xl bg-navy-50/60 p-6 sm:grid-cols-3">
            {[
              { icon: CalendarCheck, label: "Agenda con confirmación y recordatorios automáticos" },
              { icon: CreditCard, label: "Cobro al agendar: se acabaron los faltazos gratis" },
              { icon: Star, label: "Reseñas verificadas que construyen tu reputación" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-navy-700">
                  <Icon className="size-5 text-gold-400" />
                </span>
                <p className="text-sm font-medium text-navy-700">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROFESIONALES DESTACADOS */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionTitle
            eyebrow="Directorio"
            title="Profesionales verificados, listos para atenderte"
            subtitle="Cada perfil con matrícula validada y reseñas de clientes reales."
          />
          <ButtonLink to="/abogados" variant="outline">
            Ver directorio completo
            <ArrowRight className="size-4" />
          </ButtonLink>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {(featured ?? []).map((l) => (
            <LawyerCard key={l.id} lawyer={l} />
          ))}
        </div>
      </section>

      {/* CTA banda + FAQ */}
      <section className="bg-navy-900 py-16">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-4 text-center sm:px-6">
          <Clock className="size-8 text-gold-400" />
          <h2 className="mt-4 font-display text-3xl font-semibold text-white sm:text-4xl">
            Tu WhatsApp no es tu CRM. Tus conocidos no son tu marketing.
          </h2>
          <p className="mt-3 max-w-xl text-navy-100">
            LegalHub es la plataforma que los profesionales del derecho en LATAM necesitaban
            desde siempre. Empezá gratis hoy.
          </p>
          <ButtonLink to="/registro/profesional" variant="gold" size="lg" className="mt-7">
            Crear mi perfil gratis
          </ButtonLink>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <SectionTitle center eyebrow="Preguntas frecuentes" title="Lo que todos preguntan antes de empezar" />
        <div className="mt-10 space-y-3">
          {faqs.map((f) => (
            <FaqItem key={f.q} {...f} />
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-navy-400">
          ¿Más dudas? Mirá los <Link to="/precios" className="font-medium text-navy-700 underline">planes y precios</Link>.
        </p>
      </section>

      <Footer />
    </div>
  );
}
