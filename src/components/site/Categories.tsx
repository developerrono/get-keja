import { Bed, Building2, Square, DoorOpen, Home, Sofa } from "lucide-react";

const cats = [
  { name: "Bedsitters", icon: Bed, count: "1,240+" },
  { name: "Apartments", icon: Building2, count: "3,820+" },
  { name: "Studios", icon: Square, count: "560+" },
  { name: "Single rooms", icon: DoorOpen, count: "920+" },
  { name: "Family houses", icon: Home, count: "410+" },
  { name: "Furnished", icon: Sofa, count: "1,100+" },
];

export function Categories() {
  return (
    <section className="container-page mt-24">
      <SectionHeader
        eyebrow="Browse"
        title="Explore by category"
        subtitle="From cozy bedsitters to spacious family homes — pick your style."
      />
      <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cats.map((c) => (
          <button
            key={c.name}
            className="group rounded-2xl border border-border bg-card p-5 text-left hover:border-accent hover:shadow-card transition-all hover:-translate-y-0.5"
          >
            <div className="grid place-items-center h-10 w-10 rounded-xl bg-accent-soft text-accent group-hover:scale-110 transition-transform">
              <c.icon className="h-5 w-5" />
            </div>
            <div className="mt-4 font-semibold text-sm">{c.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{c.count} listings</div>
          </button>
        ))}
      </div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-start gap-2 max-w-2xl">
      {eyebrow && (
        <span className="text-xs font-semibold tracking-[0.2em] uppercase text-accent">
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
        {title}
      </h2>
      {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
