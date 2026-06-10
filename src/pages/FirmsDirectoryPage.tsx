import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Users, Building2, ArrowRight } from "lucide-react";
import { listFirms } from "@/api/firms";
import { usePageMeta } from "@/lib/seo";
import { specialtyLabel } from "@/lib/constants";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, VerifiedBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/misc";

export function FirmsDirectoryPage() {
  usePageMeta({
    title: "Estudios jurídicos en Uruguay y Argentina",
    description:
      "Conocé los estudios jurídicos de LegalHub: equipos verificados con agenda online. Contactá al estudio y ellos te derivan al profesional adecuado.",
    path: "/estudios",
  });

  const { data: firms, isLoading } = useQuery({ queryKey: ["firms"], queryFn: listFirms });

  return (
    <div className="min-h-screen">
      <Header />

      <section className="border-b border-navy-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h1 className="font-display text-3xl font-semibold text-navy-800 sm:text-4xl">
            Estudios jurídicos
          </h1>
          <p className="mt-2 max-w-2xl text-navy-500">
            Equipos de profesionales bajo una misma firma. Escribile al estudio y ellos derivan
            tu caso al especialista indicado — o agendá directo con cualquiera de sus miembros.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-52 animate-pulse rounded-2xl bg-navy-100/50" />
            ))}
          </div>
        ) : firms && firms.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2">
            {firms.map((firm) => (
              <Card key={firm.id} hover className="flex flex-col p-6">
                <div className="flex items-start gap-4">
                  <Avatar name={firm.name} src={firm.logoUrl} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/e/${firm.slug}`}
                        className="font-display text-xl font-semibold text-navy-800 hover:text-navy-600"
                      >
                        {firm.name}
                      </Link>
                      {firm.isVerified && <VerifiedBadge />}
                    </div>
                    {firm.tagline && <p className="text-sm text-navy-500">{firm.tagline}</p>}
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-navy-400">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" />
                        {firm.city}, {firm.country === "UY" ? "Uruguay" : "Argentina"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3.5" />
                        {firm.memberIds.length} profesional{firm.memberIds.length !== 1 && "es"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {firm.specialties.slice(0, 4).map((s) => (
                    <Badge key={s} tone="navy">
                      {specialtyLabel(s)}
                    </Badge>
                  ))}
                </div>
                <div className="mt-4 flex justify-end border-t border-navy-100/70 pt-4">
                  <ButtonLink to={`/e/${firm.slug}`} size="sm">
                    Ver estudio
                    <ArrowRight className="size-4" />
                  </ButtonLink>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Building2 className="size-10" />}
            title="Todavía no hay estudios publicados"
            subtitle="¿Tenés un estudio jurídico? Creá su perfil desde tu panel."
          />
        )}

        <Card className="mt-10 flex flex-col items-center justify-between gap-4 bg-navy-900 p-8 text-center sm:flex-row sm:text-left">
          <div>
            <h3 className="font-display text-2xl font-semibold text-white">
              ¿Tu estudio todavía no está acá?
            </h3>
            <p className="mt-1 text-sm text-navy-200">
              Creá el perfil de tu estudio, sumá hasta 5 profesionales y recibí consultas
              derivables en una bandeja compartida.
            </p>
          </div>
          <ButtonLink to="/registro/profesional" variant="gold">
            Crear mi estudio
          </ButtonLink>
        </Card>
      </section>

      <Footer />
    </div>
  );
}
