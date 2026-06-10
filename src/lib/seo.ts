// SEO por página para SPA: título, description, canonical, OG y JSON-LD.
// Nota: para indexación perfecta de perfiles conviene prerender/SSR (Fase 3);
// esto cubre lo esencial y todo lo que Google ejecuta con JS habilitado.
import { useEffect } from "react";

const SITE_NAME = "LegalHub";
const SITE_URL = "https://legalhub.app"; // actualizar al dominio definitivo

interface PageMeta {
  title: string;
  description?: string;
  /** path canónico, ej. "/abogados" */
  path?: string;
  /** objeto schema.org serializable; se inyecta como JSON-LD */
  jsonLd?: object;
  noindex?: boolean;
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function usePageMeta({ title, description, path, jsonLd, noindex }: PageMeta) {
  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    document.title = fullTitle;

    if (description) {
      upsertMeta("name", "description", description);
      upsertMeta("property", "og:description", description);
    }
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:locale", "es_UY");
    upsertMeta("name", "twitter:card", "summary_large_image");

    if (path !== undefined) {
      const href = `${SITE_URL}${path}`;
      let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = href;
      upsertMeta("property", "og:url", href);
    }

    let robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (noindex) {
      if (!robots) {
        robots = document.createElement("meta");
        robots.name = "robots";
        document.head.appendChild(robots);
      }
      robots.content = "noindex,nofollow";
    } else if (robots) {
      robots.remove();
    }

    const JSONLD_ID = "page-jsonld";
    document.getElementById(JSONLD_ID)?.remove();
    if (jsonLd) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = JSONLD_ID;
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
    return () => {
      document.getElementById(JSONLD_ID)?.remove();
    };
  }, [title, description, path, noindex, JSON.stringify(jsonLd)]);
}

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  description:
    "Plataforma para abogados, escribanos y notarios en LATAM: agenda online, cobro de consultas, videollamada y reseñas verificadas.",
  areaServed: ["UY", "AR"],
};

export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function attorneyJsonLd(input: {
  name: string;
  title: string;
  city: string;
  country: string;
  slug: string;
  photoUrl?: string | null;
  specialties: string[];
  rating: number | null;
  reviewCount: number;
  isNotary: boolean;
}) {
  return {
    "@context": "https://schema.org",
    "@type": input.isNotary ? "Notary" : "Attorney",
    name: `${input.title} ${input.name}`,
    url: `${SITE_URL}/p/${input.slug}`,
    ...(input.photoUrl ? { image: input.photoUrl } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: input.city,
      addressCountry: input.country,
    },
    knowsAbout: input.specialties,
    ...(input.rating && input.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: input.rating,
            reviewCount: input.reviewCount,
            bestRating: 5,
          },
        }
      : {}),
  };
}
