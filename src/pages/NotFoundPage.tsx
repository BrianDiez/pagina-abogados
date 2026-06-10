import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ButtonLink } from "@/components/ui/Button";

export function NotFoundPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-32 text-center">
        <p className="font-display text-8xl font-bold text-gold-300">404</p>
        <h1 className="mt-4 font-display text-3xl font-semibold text-navy-800">
          Esta página no existe
        </h1>
        <p className="mt-2 text-navy-500">Quizás el link está vencido o mal escrito.</p>
        <ButtonLink to="/" className="mt-6">
          Volver al inicio
        </ButtonLink>
      </div>
      <Footer />
    </div>
  );
}
