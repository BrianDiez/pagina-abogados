import { useState } from "react";
import { cn, initials } from "@/lib/utils";

const PALETTE = [
  "bg-navy-600",
  "bg-navy-500",
  "bg-gold-500",
  "bg-success",
  "bg-navy-400",
  "bg-gold-600",
];

export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const sizes = {
    sm: "size-8 text-xs",
    md: "size-11 text-sm",
    lg: "size-16 text-lg",
    xl: "size-28 text-3xl",
  };
  const color = PALETTE[name.length % PALETTE.length];

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        className={cn("rounded-full object-cover ring-2 ring-white shadow", sizes[size], className)}
      />
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full text-white font-semibold ring-2 ring-white shadow",
        sizes[size],
        color,
        className,
      )}
      aria-label={name}
    >
      {initials(name)}
    </span>
  );
}
