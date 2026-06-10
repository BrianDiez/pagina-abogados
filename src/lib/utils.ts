import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  UYU: "$U",
  ARS: "AR$",
  USD: "US$",
  BRL: "R$",
  CLP: "CL$",
};

export function formatMoney(amount: number, currency: string): string {
  if (amount === 0) return "Gratis";
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  return `${symbol} ${amount.toLocaleString("es-UY", { maximumFractionDigits: 0 })}`;
}

/** Con decimales exactos — para valores de unidades judiciales (UR 1.921,36). */
export function formatMoneyPrecise(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  const hasDecimals = !Number.isInteger(amount);
  return `${symbol} ${amount.toLocaleString("es-UY", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDateLong(date: Date | string): string {
  return format(new Date(date), "EEEE d 'de' MMMM", { locale: es });
}

export function formatDateShort(date: Date | string): string {
  return format(new Date(date), "dd/MM/yyyy", { locale: es });
}

export function formatTime(date: Date | string): string {
  return format(new Date(date), "HH:mm");
}

const HONORIFICS = /^(dr|dra|esc|escr|lic|abg|abog|ing|cr|cra|sr|sra|srta|prof)\.?$/i;

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => /^[\p{L}\p{N}]/u.test(w)) // ignora "&", "y", símbolos sueltos
    .filter((w) => !HONORIFICS.test(w)) // "Dra. Valentina Ríos" -> VR, no DV
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
