// Cliente Neon para las funciones serverless de Vercel.
// DATABASE_URL: connection string de Neon (pooled), en las env vars de Vercel.
import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.DATABASE_URL!);
