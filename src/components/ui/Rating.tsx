import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "size-4",
            i <= Math.round(value)
              ? "fill-gold-400 text-gold-400"
              : "fill-navy-100 text-navy-100",
          )}
        />
      ))}
    </span>
  );
}

export function RatingSummary({
  rating,
  count,
  className,
}: {
  rating: number | null;
  count: number;
  className?: string;
}) {
  if (!rating || count === 0) {
    return <span className={cn("text-xs text-navy-400", className)}>Sin reseñas aún</span>;
  }
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Stars value={rating} />
      <span className="font-mono text-sm font-semibold text-navy-800">{rating.toFixed(1)}</span>
      <span className="text-xs text-navy-400">({count})</span>
    </span>
  );
}

/** Selector interactivo de 1-5 estrellas (formulario de review). */
export function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" onClick={() => onChange(i)} className="cursor-pointer">
          <Star
            className={cn(
              "size-7 transition-colors",
              i <= value ? "fill-gold-400 text-gold-400" : "fill-navy-100 text-navy-200 hover:text-gold-300",
            )}
          />
        </button>
      ))}
    </div>
  );
}
