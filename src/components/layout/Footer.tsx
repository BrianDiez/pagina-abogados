import { Link } from "react-router-dom";
import { Logo } from "./Logo";

const columns = [
  {
    title: "Plataforma",
    links: [
      { to: "/abogados", label: "Buscar abogados" },
      { to: "/escribanos", label: "Buscar escribanos" },
      { to: "/estudios", label: "Estudios jurídicos" },
      { to: "/precios", label: "Planes y precios" },
      { to: "/registro/profesional", label: "Soy profesional" },
    ],
  },
  {
    title: "Herramientas",
    links: [
      { to: "/valores", label: "Valor UR, BPC y UMA hoy" },
      { to: "/valores", label: "Calculadora de unidades" },
    ],
  },
  {
    title: "Especialidades",
    links: [
      { to: "/abogados?especialidad=familia", label: "Familia y divorcio" },
      { to: "/abogados?especialidad=laboral", label: "Laboral" },
      { to: "/abogados?especialidad=penal", label: "Penal" },
      { to: "/abogados?especialidad=inmobiliario", label: "Inmobiliario" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { to: "/", label: "Quiénes somos" },
      { to: "/", label: "Términos y condiciones" },
      { to: "/", label: "Política de privacidad" },
      { to: "/", label: "Contacto" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-navy-100 bg-navy-900 text-navy-100">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-navy-300">
            La plataforma para profesionales del derecho en LATAM: agenda, cobros,
            videollamada y reputación en un solo lugar.
          </p>
          <p className="mt-4 text-xs text-navy-400">🇺🇾 Uruguay · 🇦🇷 Argentina</p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold-400">
              {col.title}
            </h4>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-navy-200 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-navy-800 py-5 text-center text-xs text-navy-400">
        © {new Date().getFullYear()} LegalHub. La plataforma no brinda asesoramiento jurídico:
        conecta clientes con profesionales matriculados independientes.
      </div>
    </footer>
  );
}
