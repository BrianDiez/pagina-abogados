import { NavLink, Navigate, Outlet } from "react-router-dom";
import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  Briefcase,
  Building2,
  Clock,
  Users,
  Star,
  Settings,
} from "lucide-react";
import { useAuth } from "@/api/auth";
import { cn } from "@/lib/utils";
import { Header } from "./Header";

const items = [
  { to: "/dashboard", label: "Resumen", icon: LayoutDashboard, end: true },
  { to: "/dashboard/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/dashboard/servicios", label: "Servicios", icon: Briefcase },
  { to: "/dashboard/disponibilidad", label: "Disponibilidad", icon: Clock },
  { to: "/dashboard/clientes", label: "Clientes", icon: Users },
  { to: "/dashboard/resenas", label: "Reseñas", icon: Star },
  { to: "/dashboard/estadisticas", label: "Estadísticas", icon: BarChart3 },
  { to: "/dashboard/estudio", label: "Mi estudio", icon: Building2 },
  { to: "/dashboard/configuracion", label: "Configuración", icon: Settings },
];

// Accesos principales del bottom nav móvil (los demás quedan en los chips superiores)
const mobileTabs = [
  { to: "/dashboard", label: "Resumen", icon: LayoutDashboard, end: true },
  { to: "/dashboard/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/dashboard/servicios", label: "Servicios", icon: Briefcase },
  { to: "/dashboard/clientes", label: "Clientes", icon: Users },
  { to: "/dashboard/configuracion", label: "Ajustes", icon: Settings },
];

export function DashboardLayout() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "lawyer") return <Navigate to="/mi-cuenta" replace />;

  return (
    <div className="min-h-screen bg-cream pb-20 lg:pb-0">
      <Header />
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-22 space-y-1">
            {items.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-navy-700 text-white shadow-sm"
                      : "text-navy-500 hover:bg-white hover:text-navy-800",
                  )
                }
              >
                <Icon className="size-4.5" />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          {/* Nav móvil del panel */}
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {items.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium",
                    isActive
                      ? "border-navy-700 bg-navy-700 text-white"
                      : "border-navy-200 bg-white text-navy-600",
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
          <Outlet />
        </main>
      </div>

      {/* Bottom nav móvil estilo app */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-navy-100 bg-white/95 backdrop-blur lg:hidden">
        {mobileTabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
                isActive ? "text-navy-800" : "text-navy-400",
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn("size-5", isActive && "text-gold-500")} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
