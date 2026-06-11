// POST /api/uploads — presigned URL para subir directo del navegador a R2
import { AwsClient } from "aws4fetch";
import { json, error, type Handler } from "../../server/db";
import { getSession } from "../../server/auth";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};
const MAX_MB = 10;

export const onRequestPost: Handler = async ({ request, env }) => {
  const session = await getSession(request, env);
  if (!session) return error("No autorizado", 401);

  const { contentType, kind, sizeBytes } = (await request.json()) as {
    contentType: string;
    kind: "photo" | "document" | "logo";
    sizeBytes: number;
  };
  const ext = ALLOWED_TYPES[contentType];
  if (!ext) return error("Tipo de archivo no permitido", 422);
  if (sizeBytes > MAX_MB * 1024 * 1024) return error(`Máximo ${MAX_MB} MB`, 422);

  const key = `${kind}/${session.userId}/${crypto.randomUUID()}.${ext}`;
  const r2 = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  });
  const endpoint = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${key}`;
  const signed = await r2.sign(new Request(`${endpoint}?X-Amz-Expires=600`, { method: "PUT" }), {
    aws: { signQuery: true, service: "s3" },
  });

  return json({ uploadUrl: signed.url, publicUrl: `${env.R2_PUBLIC_URL}/${key}`, key });
};

export const onRequest: Handler = () => error("Método no permitido", 405);
