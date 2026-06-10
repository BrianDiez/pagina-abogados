import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin,
  Clock,
  GraduationCap,
  Video,
  Building2,
  Phone,
  FileText,
  ShieldCheck,
  Share2,
  ThumbsUp,
} from "lucide-react";
import { getLawyerBySlug, getServices } from "@/api/lawyers";
import { listReviews } from "@/api/reviews";
import { attorneyJsonLd, usePageMeta } from "@/lib/seo";
import { specialtyLabel, MODALITY_LABELS } from "@/lib/constants";
import { professionalTypeLabel } from "@/i18n";
import { formatMoney, formatDateShort } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Avatar } from "@/components/ui/Avatar";
import { AvailableTodayDot, Badge, VerifiedBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { RatingSummary, Stars } from "@/components/ui/Rating";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/misc";
import type { Modality, Service } from "@/types";

const modalityIcon: Record<Modality, typeof Video> = {
  video: Video,
  in_person: Building2,
  phone: Phone,
  async: FileText,
};

function ServiceRow({ service, slug }: { service: Service; slug: string }) {
  const Icon = modalityIcon[service.modality];
  return (
    <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-lg font-semibold text-navy-800">{service.name}</h3>
          <Badge tone="navy" className="gap-1">
            <Icon className="size-3" />
            {MODALITY_LABELS[service.modality]}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-navy-500">{service.description}</p>
        <p className="mt-1.5 text-xs text-navy-400">
          <Clock className="mr-1 inline size-3.5" />
          {service.durationMinutes} minutos
        </p>
      </div>
      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
        <span className="font-mono text-xl font-bold text-navy-800">
          {formatMoney(service.price, service.currency)}
        </span>
        <ButtonLink to={`/p/${slug}/agendar?servicio=${service.id}`} variant="gold" size="sm">
          Agendar
        </ButtonLink>
      </div>
    </Card>
  );
}

export function ProfilePage() {
  const { slug = "" } = useParams();

  const { data: lawyer, isLoading } = useQuery({
    queryKey: ["lawyer", slug],
    queryFn: () => getLawyerBySlug(slug),
  });
  const { data: services } = useQuery({
    queryKey: ["services", lawyer?.id],
    queryFn: () => getServices(lawyer!.id),
    enabled: !!lawyer,
  });
  const { data: reviews } = useQuery({
    queryKey: ["reviews", lawyer?.id],
    queryFn: () => listReviews(lawyer!.id),
    enabled: !!lawyer,
  });

  usePageMeta({
    title: lawyer
      ? `${lawyer.title} ${lawyer.displayName} — ${professionalTypeLabel(lawyer.professionalType, lawyer.country)} en ${lawyer.city}`
      : "Perfil profesional",
    description: lawyer
      ? `${professionalTypeLabel(lawyer.professionalType, lawyer.country)} en ${lawyer.city} especializado en ${lawyer.specialties.map(specialtyLabel).slice(0, 3).join(", ")}. ${lawyer.yearsExperience} años de experiencia. Agendá online con pago seguro.`
      : undefined,
    path: `/p/${slug}`,
    jsonLd: lawyer
      ? attorneyJsonLd({
          name: lawyer.displayName,
          title: lawyer.title,
          city: lawyer.city,
          country: lawyer.country,
          slug: lawyer.slug,
          photoUrl: lawyer.photoUrl,
          specialties: lawyer.specialties.map(specialtyLabel),
          rating: lawyer.stats.avgRating,
          reviewCount: lawyer.stats.reviewCount,
          isNotary: lawyer.professionalType === "notary",
        })
      : undefined,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-5xl animate-pulse space-y-4 px-4 py-12 sm:px-6">
          <div className="h-40 rounded-2xl bg-navy-100/50" />
          <div className="h-72 rounded-2xl bg-navy-100/50" />
        </div>
      </div>
    );
  }

  if (!lawyer) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6">
          <EmptyState
            title="Perfil no encontrado"
            subtitle="El profesional que buscás no existe o desactivó su perfil."
            action={<ButtonLink to="/abogados">Ver directorio</ButtonLink>}
          />
        </div>
        <Footer />
      </div>
    );
  }

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: `${lawyer!.title} ${lawyer!.displayName} — LegalHub`, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copiado al portapapeles");
    }
  }

  return (
    <div className="min-h-screen">
      <Header />

      {/* Cabecera del perfil */}
      <section className="border-b border-navy-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <Avatar name={lawyer.displayName} src={lawyer.photoUrl} size="xl" />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl font-semibold text-navy-800 sm:text-4xl">
                  {lawyer.title} {lawyer.displayName}
                </h1>
                {lawyer.isVerified && <VerifiedBadge />}
              </div>
              <p className="mt-1 text-navy-500">
                {professionalTypeLabel(lawyer.professionalType, lawyer.country)} ·{" "}
                {lawyer.yearsExperience} años de experiencia · Mat. {lawyer.matriculaNumber}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-navy-400">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-4" />
                  {lawyer.city}, {lawyer.country === "UY" ? "Uruguay" : "Argentina"}
                </span>
                <RatingSummary rating={lawyer.stats.avgRating} count={lawyer.stats.reviewCount} />
                {lawyer.availableToday && <AvailableTodayDot />}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {lawyer.specialties.map((s) => (
                  <Link key={s} to={`/abogados?especialidad=${s}`}>
                    <Badge tone="navy" className="hover:bg-navy-100 transition-colors">
                      {specialtyLabel(s)}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex gap-2 sm:flex-col">
              <Button variant="outline" size="sm" onClick={share}>
                <Share2 className="size-4" />
                Compartir
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-10">
          {/* Bio */}
          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold text-navy-800">Sobre mí</h2>
            <p className="leading-relaxed text-navy-600">{lawyer.bio}</p>
            {lawyer.highlights.length > 0 && (
              <ul className="mt-4 space-y-2">
                {lawyer.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2 text-sm text-navy-600">
                    <GraduationCap className="mt-0.5 size-4 shrink-0 text-gold-500" />
                    {h}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Servicios */}
          <section>
            <h2 className="mb-4 font-display text-2xl font-semibold text-navy-800">
              Servicios y tarifas
            </h2>
            <div className="space-y-3">
              {(services ?? []).map((s) => (
                <ServiceRow key={s.id} service={s} slug={lawyer.slug} />
              ))}
              {services && services.length === 0 && (
                <EmptyState title="Este profesional aún no publicó servicios" />
              )}
            </div>
          </section>

          {/* Reseñas */}
          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-semibold text-navy-800">
                Reseñas de clientes
              </h2>
              {lawyer.stats.recommendPct !== null && lawyer.stats.reviewCount > 0 && (
                <Badge tone="green" className="gap-1 text-sm px-3 py-1">
                  <ThumbsUp className="size-3.5" />
                  {lawyer.stats.recommendPct}% lo recomienda
                </Badge>
              )}
            </div>
            <div className="space-y-4">
              {(reviews ?? []).map((r) => (
                <Card key={r.id} className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.clientName} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-navy-800">{r.clientName}</p>
                        <p className="text-xs text-navy-400">
                          {formatDateShort(r.createdAt)}
                          {r.specialtyConsulted && ` · ${specialtyLabel(r.specialtyConsulted)}`}
                        </p>
                      </div>
                    </div>
                    <Stars value={r.ratingOverall} />
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-navy-600">{r.textReview}</p>
                  {r.lawyerResponse && (
                    <div className="mt-3 rounded-xl bg-navy-50 p-3.5">
                      <p className="text-xs font-semibold text-navy-700">
                        Respuesta de {lawyer.title} {lawyer.displayName}
                      </p>
                      <p className="mt-1 text-sm text-navy-600">{r.lawyerResponse}</p>
                    </div>
                  )}
                </Card>
              ))}
              {reviews && reviews.length === 0 && (
                <EmptyState
                  title="Aún no hay reseñas"
                  subtitle="Las reseñas solo pueden dejarlas clientes que completaron una consulta paga."
                />
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-5">
            <p className="text-sm text-navy-400">Consultas desde</p>
            {lawyer.minPrice && (
              <p className="font-mono text-2xl font-bold text-navy-800">
                {formatMoney(lawyer.minPrice.amount, lawyer.minPrice.currency)}
              </p>
            )}
            <ButtonLink
              to={`/p/${lawyer.slug}/agendar`}
              variant="gold"
              size="lg"
              className="mt-4 w-full"
            >
              Agendar consulta
            </ButtonLink>
            {!lawyer.acceptsNewClients && (
              <p className="mt-2 text-center text-xs text-warn">
                Agenda pausada temporalmente para nuevos clientes
              </p>
            )}
            <p className="mt-3 text-center text-xs text-navy-400">
              Pago seguro · Confirmación inmediata
            </p>
          </Card>

          <Card className="space-y-3 p-5 text-sm">
            <p className="font-semibold text-navy-800">Modalidades</p>
            <div className="flex flex-wrap gap-1.5">
              {lawyer.modalities.map((m) => (
                <Badge key={m} tone="neutral">
                  {MODALITY_LABELS[m]}
                </Badge>
              ))}
            </div>
            <p className="pt-1 font-semibold text-navy-800">Idiomas</p>
            <p className="text-navy-500">{lawyer.languages.join(" · ")}</p>
            <p className="pt-1 font-semibold text-navy-800">Política de cancelación</p>
            <p className="text-navy-500">
              Cancelación sin costo hasta {lawyer.cancellationPolicyHours} h antes.
              {lawyer.cancellationLateFeePct > 0
                ? ` Cancelación tardía: se retiene ${lawyer.cancellationLateFeePct}% del pago.`
                : " Sin retención por cancelación tardía."}
            </p>
          </Card>

          <Card className="flex items-start gap-3 bg-navy-50/60 p-4">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" />
            <p className="text-xs leading-relaxed text-navy-500">
              {lawyer.isVerified
                ? "Matrícula profesional verificada por el equipo de LegalHub."
                : "Este perfil todavía no completó la verificación de matrícula."}
            </p>
          </Card>
        </aside>
      </div>

      <Footer />
    </div>
  );
}
