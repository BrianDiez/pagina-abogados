import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/api/auth";
import { BACKEND } from "@/lib/backend";

// Clerk solo se descarga cuando el backend es neon (en demo no pesa ni un byte)
const ClerkRoot = lazy(() =>
  import("@/api/clerkAuth").then((m) => ({ default: m.ClerkRoot })),
);
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { LandingPage } from "@/pages/LandingPage";
import { DirectoryPage } from "@/pages/DirectoryPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { FirmProfilePage } from "@/pages/FirmProfilePage";
import { FirmsDirectoryPage } from "@/pages/FirmsDirectoryPage";
import { BookingPage } from "@/pages/BookingPage";
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

function MaybeClerk({ children }: { children: React.ReactNode }) {
  if (BACKEND !== "neon") return <>{children}</>;
  return (
    <Suspense fallback={null}>
      <ClerkRoot>{children}</ClerkRoot>
    </Suspense>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MaybeClerk>
      <AuthProvider>
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
      </AuthProvider>
      </MaybeClerk>
    </QueryClientProvider>
  );
}
