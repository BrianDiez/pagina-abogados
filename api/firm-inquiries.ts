// Consultas al estudio (la notificación va al estudio, no al individuo).
// POST  /api/firm-inquiries — público (el cliente no necesita cuenta)
// GET   /api/firm-inquiries — bandeja: solo miembros del estudio
// PATCH /api/firm-inquiries — marcar leída: solo miembros
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSession, requireSession } from "./_lib/auth";
import { sql } from "./_lib/db";

async function isMember(lawyerId: string | null, firmId: string): Promise<boolean> {
  if (!lawyerId) return false;
  const rows = await sql`
    select 1 from firm_members where firm_id = ${firmId} and lawyer_id = ${lawyerId}
  `;
  return rows.length > 0;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "POST") {
    const i = req.body as {
      firmId: string;
      name: string;
      email: string;
      phone?: string;
      specialty?: string;
      message: string;
    };
    if (!i.firmId || !i.name || !i.email || !i.message) {
      return res.status(400).json({ error: "Datos incompletos" });
    }
    const rows = await sql`
      insert into firm_inquiries (firm_id, name, email, phone, specialty, message)
      values (${i.firmId}, ${i.name}, ${i.email}, ${i.phone ?? null},
              ${i.specialty ?? null}, ${i.message})
      returning *
    `;
    // TODO: email al estudio via Resend cuando haya RESEND_API_KEY
    return res.status(201).json(rows[0]);
  }

  if (req.method === "GET") {
    const session = await requireSession(req, res);
    if (!session) return;
    const { firmId } = req.query as Record<string, string>;
    if (!(await isMember(session.lawyerId, firmId))) {
      return res.status(403).json({ error: "No sos miembro de este estudio" });
    }
    const rows = await sql`
      select * from firm_inquiries where firm_id = ${firmId} order by created_at desc
    `;
    return res.status(200).json(rows);
  }

  if (req.method === "PATCH") {
    const session = await getSession(req);
    if (!session) return res.status(401).json({ error: "No autorizado" });
    const { id } = req.body as { id: string };
    const inquiries = await sql`select firm_id from firm_inquiries where id = ${id}`;
    if (inquiries.length === 0) return res.status(404).json({ error: "No encontrada" });
    if (!(await isMember(session.lawyerId, String(inquiries[0]!.firm_id)))) {
      return res.status(403).json({ error: "No sos miembro de este estudio" });
    }
    await sql`update firm_inquiries set is_read = true where id = ${id}`;
    return res.status(204).end();
  }

  return res.status(405).json({ error: "Método no permitido" });
}
