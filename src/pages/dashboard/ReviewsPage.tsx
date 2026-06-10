import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquareReply, Star } from "lucide-react";
import { useAuth } from "@/api/auth";
import { listReviews, respondToReview } from "@/api/reviews";
import { useLawyer } from "./useLawyer";
import { specialtyLabel } from "@/lib/constants";
import { formatDateShort } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Stars } from "@/components/ui/Rating";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { EmptyState, StatCard } from "@/components/ui/misc";

export function ReviewsPage() {
  const { user } = useAuth();
  const { data: lawyer } = useLawyer();
  const queryClient = useQueryClient();
  const lawyerId = user!.lawyerId!;
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");

  const { data: reviews } = useQuery({
    queryKey: ["reviews", lawyerId],
    queryFn: () => listReviews(lawyerId),
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => respondToReview(id, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", lawyerId] });
      setRespondingTo(null);
      setResponseText("");
    },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-semibold text-navy-800">Reseñas</h1>
        <p className="text-sm text-navy-400">
          Solo clientes con consultas completadas y pagas pueden dejar reseñas.
        </p>
      </div>

      {lawyer && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Calificación promedio"
            value={lawyer.stats.avgRating?.toFixed(1) ?? "—"}
            icon={<Star className="size-5" />}
          />
          <StatCard label="Total de reseñas" value={String(lawyer.stats.reviewCount)} />
          <StatCard
            label="Te recomiendan"
            value={lawyer.stats.recommendPct !== null ? `${lawyer.stats.recommendPct}%` : "—"}
          />
        </div>
      )}

      <div className="space-y-4">
        {reviews && reviews.length > 0 ? (
          reviews.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <Avatar name={r.clientName} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-navy-800">{r.clientName}</p>
                    <p className="text-xs text-navy-400">
                      {formatDateShort(r.createdAt)}
                      {r.specialtyConsulted && ` · ${specialtyLabel(r.specialtyConsulted)}`}
                    </p>
                  </div>
                </div>
                <Stars value={r.ratingOverall} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-navy-600">{r.textReview}</p>

              {r.lawyerResponse ? (
                <div className="mt-3 rounded-xl bg-navy-50 p-3.5">
                  <p className="text-xs font-semibold text-navy-700">Tu respuesta</p>
                  <p className="mt-1 text-sm text-navy-600">{r.lawyerResponse}</p>
                </div>
              ) : respondingTo === r.id ? (
                <div className="mt-3 space-y-2">
                  <Textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Tu respuesta pública…"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={responseText.trim().length < 5 || respondMutation.isPending}
                      onClick={() => respondMutation.mutate({ id: r.id, text: responseText })}
                    >
                      Publicar respuesta
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setRespondingTo(null)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-3"
                  onClick={() => setRespondingTo(r.id)}
                >
                  <MessageSquareReply className="size-4" />
                  Responder públicamente
                </Button>
              )}
            </Card>
          ))
        ) : (
          <EmptyState
            icon={<Star className="size-10" />}
            title="Todavía no tenés reseñas"
            subtitle="Después de cada consulta completada, el cliente recibe una invitación a reseñarte."
          />
        )}
      </div>
    </div>
  );
}
