// Compartido por las Cloudflare Pages Functions (functions/api/*).
// En Workers no existe process.env: las variables llegan en context.env.
import { neon } from "@neondatabase/serverless";

export interface Env {
  DATABASE_URL: string;
  CLERK_SECRET_KEY: string;
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET: string;
  R2_PUBLIC_URL: string;
  // MercadoPago (opcionales: si faltan, el checkout cae a gateway 'demo')
  MP_CLIENT_ID?: string;
  MP_CLIENT_SECRET?: string;
  APP_URL?: string; // p. ej. https://localhub-5am.pages.dev
}

/** ¿Está configurada la integración de MercadoPago a nivel plataforma? */
export function mpConfigured(env: Env): boolean {
  return !!(env.MP_CLIENT_ID && env.MP_CLIENT_SECRET && env.APP_URL);
}

/** Contexto de una Pages Function (tipado mínimo, sin dependencia extra). */
export interface Ctx {
  request: Request;
  env: Env;
  params: Record<string, string | string[]>;
}

export type Handler = (ctx: Ctx) => Promise<Response> | Response;

export function getSql(env: Env) {
  return neon(env.DATABASE_URL);
}

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

export function error(message: string, status: number): Response {
  return json({ error: message }, status);
}
