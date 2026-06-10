import type { HTMLAttributes } from "react";
import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "navy" | "gold" | "green" | "red" | "neutral" | "warn";

const tones: Record<Tone, string> = {
  navy: "bg-navy-50 text-navy-700 border-navy-200",
  gold: "bg-gold-100 text-gold-700 border-gold-300",
  green: "bg-success-light text-success border-success/30",
  red: "bg-danger-light text-danger border-danger/30",
  warn: "bg-warn-light text-warn border-warn/30",
  neutral: "bg-navy-50/60 text-navy-500 border-navy-100",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

/** Tick dorado de perfil verificado. */
export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span
      title="Perfil verificado — matrícula validada por LegalHub"
      className={cn("inline-flex items-center gap-1 text-gold-600 text-xs font-semibold", className)}
    >
      <BadgeCheck className="size-4 fill-gold-400 text-white" />
      Verificado
    </span>
  );
}

/** Punto verde animado "Disponible hoy". */
export function AvailableTodayDot() {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-success">
      <span className="relative inline-flex size-2">
        <span className="pulse-dot absolute inset-0 rounded-full" />
        <span className="relative inline-flex size-2 rounded-full bg-success" />
      </span>
      Disponible hoy
    </span>
  );
}
