import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, UsersRound } from "lucide-react";
import { listLawyers } from "@/api/lawyers";
import { usePageMeta } from "@/lib/seo";
import { CITIES_BY_COUNTRY, MODALITY_LABELS, SPECIALTIES, specialtyLabel } from "@/lib/constants";
import type { DirectoryFilters, Modality } from "@/types";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LawyerCard } from "@/components/LawyerCard";
import { Input, Select } from "@/components/ui/Field";
import { Chip, EmptyState } from "@/components/ui/misc";

export function DirectoryPage({ notariesOnly = false }: { notariesOnly?: boolean }) {
  const [params, setParams] = useSearchParams();

  const filters: DirectoryFilters = useMemo(
    () => ({
      query: params.get("q") ?? undefined,
      specialty: params.get("especialidad") ?? undefined,
      city: params.get("ciudad") ?? undefined,
      modality: (params.get("modalidad") as Modality) ?? undefined,
      professionalType: notariesOnly ? "notary" : undefined,
      sort: (params.get("orden") as DirectoryFilters["sort"]) ?? "rating",
    }),
    [params, notariesOnly],
  );

  const { data: lawyers, isLoading } = useQuery({
    queryKey: ["lawyers", filters],
    queryFn: () => listLawyers(filters),
  });

  const seoSegment = notariesOnly ? "Escribanos y notarios" : "Abogados";
  const seoQualifier = [
    filters.specialty ? `de ${specialtyLabel(filters.specialty)}` : "",
    filters.city ? `en ${filters.city}` : "en Uruguay y Argentina",
  ]
    .filter(Boolean)
    .join(" ");
  usePageMeta({
    title: `${seoSegment} ${seoQualifier} — Agenda online y consultas`,
    description: `Encontrá ${seoSegment.toLowerCase()} ${seoQualifier}: perfiles con matrícula verificada, reseñas de clientes reales y agenda online con pago seguro.`,
    path: notariesOnly ? "/escribanos" : "/abogados",
  });

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  const popularSpecialties = notariesOnly
    ? SPECIALTIES.filter((s) => ["notarial", "inmobiliario", "sucesiones", "contratos"].includes(s.id))
    : SPECIALTIES.slice(0, 8);

  return (
    <div className="min-h-screen">
      <Header />

      <section className="border-b border-navy-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h1 className="font-display text-3xl font-semibold text-navy-800 sm:text-4xl">
            {notariesOnly ? "Escribanos y notarios" : "Encontrá tu profesional jurídico"}
          </h1>
          <p className="mt-2 text-navy-500">
            {notariesOnly
              ? "Trámites notariales con agenda online: compraventas, certificaciones, poderes y más."
              : "Perfiles verificados, reseñas reales y agenda online con pago seguro."}
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_180px_180px_170px]">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-navy-300" />
              <Input
                placeholder="Buscar por nombre, tema o ciudad…"
                className="pl-10"
                defaultValue={filters.query ?? ""}
                onChange={(e) => setParam("q", e.target.value)}
              />
            </div>
            <Select value={filters.city ?? ""} onChange={(e) => setParam("ciudad", e.target.value)}>
              <option value="">Todas las ciudades</option>
              <optgroup label="🇺🇾 Uruguay">
                {CITIES_BY_COUNTRY.UY.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </optgroup>
              <optgroup label="🇦🇷 Argentina">
                {CITIES_BY_COUNTRY.AR.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </optgroup>
            </Select>
            <Select value={filters.modality ?? ""} onChange={(e) => setParam("modalidad", e.target.value)}>
              <option value="">Cualquier modalidad</option>
              {Object.entries(MODALITY_LABELS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </Select>
            <Select value={filters.sort} onChange={(e) => setParam("orden", e.target.value)}>
              <option value="rating">Mejor valorados</option>
              <option value="consultations">Más consultas</option>
              <option value="price_asc">Menor precio</option>
              <option value="price_desc">Mayor precio</option>
            </Select>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Chip active={!filters.specialty} onClick={() => setParam("especialidad", "")}>
              Todas
            </Chip>
            {popularSpecialties.map((s) => (
              <Chip
                key={s.id}
                active={filters.specialty === s.id}
                onClick={() => setParam("especialidad", filters.specialty === s.id ? "" : s.id)}
              >
                {s.label}
              </Chip>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-navy-100/50" />
            ))}
          </div>
        ) : lawyers && lawyers.length > 0 ? (
          <>
            <p className="mb-5 flex items-center gap-2 text-sm text-navy-400">
              <SlidersHorizontal className="size-4" />
              {lawyers.length} profesional{lawyers.length !== 1 && "es"} encontrado{lawyers.length !== 1 && "s"}
            </p>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {lawyers.map((l) => (
                <LawyerCard key={l.id} lawyer={l} />
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            icon={<UsersRound className="size-10" />}
            title="No encontramos profesionales con esos filtros"
            subtitle="Probá quitando algún filtro o buscando en otra ciudad."
          />
        )}
      </section>

      <Footer />
    </div>
  );
}
