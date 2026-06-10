import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/api/auth";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FieldLabel, Input } from "@/components/ui/Field";

const schema = z.object({
  name: z.string().min(3, "Ingresá tu nombre"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(6, "Teléfono inválido"),
});
type Form = z.infer<typeof schema>;

export function RegisterClientPage() {
  const { registerClient } = useAuth();
  const navigate = useNavigate();
  const form = useForm<Form>({ resolver: zodResolver(schema) });

  async function submit(data: Form) {
    await registerClient(data);
    navigate("/mi-cuenta");
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <Card className="p-8">
          <h1 className="font-display text-3xl font-semibold text-navy-800">Crear cuenta</h1>
          <p className="mt-1 text-sm text-navy-400">
            Para gestionar tus consultas, recibir recordatorios y dejar reseñas.
          </p>
          <form onSubmit={form.handleSubmit(submit)} className="mt-6 space-y-4">
            <FieldLabel label="Nombre completo" required error={form.formState.errors.name?.message}>
              <Input placeholder="Ana García" {...form.register("name")} />
            </FieldLabel>
            <FieldLabel label="Email" required error={form.formState.errors.email?.message}>
              <Input type="email" placeholder="ana@email.com" {...form.register("email")} />
            </FieldLabel>
            <FieldLabel label="Teléfono" required error={form.formState.errors.phone?.message}>
              <Input placeholder="+598 99 123 456" {...form.register("phone")} />
            </FieldLabel>
            <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
              Crear cuenta
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
