import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/api/auth";
import { getLawyerById } from "@/api/lawyers";
import { listLawyerAppointments } from "@/api/appointments";

/** Perfil del profesional logueado (panel). */
export function useLawyer() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-lawyer", user?.lawyerId],
    queryFn: () => getLawyerById(user!.lawyerId!),
    enabled: !!user?.lawyerId,
  });
}

export function useMyAppointments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-appointments", user?.lawyerId],
    queryFn: () => listLawyerAppointments(user!.lawyerId!),
    enabled: !!user?.lawyerId,
  });
}
