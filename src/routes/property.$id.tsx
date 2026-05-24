import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { properties, formatKsh } from "@/lib/properties";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/site/PropertyCard";
import {
  Bath,
  BedDouble,
  CalendarCheck,
  CheckCircle2,
  MapPin,
  MessageSquare,
  Square,
  Star,
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/property/$id")({
  loader: ({ params }) => {
    const property = properties.find((p) => p.id === params.id);
    if (!property) throw notFound();
    return { property };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.property.name} — GetKeja` : "Property — GetKeja" },
      {
        name: "description",
        content: loaderData
          ? `${loaderData.property.type} in ${loaderData.property.location}. ${formatKsh(loaderData.property.price)} / month.`
          : "Property details",
      },
    ],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Property not found</h1>
        <Link to="/listings" className="text-accent underline mt-2 inline-block">
          Back to listings
        </Link>
      </div>
    </div>
  ),
  errorComponent: () => (
    <div className="min-h-screen grid place-items-center">
      <p>Something went wrong loading this property.</p>
    </div>
  ),
  component: PropertyPage,
});

function PropertyPage() {
  const { property } = Route.useLoaderData();
  const similar = properties.filter((p) => p.id !== property.id).slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container-page py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-md bg-accent-soft text-accent">
              {property.type}
            </span>
            <h1 className="mt-3 font-display text-3xl md:text-4xl font-bold">{property.name}</h1>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{property.location}</span>
              <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-accent text-accent" />{property.rating} rating</span>
              <span className={`flex items-center gap-1 ${property.available ? "text-accent" : ""}`}>
                <CheckCircle2 className="h-4 w-4" />{property.available ? "Available now" : "Currently occupied"}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-display font-bold">{formatKsh(property.price)}</div>
            <div className="text-xs text-muted-foreground">per month</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-4 grid-rows-2 gap-2 h-[420px] rounded-3xl overflow-hidden">
          <img src={property.image} alt="" loading="lazy" className="col-span-2 row-span-2 h-full w-full object-cover" />
          <img src={property.image} alt="" loading="lazy" className="h-full w-full object-cover" />
          <img src={property.image} alt="" loading="lazy" className="h-full w-full object-cover" />
          <img src={property.image} alt="" loading="lazy" className="h-full w-full object-cover" />
          <img src={property.image} alt="" loading="lazy" className="h-full w-full object-cover" />
        </div>

        <div className="mt-10 grid lg:grid-cols-[1fr_360px] gap-10">
          <div>
            <div className="grid grid-cols-3 gap-3">
              <Spec icon={BedDouble} label="Bedrooms" value={property.bedrooms} />
              <Spec icon={Bath} label="Bathrooms" value={property.bathrooms} />
              <Spec icon={Square} label="Area" value={`${property.area} m²`} />
            </div>

            <section className="mt-10">
              <h2 className="font-display text-xl font-bold">About this place</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                A beautifully maintained {property.type.toLowerCase()} in the heart of {property.location.split(",")[0]}.
                Walking distance to shops, restaurants, and public transport. Verified by GetKeja with secure payment options
                and direct messaging with the landlord.
              </p>
            </section>

            <section className="mt-10">
              <h2 className="font-display text-xl font-bold">Amenities</h2>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {property.amenities.map((a: string) => (
                  <div key={a} className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    {a}
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-10">
              <h2 className="font-display text-xl font-bold">Location</h2>
              <div className="mt-4 rounded-2xl border border-border h-64 grid place-items-center bg-surface text-muted-foreground text-sm">
                <span className="flex items-center gap-2"><MapPin className="h-4 w-4" />Map preview · {property.location}</span>
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-20 h-fit space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full gradient-primary grid place-items-center text-primary-foreground font-bold">
                  JK
                </div>
                <div>
                  <div className="font-semibold flex items-center gap-1">
                    James Kariuki <ShieldCheck className="h-4 w-4 text-accent" />
                  </div>
                  <div className="text-xs text-muted-foreground">Verified landlord · 24 properties</div>
                </div>
              </div>
              <div className="mt-5 space-y-2">
                <Button className="w-full rounded-full gap-2">
                  <CalendarCheck className="h-4 w-4" /> Schedule a visit
                </Button>
                <Button variant="outline" className="w-full rounded-full gap-2">
                  <MessageSquare className="h-4 w-4" /> Message landlord
                </Button>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-primary-soft p-5 text-sm">
              <div className="font-semibold">{property.available ? "3 units available" : "Join the waitlist"}</div>
              <p className="text-muted-foreground mt-1">
                {property.available
                  ? "Book quickly — units like this go fast."
                  : "Get notified when this property becomes available."}
              </p>
            </div>
          </aside>
        </div>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold">Similar homes</h2>
          <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {similar.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Spec({ icon: Icon, label, value }: { icon: typeof BedDouble; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
      <span className="grid place-items-center h-10 w-10 rounded-xl bg-primary-soft text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-semibold">{value}</div>
      </div>
    </div>
  );
}
