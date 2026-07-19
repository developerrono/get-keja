import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PropertyCardDB } from "@/components/site/PropertyCardDB";
import {
  fetchProperties, listFavorites, AMENITY_OPTIONS, HOUSE_TYPES, KENYA_COUNTIES,
  type DbProperty, type PropertyFilters,
} from "@/lib/keja-api";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/dashboard/tenant/search")({ component: AdvancedSearch });

function AdvancedSearch() {
  const { user } = useAuth();
  const [f, setF] = useState<PropertyFilters>({ sort: "newest", limit: 24 });
  const [rows, setRows] = useState<DbProperty[]>([]);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) listFavorites(user.id).then((x) => setFavIds(new Set(x.map((y) => y.id)))); }, [user]);

  const run = async () => {
    setLoading(true);
    const r = await fetchProperties(f);
    setRows(r.rows);
    setLoading(false);
  };
  useEffect(() => { run(); /* eslint-disable-next-line */ }, []);

  const toggleAmenity = (a: string) =>
    setF((prev) => ({ ...prev, amenities: prev.amenities?.includes(a) ? prev.amenities.filter((x) => x !== a) : [...(prev.amenities ?? []), a] }));

  return (
    <div className="p-6 lg:p-10">
      <h1 className="font-display text-2xl md:text-3xl font-bold">Advanced search</h1>
      <p className="text-sm text-muted-foreground mt-1">Fine-tune your criteria to find the perfect keja.</p>

      <div className="mt-6 grid lg:grid-cols-[320px_1fr] gap-6">
        <aside className="rounded-2xl border border-border bg-card p-5 h-fit space-y-5">
          <div>
            <Label>Search</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={f.q ?? ""} onChange={(e) => setF({ ...f, q: e.target.value })} placeholder="Name or estate" className="pl-9" />
            </div>
          </div>
          <div>
            <Label>County</Label>
            <Select value={f.county ?? "any"} onValueChange={(v) => setF({ ...f, county: v === "any" ? undefined : v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {KENYA_COUNTIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Estate</Label>
            <Input value={f.estate ?? ""} onChange={(e) => setF({ ...f, estate: e.target.value || undefined })} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Min KSh</Label><Input type="number" value={f.min_price ?? ""} onChange={(e) => setF({ ...f, min_price: Number(e.target.value) || undefined })} className="mt-1" /></div>
            <div><Label>Max KSh</Label><Input type="number" value={f.max_price ?? ""} onChange={(e) => setF({ ...f, max_price: Number(e.target.value) || undefined })} className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Bedrooms</Label><Input type="number" value={f.bedrooms ?? ""} onChange={(e) => setF({ ...f, bedrooms: Number(e.target.value) || null })} className="mt-1" /></div>
            <div><Label>Bathrooms</Label><Input type="number" value={f.bathrooms ?? ""} onChange={(e) => setF({ ...f, bathrooms: Number(e.target.value) || null })} className="mt-1" /></div>
          </div>
          <div>
            <Label>House type</Label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {HOUSE_TYPES.map((t) => {
                const on = f.house_types?.includes(t);
                return (
                  <button key={t} onClick={() => setF((p) => ({ ...p, house_types: on ? p.house_types!.filter((x) => x !== t) : [...(p.house_types ?? []), t] }))}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${on ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}>{t}</button>
                );
              })}
            </div>
          </div>
          <div>
            <Label>Amenities</Label>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {AMENITY_OPTIONS.map((a) => (
                <label key={a} className="flex items-center gap-2 text-xs">
                  <Checkbox checked={f.amenities?.includes(a) ?? false} onCheckedChange={() => toggleAmenity(a)} />
                  {a}
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label>Sort by</Label>
            <Select value={f.sort ?? "newest"} onValueChange={(v) => setF({ ...f, sort: v as PropertyFilters["sort"] })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price_asc">Lowest price</SelectItem>
                <SelectItem value="price_desc">Highest price</SelectItem>
                <SelectItem value="rating">Highest rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={run} className="w-full rounded-full">{loading ? "Searching..." : "Apply filters"}</Button>
        </aside>

        <div>
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">No homes match your filters.</div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {rows.map((p) => <PropertyCardDB key={p.id} property={p} initialSaved={favIds.has(p.id)} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
