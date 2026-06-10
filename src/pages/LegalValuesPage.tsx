import { useMemo, useState } from "react";
import { Calculator, ExternalLink, RefreshCw, AlertTriangle } from "lucide-react";
import { LEGAL_UNITS, parseQuantity, unitsByCountry, type LegalUnit } from "@/data/legalUnits";
import { usePageMeta } from "@/lib/seo";
import { cn, formatDateShort, formatMoneyPrecise } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Field";
import { Chip, SectionTitle } from "@/components/ui/misc";

const EXAMPLES: { label: string; qty: string; unitId: string }[] = [
  { label: "0,12 UMA", qty: "0,12", unitId: "ar-uma" },
  { label: "10 UR", qty: "10", unitId: "uy-ur" },
  { label: "4 BPC", qty: "4", unitId: "uy-bpc" },
  { label: "3 timbres", qty: "3", unitId: "uy-timbre" },
];

function UnitCard({ unit }: { unit: LegalUnit }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-gold-600">
            {unit.code}
          </p>
          <h3 className="font-display text-lg font-semibold leading-tight text-navy-800">
            {unit.name}
          </h3>
        </div>
        <Badge tone={unit.approximate ? "warn" : "green"}>
          {unit.approximate ? "Referencia" : "Vigente"}
        </Badge>
      </div>
      <p className="mt-3 font-mono text-3xl font-bold text-navy-800">
        {formatMoneyPrecise(unit.value, unit.currency)}
      </p>
      <p className="mt-1 text-xs text-navy-400">
        Rige desde {formatDateShort(unit.validFrom)} · Actualización {unit.frequency}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-navy-500">{unit.description}</p>
      <a
        href={unit.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-navy-600 underline hover:text-navy-800"
      >
        Fuente: {unit.source}
        <ExternalLink className="size-3" />
      </a>
    </Card>
  );
}

export function LegalValuesPage() {
  usePageMeta({
    title: "Valor de la UR, BPC, timbres y UMA hoy — Calculadora",
    description:
      "Valores vigentes de la Unidad Reajustable (UR), BPC y timbre profesional en Uruguay, y de la UMA (ley 27.423) en Argentina, con calculadora a pesos y fuentes oficiales.",
    path: "/valores",
  });

  const [country, setCountry] = useState<"UY" | "AR">("UY");
  const [qtyRaw, setQtyRaw] = useState("1");
  const [unitId, setUnitId] = useState("uy-ur");

  const unit = LEGAL_UNITS.find((u) => u.id === unitId) ?? LEGAL_UNITS[0]!;
  const qty = parseQuantity(qtyRaw);
  const result = useMemo(() => (qty === null ? null : qty * unit.value), [qty, unit]);

  function applyExample(e: (typeof EXAMPLES)[number]) {
    setQtyRaw(e.qty);
    setUnitId(e.unitId);
    const u = LEGAL_UNITS.find((x) => x.id === e.unitId)!;
    setCountry(u.country);
  }

  return (
    <div className="min-h-screen">
      <Header />

      <section className="border-b border-navy-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <SectionTitle
            eyebrow="Herramientas para profesionales"
            title="Valores judiciales, al día y en un solo lugar"
            subtitle="Basta de buscar cuánto vale la UR, la BPC o la UMA cada vez que armás un escrito. Valores vigentes con fuente oficial y calculadora a pesos."
          />
          <div className="mt-6 flex gap-2">
            {(["UY", "AR"] as const).map((c) => (
              <Chip key={c} active={country === c} onClick={() => setCountry(c)}>
                {c === "UY" ? "🇺🇾 Uruguay" : "🇦🇷 Argentina"}
              </Chip>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_360px]">
        {/* Valores */}
        <div className="grid gap-4 sm:grid-cols-2">
          {unitsByCountry(country).map((u) => (
            <UnitCard key={u.id} unit={u} />
          ))}
          {country === "AR" && (
            <Card className="flex items-start gap-3 bg-navy-50/60 p-4 sm:col-span-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
              <p className="text-xs leading-relaxed text-navy-500">
                La UMA aplica a la justicia nacional y federal (ley 27.423). Las provincias usan
                su propia unidad (JUS) con valores fijados por cada poder judicial — los vamos a
                ir agregando por jurisdicción.
              </p>
            </Card>
          )}
        </div>

        {/* Calculadora */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="p-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-navy-800">
              <Calculator className="size-5 text-gold-500" />
              Calculadora
            </h2>
            <p className="mt-1 text-xs text-navy-400">
              ¿Te dijeron "son 0,12 UMA"? Convertilo a pesos al valor vigente.
            </p>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-[1fr_1.4fr] gap-2">
                <Input
                  inputMode="decimal"
                  value={qtyRaw}
                  onChange={(e) => setQtyRaw(e.target.value)}
                  placeholder="0,12"
                  aria-label="Cantidad"
                />
                <Select
                  value={unitId}
                  onChange={(e) => {
                    setUnitId(e.target.value);
                    const u = LEGAL_UNITS.find((x) => x.id === e.target.value)!;
                    setCountry(u.country);
                  }}
                >
                  {LEGAL_UNITS.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.code} ({u.country})
                    </option>
                  ))}
                </Select>
              </div>
              <div
                className={cn(
                  "rounded-xl border p-4 text-center",
                  result === null ? "border-danger/40 bg-danger-light" : "border-gold-300 bg-gold-50",
                )}
              >
                {result === null ? (
                  <p className="text-sm text-danger">Ingresá una cantidad válida</p>
                ) : (
                  <>
                    <p className="text-xs text-navy-500">
                      {qtyRaw} {unit.code} =
                    </p>
                    <p className="font-mono text-2xl font-bold text-navy-800">
                      {formatMoneyPrecise(Math.round(result * 100) / 100, unit.currency)}
                    </p>
                    <p className="mt-1 text-[11px] text-navy-400">
                      al valor vigente de {formatMoneyPrecise(unit.value, unit.currency)} ·{" "}
                      {formatDateShort(unit.validFrom)}
                    </p>
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLES.map((e) => (
                  <button
                    key={e.label}
                    onClick={() => applyExample(e)}
                    className="rounded-full border border-navy-200 bg-white px-3 py-1 text-xs font-medium text-navy-600 hover:border-gold-400 cursor-pointer"
                  >
                    {e.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-4 flex items-start gap-1.5 text-[11px] leading-relaxed text-navy-400">
              <RefreshCw className="mt-0.5 size-3 shrink-0" />
              Valores de referencia con fuente oficial citada. Verificá siempre la fuente antes de
              liquidar: esta herramienta no sustituye la publicación oficial.
            </p>
          </Card>
        </aside>
      </div>

      <Footer />
    </div>
  );
}
