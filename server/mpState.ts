// State firmado para el OAuth de MercadoPago (anti-CSRF, stateless).
// Encodea el lawyerId + expiración y lo firma con HMAC-SHA256 usando el
// client secret. En el callback se verifica firma y vigencia.

async function hmac(key: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

const b64url = (s: string) =>
  btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64url = (s: string) =>
  atob(s.replace(/-/g, "+").replace(/_/g, "/"));

export async function signState(secret: string, lawyerId: string): Promise<string> {
  const payload = b64url(JSON.stringify({ l: lawyerId, exp: Date.now() + 10 * 60_000 }));
  const sig = await hmac(secret, payload);
  return `${payload}.${sig}`;
}

export async function verifyState(secret: string, state: string): Promise<string | null> {
  const [payload, sig] = state.split(".");
  if (!payload || !sig) return null;
  if ((await hmac(secret, payload)) !== sig) return null;
  try {
    const { l, exp } = JSON.parse(unb64url(payload)) as { l: string; exp: number };
    if (Date.now() > exp) return null;
    return l;
  } catch {
    return null;
  }
}
