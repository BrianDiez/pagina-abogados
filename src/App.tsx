import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/api/auth";
import { BACKEND } from "@/lib/backend";
import { ErrorBoundary } from "@/components/ErrorBoundary";
// Import estático (no lazy): Cloudflare Pages sirve los chunks dinámicos con
// MIME text/html, lo que rompe el import() de módulos ES. En el bundle
// principal el MIME es correcto. En modo demo este código se incluye pero
// ClerkProvider nunca se renderiza.
import { ClerkRoot } from "@/api/clerkAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { LandingPage } from "@/pages/LandingPage";
import { DirectoryPage } from "@/pages/DirectoryPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { FirmProfilePage } from "@/pages/FirmProfilePage";
import { FirmsDirectoryPage } from "@/pages/FirmsDirectoryPage";
import { BookingPage } from "@/pages/BookingPage";
import { ReservaConfirmacionPage } from "@/pages/ReservaConfirmacionPage";
import { PricingPage } from "@/pages/PricingPage";
import { LegalValuesPage } from "@/pages/LegalValuesPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterClientPage } from "@/pages/auth/RegisterClientPage";
import { RegisterLawyerPage } from "@/pages/auth/RegisterLawyerPage";
import { ClientAccountPage } from "@/pages/ClientAccountPage";
import { DashboardHome } from "@/pages/dashboard/DashboardHome";
import { AgendaPage } from "@/pages/dashboard/AgendaPage";
import { ServicesPage } from "@/pages/dashboard/ServicesPage";
import { AvailabilityPage } from "@/pages/dashboard/AvailabilityPage";
import { ClientsPage } from "@/pages/dashboard/ClientsPage";
import { ReviewsPage } from "@/pages/dashboard/ReviewsPage";
import { StatsPage } from "@/pages/dashboard/StatsPage";
import { SettingsPage } from "@/pages/dashboard/SettingsPage";
import { FirmPage } from "@/pages/dashboard/FirmPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

// demo: AuthProvider local · neon: ClerkRoot (provee el mismo AuthContext)
function AuthBoundary({ children }: { children: React.ReactNode }) {
  if (BACKEND !== "neon") return <AuthProvider>{children}</AuthProvider>;
  return <ClerkRoot>{children}</ClerkRoot>;
}

export default function App() {
  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthBoundary>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/abogados" element={<DirectoryPage />} />
            <Route path="/escribanos" element={<DirectoryPage notariesOnly />} />
            <Route path="/estudios" element={<FirmsDirectoryPage />} />
            <Route path="/e/:slug" element={<FirmProfilePage />} />
            <Route path="/p/:slug" element={<ProfilePage />} />
            <Route path="/p/:slug/agendar" element={<BookingPage />} />
            <Route path="/reserva/:id" element={<ReservaConfirmacionPage />} />
            <Route path="/precios" element={<PricingPage />} />
            <Route path="/valores" element={<LegalValuesPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/registro" element={<RegisterClientPage />} />
            <Route path="/registro/profesional" element={<RegisterLawyerPage />} />
            <Route path="/mi-cuenta" element={<ClientAccountPage />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="agenda" element={<AgendaPage />} />
              <Route path="servicios" element={<ServicesPage />} />
              <Route path="disponibilidad" element={<AvailabilityPage />} />
              <Route path="clientes" element={<ClientsPage />} />
              <Route path="resenas" element={<ReviewsPage />} />
              <Route path="estadisticas" element={<StatsPage />} />
              <Route path="estudio" element={<FirmPage />} />
              <Route path="configuracion" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthBoundary>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}
