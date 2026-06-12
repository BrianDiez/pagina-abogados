// Autenticación. En modo demo: sesión simulada en localStorage con cuentas seed.
// En producción (Fase 2): Supabase Auth con roles en profiles.
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getDB, persist, uid } from "@/data/demo/store";
import { slugify } from "@/lib/utils";
import type { Lawyer, SessionUser } from "@/types";

const SESSION_KEY = "legalhub-demo-session";

export const DEMO_ACCOUNTS = {
  lawyer: { email: "abogado@legalhub.app", password: "demo1234" },
  client: { email: "cliente@legalhub.app", password: "demo1234" },
};

export interface RegisterLawyerInput {
  name: string;
  email: string;
  title: string;
  professionalType: Lawyer["professionalType"];
  city: string;
  country: "UY" | "AR";
  /** string visible compuesto (derivado de registrations) */
  matriculaNumber: string;
  /** matrículas por jurisdicción — en AR suele haber varias */
  registrations?: import("@/types").ProfessionalRegistration[];
  specialties: string[];
  bio: string;
  yearsExperience: number;
}

export interface AuthContextValue {
  user: SessionUser | null;
  /** true mientras la sesión se está resolviendo (Clerk cargando o /api/me en vuelo).
   *  Las páginas NUNCA deben redirigir ni mostrar SignIn/SignUp mientras loading. */
  loading: boolean;
  login: (email: string, password: string) => Promise<SessionUser>;
  registerLawyer: (data: RegisterLawyerInput) => Promise<SessionUser>;
  registerClient: (data: { name: string; email: string; phone: string }) => Promise<SessionUser>;
  logout: () => void;
}

/** Contexto compartido: lo provee DemoAuthProvider (demo) o NeonAuthProvider (Clerk). */
export const AuthContext = createContext<AuthContextValue | null>(null);

function loadSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(loadSession);

  const saveSession = useCallback((u: SessionUser | null) => {
    setUser(u);
    if (u) localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    else localStorage.removeItem(SESSION_KEY);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<SessionUser> => {
      const db = getDB();
      const normalized = email.trim().toLowerCase();

      if (normalized === DEMO_ACCOUNTS.lawyer.email) {
        if (password !== DEMO_ACCOUNTS.lawyer.password) throw new Error("Contraseña incorrecta");
        const lawyer = db.lawyers.find((l) => l.id === "l1")!;
        const session: SessionUser = {
          id: "u-lawyer-demo",
          role: "lawyer",
          name: `${lawyer.title} ${lawyer.displayName}`,
          email: normalized,
          lawyerId: lawyer.id,
        };
        saveSession(session);
        return session;
      }
      if (normalized === DEMO_ACCOUNTS.client.email) {
        if (password !== DEMO_ACCOUNTS.client.password) throw new Error("Contraseña incorrecta");
        const session: SessionUser = {
          id: "u-client-demo",
          role: "client",
          name: "Cliente Demo",
          email: normalized,
          clientId: "c6",
        };
        saveSession(session);
        return session;
      }
      // Cuentas de cliente creadas en esta sesión demo
      const client = db.clients.find((c) => c.email.toLowerCase() === normalized);
      if (client) {
        const session: SessionUser = {
          id: `u-${client.id}`,
          role: "client",
          name: client.name,
          email: client.email,
          clientId: client.id,
        };
        saveSession(session);
        return session;
      }
      throw new Error(
        "Cuenta no encontrada. Probá con las cuentas demo: abogado@legalhub.app o cliente@legalhub.app (contraseña: demo1234).",
      );
    },
    [saveSession],
  );

  const registerLawyer = useCallback(
    async (data: RegisterLawyerInput): Promise<SessionUser> => {
      const db = getDB();
      let slug = slugify(data.name);
      if (db.lawyers.some((l) => l.slug === slug)) slug = `${slug}-${uid("").slice(1, 5)}`;

      const lawyer: Lawyer = {
        id: uid("lw"),
        slug,
        displayName: data.name,
        title: data.title,
        professionalType: data.professionalType,
        bio: data.bio,
        photoUrl: null,
        yearsExperience: data.yearsExperience,
        matriculaNumber: data.matriculaNumber,
        registrations: data.registrations ?? [],
        isVerified: false,
        country: data.country,
        city: data.city,
        languages: ["Español"],
        specialties: data.specialties,
        modalities: ["video"],
        highlights: [],
        plan: "free",
        acceptsNewClients: true,
        cancellationPolicyHours: 24,
        cancellationLateFeePct: 0,
        profileViews: 0,
        stats: { avgRating: null, reviewCount: 0, completedConsultations: 0, recommendPct: null },
      };
      db.lawyers.push(lawyer);
      persist();

      const session: SessionUser = {
        id: `u-${lawyer.id}`,
        role: "lawyer",
        name: `${lawyer.title} ${lawyer.displayName}`,
        email: data.email,
        lawyerId: lawyer.id,
      };
      saveSession(session);
      return session;
    },
    [saveSession],
  );

  const registerClient = useCallback(
    async (data: { name: string; email: string; phone: string }): Promise<SessionUser> => {
      const db = getDB();
      let client = db.clients.find((c) => c.email.toLowerCase() === data.email.toLowerCase());
      if (!client) {
        client = { id: uid("cli"), name: data.name, email: data.email, phone: data.phone };
        db.clients.push(client);
        persist();
      }
      const session: SessionUser = {
        id: `u-${client.id}`,
        role: "client",
        name: client.name,
        email: client.email,
        clientId: client.id,
      };
      saveSession(session);
      return session;
    },
    [saveSession],
  );

  const logout = useCallback(() => saveSession(null), [saveSession]);

  const value = useMemo(
    () => ({ user, loading: false, login, registerLawyer, registerClient, logout }),
    [user, login, registerLawyer, registerClient, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
