import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { PropertyCard } from "@/components/site/PropertyCard";
import { properties } from "@/lib/properties";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { SlidersHorizontal } from "lucide-react";
import { RequireAuth } from "@/components/auth/RequireAuth";

export const Route = createFileRoute("/listings")({
  head: () => ({
    meta: [
      { title: "Browse Listings — GetKeja" },
      { name: "description", content: "Browse verified rental listings with advanced filters." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <ListingsPage />
    </RequireAuth>
  ),
});

const amenityOptions = ["WiFi", "Parking", "Furnished", "Water", "Security", "Pool"];

function ListingsPage() {
  const [maxPrice, setMaxPrice] = useState(100000);
  const [bedrooms, setBedrooms] = useState<number | null>(null);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      properties.filter(
        (p) =>
          p.price <= maxPrice &&
          (bedrooms === null || p.bedrooms === bedrooms) &&
          (query === "" ||
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.location.toLowerCase().includes(query.toLowerCase())) &&
          amenities.every((a) => p.amenities.includes(a))
      ),
    [maxPrice, bedrooms, amenities, query]
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container-page py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Browse listings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {filtered.length} of {properties.length} homes match your filters.
            </p>
          </div>
          <Input
            placeholder="Search by name or location..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-sm rounded-full"
          />
        </div>

        <div className="mt-8 grid lg:grid-cols-[280px_1fr] gap-8">
          <aside className="rounded-2xl border border-border bg-card p-5 h-fit sticky top-20">
            <div className="flex items-center gap-2 mb-5">
              <SlidersHorizontal className="h-4 w-4 text-accent" />
              <h2 className="font-semibold">Filters</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Max price: KSh {maxPrice.toLocaleString()}
                </label>
                <Slider
                  value={[maxPrice]}
                  onValueChange={(v) => setMaxPrice(v[0])}
                  min={10000}
                  max={120000}
                  step={5000}
                  className="mt-3"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Bedrooms
                </label>
                <div className="mt-2 flex gap-2 flex-wrap">
                  {[null, 1, 2, 3].map((n) => (
                    <button
                      key={String(n)}
                      onClick={() => setBedrooms(n)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                        bedrooms === n
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      {n === null ? "Any" : `${n}+`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Amenities
                </label>
                <div className="mt-3 space-y-2">
                  {amenityOptions.map((a) => (
                    <label key={a} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={amenities.includes(a)}
                        onCheckedChange={(v) => {
                          setAmenities((prev) =>
                            v ? [...prev, a] : prev.filter((x) => x !== a)
                          );
                        }}
                      />
                      {a}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
                No homes match your filters. Try widening your search.
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
