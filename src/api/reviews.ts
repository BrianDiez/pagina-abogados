import { DEMO_MODE } from "@/lib/backend";
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
    throw new Error("Las reseñas via API se cablean en la próxima etapa (POST /api/reviews).");
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
    throw new Error("Disponible al cablear el panel contra la API (próxima etapa).");
  }
  const review = getDB().reviews.find((r) => r.id === id);
  if (!review) throw new Error("Reseña no encontrada");
  review.lawyerResponse = response;
  persist();
  return delay({ ...review });
}
