import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BadgeCheck, ChevronLeft } from "lucide-react";
import { useAuth } from "@/api/auth";
import { CITIES, SPECIALTIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FieldLabel, Input, Select, Textarea } from "@/components/ui/Field";

const schema = z.object({
  name: z.string().min(3, "Ingresá tu nombre completo"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  title: z.string(),
  professionalType: z.enum(["lawyer", "notary", "tax_advisor", "other"]),
  country: z.enum(["UY", "AR"]),
  city: z.string().min(2, "Elegí tu ciudad"),
  matriculaNumber: z.string().min(3, "Ingresá tu matrícula (la verificamos en 48 h)"),
  yearsExperience: z.coerce.number().min(0).max(70),
  bio: z.string().min(60, "Contá al menos 60 caracteres: es tu carta de presentación").max(800),
});
type Form = z.infer<typeof schema>;

export function RegisterLawyerPage() {
  const { registerLawyer } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [specialtiesError, setSpecialtiesError] = useState<string | null>(null);

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { title: "Dr.", professionalType: "lawyer", country: "UY", yearsExperience: 0 },
  });

  function toggleSpecialty(id: string) {
    setSpecialtiesError(null);
    setSpecialties((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : prev.length < 5 ? [...prev, id] : prev,
    );
  }

  async function submit(data: Form) {
    if (specialties.length === 0) {
      setSpecialtiesError("Elegí al menos una especialidad");
      setStep(1);
      return;
    }
    await registerLawyer({ ...data, specialties });
    navigate("/dashboard");
  }

  const stepFields: Record<number, (keyof Form)[]> = {
    0: ["name", "email", "password", "title", "professionalType"],
    1: ["country", "city", "matriculaNumber", "yearsExperience"],
  };

  async function next() {
    const valid = await form.trigger(stepFields[step]);
    if (step === 1 && specialties.length === 0) {
      setSpecialtiesError("Elegí al menos una especialidad");
      return;
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
                    <Select {...form.register("country")}>
                      <option value="UY">Uruguay</option>
                      <option value="AR">Argentina</option>
                    </Select>
                  </FieldLabel>
                  <FieldLabel label="Ciudad" required error={form.formState.errors.city?.message}>
                    <Select {...form.register("city")}>
                      <option value="">Elegir…</option>
                      {CITIES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </Select>
                  </FieldLabel>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FieldLabel
                    label="Matrícula / inscripción colegial"
                    required
                    error={form.formState.errors.matriculaNumber?.message}
                    hint="Ej.: CAU 18.245 · CPACF T°89 F°412"
                  >
                    <Input placeholder="CAU 18.245" {...form.register("matriculaNumber")} />
                  </FieldLabel>
                  <FieldLabel label="Años de experiencia" required>
                    <Input type="number" min={0} max={70} {...form.register("yearsExperience")} />
                  </FieldLabel>
                </div>
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
              {step > 0 ? (
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
