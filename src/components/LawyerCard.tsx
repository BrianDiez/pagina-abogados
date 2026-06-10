import { Link } from "react-router-dom";
import { MapPin, Video, Building2, Languages } from "lucide-react";
import type { LawyerWithPrice } from "@/api/lawyers";
import { specialtyLabel } from "@/lib/constants";
import { professionalTypeLabel } from "@/i18n";
import { formatMoney } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { AvailableTodayDot, Badge, VerifiedBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { RatingSummary } from "@/components/ui/Rating";
import { ButtonLink } from "@/components/ui/Button";

export function LawyerCard({ lawyer }: { lawyer: LawyerWithPrice }) {
  return (
    <Card hover className="flex flex-col p-5">
      <div className="flex items-start gap-4">
        <Link to={`/p/${lawyer.slug}`}>
          <Avatar name={lawyer.displayName} src={lawyer.photoUrl} size="lg" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              to={`/p/${lawyer.slug}`}
              className="font-display text-xl font-semibold text-navy-800 hover:text-navy-600"
            >
              {lawyer.title} {lawyer.displayName}
            </Link>
            {lawyer.isVerified && <VerifiedBadge />}
          </div>
          <p className="text-sm text-navy-500">
            {professionalTypeLabel(lawyer.professionalType, lawyer.country)} ·{" "}
            {lawyer.yearsExperience} años de experiencia
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-navy-400">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {lawyer.city}, {lawyer.country === "UY" ? "Uruguay" : "Argentina"}
            </span>
            {lawyer.modalities.includes("video") && (
              <span className="inline-flex items-center gap-1">
                <Video className="size-3.5" /> Videollamada
              </span>
            )}
            {lawyer.modalities.includes("in_person") && (
              <span className="inline-flex items-center gap-1">
                <Building2 className="size-3.5" /> Presencial
              </span>
            )}
            {lawyer.languages.length > 1 && (
              <span className="inline-flex items-center gap-1">
                <Languages className="size-3.5" /> {lawyer.languages.join(", ")}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {lawyer.specialties.slice(0, 3).map((s) => (
          <Badge key={s} tone="navy">
            {specialtyLabel(s)}
          </Badge>
        ))}
        {lawyer.specialties.length > 3 && (
          <Badge tone="neutral">+{lawyer.specialties.length - 3}</Badge>
        )}
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-navy-500">{lawyer.bio}</p>

      <div className="mt-4 flex items-end justify-between border-t border-navy-100/70 pt-4">
        <div className="space-y-1">
          <RatingSummary rating={lawyer.stats.avgRating} count={lawyer.stats.reviewCount} />
          <p className="text-xs text-navy-400">
            <span className="font-mono font-semibold text-navy-600">
              {lawyer.stats.completedConsultations}
            </span>{" "}
            consultas realizadas
          </p>
          {lawyer.availableToday && <AvailableTodayDot />}
        </div>
        <div className="text-right">
          {lawyer.minPrice && (
            <p className="mb-2 text-xs text-navy-400">
              {lawyer.minPrice.amount === 0 ? (
                <span className="font-semibold text-success">Primera consulta gratis</span>
              ) : (
                <>
                  Desde{" "}
                  <span className="font-mono text-sm font-bold text-navy-800">
                    {formatMoney(lawyer.minPrice.amount, lawyer.minPrice.currency)}
                  </span>
                </>
              )}
            </p>
          )}
          <ButtonLink to={`/p/${lawyer.slug}`} size="sm" variant="primary">
            Ver perfil
          </ButtonLink>
        </div>
      </div>
    </Card>
  );
}
