import { DEMO_MODE } from "@/lib/backend";
import { apiFetch } from "@/lib/http";
import { delay, getDB, persist, uid } from "@/data/demo/store";
import { getLawyerReviews } from "./lawyers";
import type { Review } from "@/types";

export async function listReviews(lawyerId: string): Promise<Review[]> {
  if (!DEMO_MODE) {
    return getLawyerReviews(lawyerId); // viene del bundle del perfil (API neon)
  }
  return delay(
    getDB()
      .reviews.filter((r) => r.lawyerId === lawyerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );
}

export async function createReview(data: Omit<Review, "id" | "createdAt">): Promise<Review> {
  if (!DEMO_MODE) {
    const row = await apiFetch<Record<string, unknown>>("/api/reviews", {
      method: "POST",
      auth: true,
      body: JSON.stringify({
        appointmentId: data.appointmentId,
        ratingOverall: data.ratingOverall,
        textReview: data.textReview,
        wouldRecommend: data.wouldRecommend,
        isAnonymous: data.isAnonymous,
      }),
    });
    return {
      ...data,
      id: String(row.id),
      createdAt: String(row.created_at),
    };
  }
  const db = getDB();
  const appointment = db.appointments.find((a) => a.id === data.appointmentId);
  if (!appointment || appointment.status !== "completed") {
    throw new Error("Solo se puede reseñar una consulta completada");
  }
  if (db.reviews.some((r) => r.appointmentId === data.appointmentId)) {
    throw new Error("Esta consulta ya tiene una reseña");
  }
  const review: Review = { ...data, id: uid("rev"), createdAt: new Date().toISOString() };
  db.reviews.push(review);
  persist();
  return delay(review);
}

export async function respondToReview(id: string, response: string): Promise<Review> {
  if (!DEMO_MODE) {
    const row = await apiFetch<Record<string, unknown>>("/api/reviews", {
      method: "PATCH",
      auth: true,
      body: JSON.stringify({ id, response }),
    });
    return {
      id: String(row.id),
      lawyerId: String(row.lawyer_id),
      appointmentId: String(row.appointment_id),
      ratingOverall: Number(row.rating_overall),
      textReview: String(row.text_review ?? ""),
      wouldRecommend: Boolean(row.would_recommend),
      isAnonymous: Boolean(row.is_anonymous),
      clientName: "Cliente",
      lawyerResponse: String(row.lawyer_response ?? ""),
      createdAt: String(row.created_at),
    };
  }
  const review = getDB().reviews.find((r) => r.id === id);
  if (!review) throw new Error("Reseña no encontrada");
  review.lawyerResponse = response;
  persist();
  return delay({ ...review });
}
