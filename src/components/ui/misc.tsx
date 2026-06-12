import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Chip({
  active = false,
  onClick,
  children,
  className,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors cursor-pointer",
        active
          ? "border-navy-700 bg-navy-700 text-white"
          : "border-navy-200 bg-white text-navy-600 hover:border-navy-400",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  subtitle,
  center = false,
  light = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
  light?: boolean;
}) {
  return (
    <div className={cn("max-w-2xl", center && "mx-auto text-center")}>
      {eyebrow && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold-500">
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          "font-display text-3xl sm:text-4xl font-semibold leading-tight",
          light ? "text-white" : "text-navy-800",
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={cn("mt-3 text-base leading-relaxed", light ? "text-navy-100" : "text-navy-500")}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-navy-200 bg-white/60 px-6 py-14 text-center">
      {icon && <div className="mb-3 text-navy-300">{icon}</div>}
      <p className="font-medium text-navy-700">{title}</p>
      {subtitle && <p className="mt-1 max-w-sm text-sm text-navy-400">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Pantalla de carga para mientras se resuelve la sesión (evita redirects prematuros). */
export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream">
      <div className="flex flex-col items-center gap-3">
        <span className="size-8 animate-spin rounded-full border-[3px] border-navy-200 border-t-gold-500" />
        <p className="text-sm text-navy-400">Cargando…</p>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white border border-navy-100/60 shadow-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-navy-400">{label}</p>
        {icon && <span className="text-gold-500">{icon}</span>}
      </div>
      <p className="mt-2 font-mono text-2xl font-bold text-navy-800">{value}</p>
      {sub && <p className="mt-1 text-xs text-navy-400">{sub}</p>}
    </div>
  );
}
