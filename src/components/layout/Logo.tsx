import { Link } from "react-router-dom";
import { Scale } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <Link to="/" className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="flex size-9 items-center justify-center rounded-xl bg-navy-700 shadow-sm relative">
        <Scale className="size-5 text-gold-400" strokeWidth={1.8} />
        <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-gold-400 ring-2 ring-cream" />
      </span>
      <span
        className={cn(
          "font-display text-2xl font-semibold tracking-tight",
          light ? "text-white" : "text-navy-800",
        )}
      >
        Legal<span className="text-gold-500">Hub</span>
      </span>
    </Link>
  );
}
