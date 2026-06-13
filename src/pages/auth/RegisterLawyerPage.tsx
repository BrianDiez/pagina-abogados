import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BadgeCheck, ChevronLeft } from "lucide-react";
import { useAuth } from "@/api/auth";
import { BACKEND } from "@/lib/backend";
import { CITIES_BY_COUNTRY, SPECIALTIES } from "@/lib/constants";
import {
  defaultJurisdiction,
  jurisdictionById,
  jurisdictionsByCountry,
  registrationsDisplay,
  suggestedJurisdictionIds,
  type ProfessionalRegistration,
} from "@/lib/jurisdictions";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FieldLabel, Input, Select, Textarea } from "@/components/ui/Field";
import { FullPageLoader } from "@/components/ui/misc";
import { ClerkSignUp } from "@/api/clerkAuth";

const IS_NEON = BACKEND === "neon";

// En neon la cuenta (email/contraseña) la crea Clerk: esos campos no aplican.
// La matrícula se maneja aparte (lista dinámica de jurisdicciones).
const schema = z.object({
  name: z.string().min(3, "Ingresá tu nombre completo"),
  email: IS_NEON ? z.string().optional() : z.string().email("Email inválido"),
  password: IS_NEON ? z.string().optional() : z.string().min(8, "Mínimo 8 caracteres"),
  title: z.string(),
  professionalType: z.enum(["lawyer", "notary", "tax_advisor", "other"]),
  country: z.enum(["UY", "AR"]),
  city: z.string().min(2, "Elegí tu ciudad"),
  yearsExperience: z.coerce.number().min(0).max(70),
  bio: z.string().min(60, "Contá al menos 60 caracteres: es tu carta de presentación").max(800),
});
type Form = z.infer<typeof schema>;

const FIRST_STEP = IS_NEON ? 1 : 0;

