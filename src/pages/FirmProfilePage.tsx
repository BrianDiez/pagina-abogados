import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  MapPin,
  Globe,
  Linkedin,
  Instagram,
  Twitter,
  Phone,
  Mail,
  CalendarDays,
  Send,
  CheckCircle2,
  Users,
} from "lucide-react";
import { getFirmBySlug, getFirmMembers, createFirmInquiry } from "@/api/firms";
import { usePageMeta } from "@/lib/seo";
import { specialtyLabel, SPECIALTIES } from "@/lib/constants";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LawyerCard } from "@/components/LawyerCard";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, VerifiedBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { FieldLabel, Input, Select, Textarea } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/misc";
import type { Firm } from "@/types";

const inquirySchema = z.object({
  name: z.string().min(3, "Ingresá tu nombre"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  specialty: z.string().optional(),
  message: z.string().min(20, "Contanos un poco más (mínimo 20 caracteres)").max(800),
});
type InquiryForm = z.infer<typeof inquirySchema>;

function socialLinks(firm: Firm) {
  const { website, linkedin, instagram, x } = firm.socials;
  return [
    website && { href: website, icon: Globe, label: "Sitio web" },
    linkedin && { href: linkedin, icon: Linkedin, label: "LinkedIn" },
    instagram && { href: instagram, icon: Instagram, label: "Instagram" },
    x && { href: x, icon: Twitter, label: "X" },
  ].filter(Boolean) as { href: string; icon: typeof Globe; label: string }[];
}

function ContactFirmCard({ firm }: { firm: Firm }) {
  const [sent, setSent] = useState(false);
  const form = useForm<InquiryForm>({ resolver: zodResolver(inquirySchema) });

  const mutation = useMutation({
    mutationFn: (data: InquiryForm) => createFirmInquiry({ firmId: firm.id, ...data }),
    onSuccess: () => setSent(true),
  });

  if (sent) {
    return (
      <Card className="p-6 text-center">
        <CheckCircle2 className="mx-auto size-10 text-success" />
        <h3 className="mt-3 font-display text-xl font-semibold text-navy-800">
          Consulta enviada
        </h3>
        <p className="mt-1 text-sm text-navy-500">
          El equipo de {firm.name} fue notificado y te va a responder a tu email.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="flex items-center gap-2 font-display text-xl font-semibold text-navy-800">
        <Send className="size-5 text-gold-500" />
        Contactar al estudio
      </h3>
      <p className="mt-1 text-xs text-navy-400">
        Tu consulta le llega al equipo del estudio, que la deriva al profesional adecuado.
      </p>
      <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="mt-4 space-y-3">
        <FieldLabel label="Nombre" required error={form.formState.errors.name?.message}>
          <Input placeholder="Tu nombre" {...form.register("name")} />
        </FieldLabel>
        <div className="grid grid-cols-2 gap-3">
          <FieldLabel label="Email" required error={form.formState.errors.email?.message}>
            <Input type="email" placeholder="tu@email.com" {...form.register("email")} />
          </FieldLabel>
          <FieldLabel label="Teléfono">
            <Input placeholder="+598 …" {...form.register("phone")} />
          </FieldLabel>
        </div>
        <FieldLabel label="Tema (opcional)">
          <Select {...form.register("specialty")}>
            <option value="">No estoy seguro/a</option>
            {firm.specialties.map((s) => (
              <option key={s} value={s}>
                {specialtyLabel(s)}
              </option>
            ))}
            {SPECIALTIES.filter((s) => !firm.specialties.includes(s.id)).map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </Select>
        </FieldLabel>
        <FieldLabel label="Tu consulta" required error={form.formState.errors.message?.message}>
          <Textarea
            rows={4}
            placeholder="Contanos brevemente tu situación…"
            {...form.register("message")}
          />
        </FieldLabel>
        <Button type="submit" variant="gold" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? "Enviando…" : "Enviar consulta al estudio"}
        </Button>
      </form>
    </Card>
  );
}

export function FirmProfilePage() {
  const { slug = "" } = useParams();

  const { data: firm, isLoading } = useQuery({
    queryKey: ["firm", slug],
    queryFn: () => getFirmBySlug(slug),
  });
  const { data: members } = useQuery({
    queryKey: ["firm-members", firm?.id],
    queryFn: () => getFirmMembers(firm!.id),
    enabled: !!firm,
  });

  usePageMeta({
    title: firm ? `${firm.name} — Estudio jurídico en ${firm.city}` : "Estudio jurídico",
    description: firm
      ? `${firm.tagline ?? "Estudio jurídico"} · ${firm.specialties.map(specialtyLabel).slice(0, 4).join(", ")}. Conocé al equipo y agendá online.`
      : undefined,
    path: `/e/${slug}`,
    jsonLd: firm
      ? {
          "@context": "https://schema.org",
          "@type": "LegalService",
          name: firm.name,
          description: firm.tagline,
          url: `https://legalhub.app/e/${firm.slug}`,
          address: { "@type": "PostalAddress", addressLocality: firm.city, addressCountry: firm.country },
          ...(firm.foundedYear ? { foundingDate: String(firm.foundedYear) } : {}),
          ...(firm.socials.website ? { sameAs: Object.values(firm.socials).filter(Boolean) } : {}),
        }
      : undefined,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-5xl animate-pulse space-y-4 px-4 py-12 sm:px-6">
          <div className="h-44 rounded-2xl bg-navy-100/50" />
          <div className="h-72 rounded-2xl bg-navy-100/50" />
        </div>
      </div>
    );
  }

  if (!firm) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6">
          <EmptyState
            title="Estudio no encontrado"
            subtitle="El estudio que buscás no existe o fue dado de baja."
            action={<ButtonLink to="/estudios">Ver estudios</ButtonLink>}
          />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      {/* Cabecera del estudio */}
      <section className="border-b border-navy-100 bg-navy-900">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar name={firm.name} src={firm.logoUrl} size="xl" />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">
                  {firm.name}
                </h1>
                {firm.isVerified && <VerifiedBadge />}
              </div>
              {firm.tagline && <p className="mt-1 text-navy-100">{firm.tagline}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-navy-300">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-4" />
                  {firm.city}, {firm.country === "UY" ? "Uruguay" : "Argentina"}
                </span>
                {firm.foundedYear && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="size-4" />
                    Desde {firm.foundedYear}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Users className="size-4" />
                  {firm.memberIds.length} profesional{firm.memberIds.length !== 1 && "es"}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {socialLinks(firm).map(({ href, icon: Icon, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    title={label}
                    className="flex size-9 items-center justify-center rounded-full border border-navy-600 text-navy-200 transition-colors hover:border-gold-400 hover:text-gold-400"
                  >
                    <Icon className="size-4" />
                  </a>
                ))}
                {firm.phone && (
                  <a
                    href={`tel:${firm.phone.replace(/\s/g, "")}`}
                    className="flex h-9 items-center gap-1.5 rounded-full border border-navy-600 px-3 text-xs text-navy-200 transition-colors hover:border-gold-400 hover:text-gold-400"
                  >
                    <Phone className="size-3.5" />
                    {firm.phone}
                  </a>
                )}
                {firm.email && (
                  <a
                    href={`mailto:${firm.email}`}
                    className="flex h-9 items-center gap-1.5 rounded-full border border-navy-600 px-3 text-xs text-navy-200 transition-colors hover:border-gold-400 hover:text-gold-400"
                  >
                    <Mail className="size-3.5" />
                    {firm.email}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-10">
          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold text-navy-800">
              Sobre el estudio
            </h2>
            <p className="leading-relaxed text-navy-600">{firm.description}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {firm.specialties.map((s) => (
                <Badge key={s} tone="navy">
                  {specialtyLabel(s)}
                </Badge>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-4 font-display text-2xl font-semibold text-navy-800">
              Nuestro equipo
            </h2>
            <p className="mb-4 text-sm text-navy-400">
              También podés agendar directamente con cada profesional desde su perfil.
            </p>
            <div className="grid gap-5 md:grid-cols-2">
              {(members ?? []).map((m) => (
                <LawyerCard key={m.id} lawyer={m} />
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <ContactFirmCard firm={firm} />
        </aside>
      </div>

      <Footer />
    </div>
  );
}
