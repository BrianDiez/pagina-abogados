// Selección de backend:
//  - 'demo': datos seed en localStorage (default — funciona sin servicios externos)
//  - 'neon': API serverless en /api (Vercel Functions + Neon Postgres + Clerk + R2)
export type Backend = "demo" | "neon";

export const BACKEND: Backend =
  (import.meta.env.VITE_BACKEND as Backend | undefined) === "neon" &&
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
    ? "neon"
    : "demo";

export const DEMO_MODE = BACKEND === "demo";
