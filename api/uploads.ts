// POST /api/uploads — presigned URL para subir a Cloudflare R2 (S3-compatible).
// El archivo va directo del navegador a R2: la API solo firma, nunca recibe bytes.
// Env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL
import { randomUUID } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { AwsClient } from "aws4fetch";
import { requireSession } from "./_lib/auth";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};
const MAX_MB = 10;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });
  const session = await requireSession(req, res);
  if (!session) return;

  const { contentType, kind, sizeBytes } = req.body as {
    contentType: string;
    kind: "photo" | "document" | "logo";
    sizeBytes: number;
  };
  const ext = ALLOWED_TYPES[contentType];
  if (!ext) return res.status(422).json({ error: "Tipo de archivo no permitido" });
  if (sizeBytes > MAX_MB * 1024 * 1024) {
    return res.status(422).json({ error: `Máximo ${MAX_MB} MB` });
  }

  const key = `${kind}/${session.userId}/${randomUUID()}.${ext}`;
  const r2 = new AwsClient({
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  });
  const endpoint = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET}/${key}`;

  const signed = await r2.sign(
    new Request(`${endpoint}?X-Amz-Expires=600`, { method: "PUT" }),
    { aws: { signQuery: true, service: "s3" } },
  );

  return res.status(200).json({
    uploadUrl: signed.url,
    publicUrl: `${process.env.R2_PUBLIC_URL}/${key}`,
    key,
  });
}
