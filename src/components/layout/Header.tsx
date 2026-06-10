import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Menu, User, X, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/api/auth";
import { Avatar } from "@/components/ui/Avatar";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

const navItems = [
  { to: "/abogados", label: "Buscar profesionales" },
  { to: "/escribanos", label: "Escribanos" },
  { to: "/precios", label: "Para profesionales" },
];

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const accountHome = user?.role === "lawyer" ? "/dashboard" : "/mi-cuenta";

  return (
    <header className="sticky top-0 z-40 border-b border-navy-100/70 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                  isActive ? "text-navy-800 bg-navy-50" : "text-navy-500 hover:text-navy-800",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-navy-50 cursor-pointer"
              >
                <Avatar name={user.name} size="sm" />
                <span className="max-w-36 truncate text-sm font-medium text-navy-700">{user.name}</span>
                <ChevronDown className="size-4 text-navy-400" />
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl border border-navy-100 bg-white p-1.5 shadow-card-hover"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <Link
                    to={accountHome}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-navy-700 hover:bg-navy-50"
                  >
                    {user.role === "lawyer" ? <LayoutDashboard className="size-4" /> : <User className="size-4" />}
                    {user.role === "lawyer" ? "Mi panel" : "Mis consultas"}
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                      navigate("/");
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger-light cursor-pointer"
                  >
                    <LogOut className="size-4" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-navy-600 hover:text-navy-800">
                Ingresar
              </Link>
              <ButtonLink to="/registro/profesional" variant="gold" size="sm">
                Crear mi perfil gratis
              </ButtonLink>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 text-navy-600 hover:bg-navy-50 md:hidden cursor-pointer"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menú"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-navy-100 bg-cream px-4 py-3 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-navy-700 hover:bg-navy-50"
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-2 border-t border-navy-100 pt-3">
            {user ? (
              <>
                <Link
                  to={accountHome}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-navy-700 hover:bg-navy-50"
                >
                  {user.role === "lawyer" ? "Mi panel" : "Mis consultas"}
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                    navigate("/");
                  }}
                  className="block rounded-lg px-3 py-2.5 text-left text-sm font-medium text-danger hover:bg-danger-light cursor-pointer"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <ButtonLink to="/login" variant="outline" size="md">
                  Ingresar
                </ButtonLink>
                <ButtonLink to="/registro/profesional" variant="gold" size="md">
                  Crear mi perfil gratis
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
