// Puente Clerk → contexto de sesión de LegalHub (solo en BACKEND='neon').
// Monta ClerkProvider, inyecta el token getter al cliente HTTP y resuelve
// el rol/lawyerId desde /api/me.
import { useEffect, type ReactNode } from "react";
import { ClerkProvider, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { setTokenGetter } from "@/lib/http";

function TokenBridge({ children }: { children: ReactNode }) {
  const { getToken, isSignedIn } = useClerkAuth();

  useEffect(() => {
    setTokenGetter(isSignedIn ? () => getToken() : null);
    return () => setTokenGetter(null);
  }, [getToken, isSignedIn]);

  return <>{children}</>;
}

export function ClerkRoot({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY!}
      afterSignOutUrl="/"
    >
      <TokenBridge>{children}</TokenBridge>
    </ClerkProvider>
  );
}
