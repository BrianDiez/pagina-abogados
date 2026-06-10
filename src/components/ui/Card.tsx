import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  hover = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white shadow-card border border-navy-100/60",
        hover && "transition-shadow hover:shadow-card-hover",
        className,
      )}
      {...props}
    />
  );
}
