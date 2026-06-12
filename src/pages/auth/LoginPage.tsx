import { lazy, Suspense, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles } from "lucide-react";
import { DEMO_ACCOUNTS, useAuth } from "@/api/auth";
import { BACKEND } from "@/lib/backend";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FieldLabel, Input } from "@/components/ui/Field";
import { FullPageLoader } from "@/components/ui/misc";

const ClerkSignIn = lazy(() =>
  import("@/api/clerkAuth").then((m) => ({ default: m.ClerkSignIn })),
);

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
type Form = z.infer<typeof schema>;

export function LoginPage() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<Form>({ resolver: zodResolver(schema) });

  // Backend real: el login lo maneja Clerk (email, Google, magic links)
  if (BACKEND === "neon") {
    if (loading) return <FullPageLoader />;
    if (user) {
      return <Navigate to={user.role === "lawyer" ? "/dashboard" : "/mi-cuenta"} replace />;
    }
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 sm:px-6">
          <Suspense fallback={<div className="h-96 w-full animate-pulse rounded-2xl bg-navy-100/50" />}>
            <ClerkSignIn signUpUrl="/registro" forceRedirectUrl="/dashboard" />
          </Suspense>
          <p className="mt-6 text-center text-sm text-navy-500">
            ¿Sos profesional y todavía no tenés perfil?{" "}
            <Link to="/registro/profesional" className="font-medium text-navy-800 underline">
              Creá tu perfil
            </Link>
          </p>
        </div>
      </div>
    );
  }

  async function submit(data: Form) {
    setError(null);
    try {
      const user = await login(data.email, data.password);
      navigate(user.role === "lawyer" ? "/dashboard" : "/mi-cuenta");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function fillDemo(kind: "lawyer" | "client") {
    form.setValue("email", DEMO_ACCOUNTS[kind].email);
    form.setValue("password", DEMO_ACCOUNTS[kind].password);
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <Card className="p-8">
          <h1 className="font-display text-3xl font-semibold text-navy-800">Ingresar</h1>
          <p className="mt-1 text-sm text-navy-400">Bienvenido de nuevo a LegalHub.</p>

          <form onSubmit={form.handleSubmit(submit)} className="mt-6 space-y-4">
            <FieldLabel label="Email" required error={form.formState.errors.email?.message}>
              <Input type="email" placeholder="tu@email.com" {...form.register("email")} />
            </FieldLabel>
            <FieldLabel label="Contraseña" required error={form.formState.errors.password?.message}>
              <Input type="password" placeholder="••••••••" {...form.register("password")} />
            </FieldLabel>
            {error && <p className="rounded-lg bg-danger-light p-3 text-sm text-danger">{error}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
              Ingresar
            </Button>
          </form>

          <div className="mt-6 rounded-xl border border-gold-200 bg-gold-50 p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-gold-700">
              <Sparkles className="size-3.5" />
              Cuentas de demostración
            </p>
            <div className="mt-2 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => fillDemo("lawyer")}>
                Soy profesional
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => fillDemo("client")}>
                Soy cliente
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-navy-400">
              Contraseña: <code className="font-mono">demo1234</code>
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-navy-500">
            ¿No tenés cuenta?{" "}
            <Link to="/registro" className="font-medium text-navy-800 underline">
              Registrate
            </Link>{" "}
            ·{" "}
            <Link to="/registro/profesional" className="font-medium text-navy-800 underline">
              Soy profesional
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
