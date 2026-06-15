// Auth real con Clerk (solo BACKEND='neon'): monta ClerkProvider, inyecta el
// token al cliente HTTP y provee el MISMO AuthContext que el modo demo, así
// ninguna página necesita saber qué backend corre.
import { useCallback, useEffect, useMemo, type ReactNode } from "react";
import {
  ClerkProvider,
  useAuth as useClerkAuth,
  useUser,
} from "@clerk/clerk-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthContext, type AuthContextValue, type RegisterLawyerInput } from "@/api/auth";
import { apiFetch, setTokenGetter } from "@/lib/http";
import type { SessionUser } from "@/types";

interface MeResponse {
  userId: string;
  role: "lawyer" | "client" | "admin";
  lawyerId: string | null;
}

function NeonAuthProvider({ children }: { children: ReactNode }) {
  const { getToken, isSignedIn, isLoaded, signOut } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const queryClient = useQueryClient();

  useEffect(() => {
    setTokenGetter(isSignedIn ? () => getToken() : null);
    return () => setTokenGetter(null);
  }, [getToken, isSignedIn]);

  const { data: me, isPending: mePending } = useQuery({
    queryKey: ["me", clerkUser?.id],
    queryFn: () => apiFetch<MeResponse>("/api/me", { auth: true }),
    enabled: !!isSignedIn,
    staleTime: 60_000,
    retry: 2,
  });

  // Crítico: mientras Clerk inicializa o /api/me está en vuelo, la sesión está
  // "cargando" — NO "deslogueada". Confundirlas causaba un bucle de redirects
  // (SignUp montado con sesión activa → redirect a la misma página → loop).
  const loading = !isLoaded || (!!isSignedIn && mePending);

  const user: SessionUser | null = useMemo(() => {
    if (!isSignedIn || !clerkUser || !me) return null;
    return {
      id: clerkUser.id,
      role: me.role,
      name: clerkUser.fullName ?? clerkUser.primaryEmailAddress?.emailAddress ?? "Usuario",
      email: clerkUser.primaryEmailAddress?.emailAddress ?? "",
      lawyerId: me.lawyerId ?? undefined,
      clientId: me.role === "client" ? "me" : undefined,
    };
  }, [isSignedIn, clerkUser, me]);

  const registerLawyer = useCallback(
    async (data: RegisterLawyerInput): Promise<SessionUser> => {
      await apiFetch("/api/me", {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          profile: {
            displayName: data.name,
            title: data.title,
            professionalType: data.professionalType,
            country: data.country,
            province: data.province ?? "",
            city: data.city ?? "",
            matriculaNumber: data.matriculaNumber,
            registrations: data.registrations ?? [],
            yearsExperience: data.yearsExperience,
            bio: data.bio,
            specialties: data.specialties,
            topics: data.topics ?? [],
            highlights: data.highlights ?? [],
          },
        }),
      });
      // refetch (no invalidate): espera la sesión actualizada con rol lawyer
      // antes de navegar al panel
      await queryClient.refetchQueries({ queryKey: ["me"] });
      return user!;
    },
    [queryClient, user],
  );

  const value: AuthContextValue = useMemo(
    () => ({
      user,
      loading,
      // En neon el login/alta de cuenta lo maneja la UI de Clerk:
      login: async () => {
        throw new Error("Usá el formulario de Clerk para ingresar.");
      },
      registerLawyer,
      registerClient: async () => {
        throw new Error("Creá tu cuenta con el formulario de Clerk.");
      },
      logout: () => void signOut(),
    }),
    [user, loading, registerLawyer, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function ClerkRoot({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY!}
      afterSignOutUrl="/"
    >
      <NeonAuthProvider>{children}</NeonAuthProvider>
    </ClerkProvider>
  );
}

// Componentes de UI de Clerk re-exportados para lazy-load desde las páginas
// (así Clerk no entra al bundle principal en modo demo).
export { SignIn as ClerkSignIn, SignUp as ClerkSignUp } from "@clerk/clerk-react";
