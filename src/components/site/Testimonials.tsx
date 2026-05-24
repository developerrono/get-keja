import { Star } from "lucide-react";
import { SectionHeader } from "./Categories";

const reviews = [
  {
    name: "Wanjiku M.",
    role: "Tenant · Kilimani",
    text: "Found my bedsitter in 2 days. The verified badge gave me peace of mind.",
    rating: 5,
  },
  {
    name: "Brian O.",
    role: "Tenant · Westlands",
    text: "Visit scheduling was seamless. Loved the real-time availability.",
    rating: 5,
  },
  {
    name: "Aisha K.",
    role: "Tenant · Lavington",
    text: "Best house hunting experience I've had in Nairobi. Beautiful UI too!",
    rating: 4,
  },
];

export function Testimonials() {
  return (
    <section className="container-page mt-24">
      <SectionHeader eyebrow="Loved by tenants" title="Real reviews. Real keys." />
      <div className="mt-10 grid md:grid-cols-3 gap-4">
        {reviews.map((r) => (
          <figure
            key={r.name}
            className="rounded-2xl border border-border bg-card p-6 shadow-soft"
          >
            <div className="flex gap-0.5 text-accent">
              {Array.from({ length: r.rating }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-accent" />
              ))}
            </div>
            <blockquote className="mt-4 text-sm leading-relaxed">"{r.text}"</blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full gradient-primary grid place-items-center text-primary-foreground text-sm font-bold">
                {r.name[0]}
              </div>
              <div>
                <div className="text-sm font-semibold">{r.name}</div>
                <div className="text-xs text-muted-foreground">{r.role}</div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