export function RegisterLawyerPage() {
  const { registerLawyer, user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(FIRST_STEP);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [specialtiesError, setSpecialtiesError] = useState<string | null>(null);
  // Matrículas por jurisdicción (en AR lo normal es tener más de una)
  const [registrations, setRegistrations] = useState<ProfessionalRegistration[]>([
    { jurisdictionId: defaultJurisdiction("UY"), number: "" },
  ]);
  const [registrationsError, setRegistrationsError] = useState<string | null>(null);

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "Dr.",
      professionalType: "lawyer",
      country: "UY",
      yearsExperience: 0,
      name: IS_NEON ? (user?.name ?? "") : "",
    },
  });

  // Mientras la sesión se resuelve: spinner. Mostrar SignUp acá con sesión
  // activa causaba el bucle de redirects a esta misma página.
  if (IS_NEON && loading) {
    return <FullPageLoader />;
  }

  // Backend real: primero la cuenta Clerk, después el perfil profesional
  if (IS_NEON && !user) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-12 sm:px-6">
          <p className="mb-5 text-center text-sm text-navy-500">
            <strong className="text-navy-800">Paso 1 de 2:</strong> creá tu cuenta. Después
            completás tu perfil profesional (2 minutos).
          </p>
          <ClerkSignUp signInUrl="/login" forceRedirectUrl="/registro/profesional" />
        </div>
      </div>
    );
  }
  if (IS_NEON && user?.lawyerId) {
    return <Navigate to="/dashboard" replace />;
  }

  function toggleSpecialty(id: string) {
    setSpecialtiesError(null);
    setSpecialties((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : prev.length < 5 ? [...prev, id] : prev,
    );
  }

  const country = form.watch("country");
  const city = form.watch("city");
  const cities = CITIES_BY_COUNTRY[country] ?? CITIES_BY_COUNTRY.UY;
  const jurisdictions = jurisdictionsByCountry(country);

  // Sugerencias arriba (colegio local + Federal + CPACF), todo lo demás abajo.
  // Sugerir, no filtrar: las matrículas no coinciden con la ciudad.
  const suggestedIds = suggestedJurisdictionIds(country, city || undefined);
  const suggested = suggestedIds
    .map(jurisdictionById)
    .filter((j): j is NonNullable<typeof j> => !!j);
  const otherJurisdictions = jurisdictions.filter((j) => !suggestedIds.includes(j.id));

  // Al elegir ciudad, la primera fila vacía adopta la jurisdicción local
  useEffect(() => {
    if (!city) return;
    setRegistrations((prev) =>
      prev.length > 0 && prev[0]!.number.trim() === ""
        ? [{ ...prev[0]!, jurisdictionId: defaultJurisdiction(country, city) }, ...prev.slice(1)]
        : prev,
    );
  }, [city, country]);

  // Al cambiar de país: ciudades y jurisdicciones del nuevo país
  function onCountryChange(next: "UY" | "AR") {
    form.setValue("country", next);
    form.setValue("city", "");
    setRegistrations([{ jurisdictionId: defaultJurisdiction(next), number: "" }]);
    setRegistrationsError(null);
  }

  function updateRegistration(index: number, patch: Partial<ProfessionalRegistration>) {
    setRegistrationsError(null);
    setRegistrations((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function validRegistrations(): ProfessionalRegistration[] {
    return registrations.filter((r) => r.number.trim().length >= 2);
  }

  async function submit(data: Form) {
    if (specialties.length === 0) {
      setSpecialtiesError("Elegí al menos una especialidad");
      setStep(1);
      return;
    }
    const regs = validRegistrations();
    if (regs.length === 0) {
      setRegistrationsError("Cargá al menos una matrícula (la verificamos en 48 h)");
      setStep(1);
      return;
    }
    await registerLawyer({
      ...data,
      email: data.email ?? user?.email ?? "",
      matriculaNumber: registrationsDisplay(regs),
      registrations: regs,
      specialties,
    });
    navigate("/dashboard");
  }

  const stepFields: Record<number, (keyof Form)[]> = {
    0: ["name", "email", "password", "title", "professionalType"],
    1: ["country", "city", "yearsExperience"],
  };

  async function next() {
    const valid = await form.trigger(stepFields[step]);
    if (step === 1) {
      if (validRegistrations().length === 0) {
        setRegistrationsError("Cargá al menos una matrícula (la verificamos en 48 h)");
        return;
      }
      if (specialties.length === 0) {
        setSpecialtiesError("Elegí al menos una especialidad");
        return;
      }
    }
    if (valid) setStep((s) => s + 1);
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
        <Card className="p-8">
          <div className="mb-6">
            <div className="mb-3 flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={cn("h-1.5 flex-1 rounded-full", i <= step ? "bg-gold-400" : "bg-navy-100")}
                />
              ))}
            </div>
            <h1 className="font-display text-3xl font-semibold text-navy-800">
              {step === 0 && "Creá tu perfil profesional"}
              {step === 1 && "Tu ejercicio profesional"}
              {step === 2 && "Tu carta de presentación"}
            </h1>
            <p className="mt-1 text-sm text-navy-400">
              {step === 0 && "Gratis para siempre en el plan inicial. Sin tarjeta."}
              {step === 1 && "Matrícula y especialidades: lo que te hace encontrable."}
              {step === 2 && "Tu bio aparece en tu perfil público y en los resultados de búsqueda."}
            </p>
          </div>

          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            {step === 0 && (
              <>
                <div className="grid grid-cols-[110px_1fr] gap-3">
                  <FieldLabel label="Título">
                    <Select {...form.register("title")}>
                      <option>Dr.</option>
                      <option>Dra.</option>
                      <option>Esc.</option>
                    </Select>
                  </FieldLabel>
                  <FieldLabel label="Nombre completo" required error={form.formState.errors.name?.message}>
                    <Input placeholder="Valentina Ríos" {...form.register("name")} />
                  </FieldLabel>
                </div>
                <FieldLabel label="¿Cuál es tu profesión?" required>
                  <Select {...form.register("professionalType")}>
                    <option value="lawyer">Abogado/a</option>
                    <option value="notary">Escribano/a · Notario/a</option>
                    <option value="tax_advisor">Asesor/a tributario</option>
                    <option value="other">Otro profesional jurídico</option>
                  </Select>
                </FieldLabel>
                <FieldLabel label="Email" required error={form.formState.errors.email?.message}>
                  <Input type="email" placeholder="tu@estudio.com" {...form.register("email")} />
                </FieldLabel>
                <FieldLabel label="Contraseña" required error={form.formState.errors.password?.message}>
                  <Input type="password" placeholder="Mínimo 8 caracteres" {...form.register("password")} />
                </FieldLabel>
              </>
            )}

            {step === 1 && (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FieldLabel label="País" required>
                    <Select
                      value={country}
                      onChange={(e) => onCountryChange(e.target.value as "UY" | "AR")}
                    >
                      <option value="UY">Uruguay</option>
                      <option value="AR">Argentina</option>
                    </Select>
                  </FieldLabel>
                  <FieldLabel label="Ciudad" required error={form.formState.errors.city?.message}>
                    <Select {...form.register("city")}>
                      <option value="">Elegir…</option>
                      {cities.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </Select>
                  </FieldLabel>
                </div>

                {/* Matrículas por jurisdicción: en AR (CPACF, federal, provincias)
                    lo normal es tener más de una */}
                <FieldLabel
                  label="Matrículas (una por jurisdicción)"
                  required
                  error={registrationsError ?? undefined}
                  hint={
                    country === "AR"
                      ? "CABA (CPACF), federal y cada provincia llevan matrícula propia: agregá todas las que tengas."
                      : "En Uruguay alcanza con la inscripción de tu título ante la SCJ. CAU/AEU son opcionales."
                  }
                >
                  <div className="space-y-2 pt-1">
                    {registrations.map((r, index) => {
                      const j = jurisdictionById(r.jurisdictionId);
                      return (
                        <div key={index} className="flex items-start gap-2">
                          <Select
                            value={r.jurisdictionId}
                            onChange={(e) => updateRegistration(index, { jurisdictionId: e.target.value })}
                            className="flex-1"
                          >
                            <optgroup label={city ? `Sugeridas para ${city}` : "Más comunes"}>
                              {suggested.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                  {opt.label}
                                </option>
                              ))}
                            </optgroup>
                            {otherJurisdictions.length > 0 && (
                              <optgroup label="Todas las jurisdicciones">
                                {otherJurisdictions.map((opt) => (
                                  <option key={opt.id} value={opt.id}>
                                    {opt.label}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                          </Select>
                          <Input
                            value={r.number}
                            onChange={(e) => updateRegistration(index, { number: e.target.value })}
                            placeholder={j?.hint ?? "N°"}
                            className="w-40"
                          />
                          {registrations.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setRegistrations((prev) => prev.filter((_, i) => i !== index))}
                              className="mt-2.5 text-navy-300 hover:text-danger cursor-pointer"
                              aria-label="Quitar matrícula"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {registrations.length < 5 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setRegistrations((prev) => {
                            // proponer la siguiente del combo típico que aún no esté usada
                            // (local -> Federal -> CPACF)
                            const used = new Set(prev.map((r) => r.jurisdictionId));
                            const nextId =
                              suggestedIds.find((id) => !used.has(id)) ??
                              defaultJurisdiction(country, city || undefined);
                            return [...prev, { jurisdictionId: nextId, number: "" }];
                          })
                        }
                      >
                        + Agregar otra matrícula
                      </Button>
                    )}
                  </div>
                </FieldLabel>

                <FieldLabel label="Años de experiencia" required>
                  <Input type="number" min={0} max={70} {...form.register("yearsExperience")} />
                </FieldLabel>
                <FieldLabel
                  label="Especialidades (hasta 5)"
                  required
                  error={specialtiesError ?? undefined}
                >
                  <div className="flex flex-wrap gap-2 pt-1">
                    {SPECIALTIES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleSpecialty(s.id)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                          specialties.includes(s.id)
                            ? "border-navy-700 bg-navy-700 text-white"
                            : "border-navy-200 bg-white text-navy-600 hover:border-navy-400",
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </FieldLabel>
              </>
            )}

            {step === 2 && (
              <>
                <FieldLabel
                  label="Bio profesional"
                  required
                  error={form.formState.errors.bio?.message}
                  hint="Hablá en primera persona. Qué hacés, para quién y qué te diferencia. 60–800 caracteres."
                >
                  <Textarea
                    rows={6}
                    placeholder="Abogada especializada en derecho de familia con 12 años acompañando a familias en momentos difíciles…"
                    {...form.register("bio")}
                  />
                </FieldLabel>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const type = form.getValues("professionalType");
                      const city = form.getValues("city") || "[tu ciudad]";
                      const template =
                        type === "notary"
                          ? `Soy escribano/a en ${city} y ayudo a [personas y empresas] con [compraventas, certificaciones, poderes y contratos]. Trabajo con agenda online para que resuelvas tu trámite sin perder mañanas enteras: traé tus documentos y lo dejamos pronto en una sola reunión.`
                          : `Soy abogado/a en ${city} y ayudo a [trabajadores / familias / pymes] a resolver [despidos, divorcios, contratos: tu tema principal]. Te explico cada paso en lenguaje claro, sin tecnicismos, con honorarios transparentes desde la primera consulta. Atiendo por videollamada en todo el país.`;
                      form.setValue("bio", template, { shouldValidate: true });
                    }}
                  >
                    ✨ Usar plantilla
                  </Button>
                  <p className="text-xs text-navy-400">
                    Tip: contá a quién ayudás y con qué — evitá el juridiqués. Reemplazá los [corchetes].
                  </p>
                </div>
                <div className="rounded-xl border border-gold-200 bg-gold-50 p-4 text-sm text-navy-600">
                  <p className="flex items-center gap-1.5 font-semibold text-gold-700">
                    <BadgeCheck className="size-4" />
                    Después de crear tu cuenta
                  </p>
                  <p className="mt-1 text-xs leading-relaxed">
                    Vas a poder configurar tus servicios y horarios desde el panel, subir tu foto y
                    enviar tu matrícula para obtener el badge de Perfil Verificado (48 h).
                  </p>
                </div>
              </>
            )}

            <div className="flex justify-between pt-2">
              {step > FIRST_STEP ? (
                <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
                  <ChevronLeft className="size-4" />
                  Atrás
                </Button>
              ) : (
                <span />
              )}
              {step < 2 ? (
                <Button onClick={next} size="lg">
                  Continuar
                </Button>
              ) : (
                <Button type="submit" size="lg" variant="gold" disabled={form.formState.isSubmitting}>
                  Crear mi perfil
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
