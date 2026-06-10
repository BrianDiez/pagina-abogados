import { DEMO_MODE } from "@/lib/demo";
import { getSupabase } from "@/lib/supabase";
import { delay, getDB, persist, uid } from "@/data/demo/store";
import type { Review } from "@/types";

export async function listReviews(lawyerId: string): Promise<Review[]> {
  if (!DEMO_MODE) {
    const { data, error } = await getSupabase()
      .from("reviews")
      .select("*")
      .eq("lawyer_id", lawyerId)
      .eq("is_published", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as unknown as Review[];
  }
  return delay(
    getDB()
      .reviews.filter((r) => r.lawyerId === lawyerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );
}

export async function createReview(
  data: Omit<Review, "id" | "createdAt">,
): Promise<Review> {
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
  const review = getDB().reviews.find((r) => r.id === id);
  if (!review) throw new Error("Reseña no encontrada");
  review.lawyerResponse = response;
  persist();
  return delay({ ...review });
}
