import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { landlordProperties, type LandlordProperty, HOUSE_TYPES } from "@/lib/landlord-data";
import { formatKsh } from "@/lib/properties";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Pencil, Trash2, MapPin, DoorOpen, DoorClosed, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/landlord/properties")({
  head: () => ({ meta: [{ title: "My Properties — Landlord" }] }),
  component: PropertiesPage,
});

function PropertiesPage() {
  const [items, setItems] = useState<LandlordProperty[]>(landlordProperties);
  const [q, setQ] = useState("");
  const [county, setCounty] = useState("all");
  const [estate, setEstate] = useState("all");
  const [type, setType] = useState("all");
  const [vacancy, setVacancy] = useState("all");
  const [sort, setSort] = useState("name");

  const counties = useMemo(() => Array.from(new Set(items.map((i) => i.county))), [items]);
  const estates = useMemo(() => Array.from(new Set(items.map((i) => i.estate))), [items]);

  const filtered = useMemo(() => {
    let arr = items.filter((p) => {
      const vac = p.units.filter((u) => u.status === "vacant").length;
      if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (county !== "all" && p.county !== county) return false;
      if (estate !== "all" && p.estate !== estate) return false;
      if (type !== "all" && p.type !== type) return false;
      if (vacancy === "vacant" && vac === 0) return false;
      if (vacancy === "full" && vac > 0) return false;
      return true;
    });
    if (sort === "name") arr = [...arr].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "rent") arr = [...arr].sort((a, b) => (a.units[0]?.rent ?? 0) - (b.units[0]?.rent ?? 0));
    if (sort === "units") arr = [...arr].sort((a, b) => b.units.length - a.units.length);
    return arr;
  }, [items, q, county, estate, type, vacancy, sort]);

  const setAllUnits = (id: string, status: "vacant" | "occupied") => {
    setItems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, units: p.units.map((u) => ({ ...u, status })) } : p)),
    );
    toast.success(`All units marked ${status}`);
  };

  const remove = (id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
    toast.success("Property deleted");
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl font-bold">My Properties</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all your listings and units in one place.</p>
        </div>
        <div className="text-sm text-muted-foreground shrink-0">{filtered.length} of {items.length}</div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-6">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search property name…" className="pl-9" />
          </div>
          <Select value={county} onValueChange={setCounty}>
            <SelectTrigger><SelectValue placeholder="County" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All counties</SelectItem>
              {counties.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={estate} onValueChange={setEstate}>
            <SelectTrigger><SelectValue placeholder="Estate" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All estates</SelectItem>
              {estates.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {HOUSE_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={vacancy} onValueChange={setVacancy}>
            <SelectTrigger><SelectValue placeholder="Vacancy" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="vacant">Has vacant</SelectItem>
              <SelectItem value="full">Fully occupied</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Sort:</span>
          {[
            { v: "name", l: "Name" },
            { v: "rent", l: "Rent" },
            { v: "units", l: "Units" },
          ].map((o) => (
            <button
              key={o.v}
              onClick={() => setSort(o.v)}
              className={`px-3 py-1 rounded-full font-semibold transition-colors ${sort === o.v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => {
          const vacant = p.units.filter((u) => u.status === "vacant").length;
          const occupied = p.units.length - vacant;
          const rentFrom = Math.min(...p.units.map((u) => u.rent));
          return (
            <article key={p.id} className="rounded-2xl border border-border bg-card overflow-hidden shadow-soft flex flex-col">
              <div className="relative aspect-[16/10] overflow-hidden">
                <img src={p.cover} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                <span className={`absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-full ${vacant > 0 ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                  {vacant > 0 ? `${vacant} vacant` : "Fully occupied"}
                </span>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display font-bold truncate">{p.name}</h3>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" /> {p.estate}, {p.town}
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary-soft text-primary shrink-0">{p.type}</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-surface p-2">
                    <div className="text-[10px] text-muted-foreground uppercase">Units</div>
                    <div className="font-bold">{p.units.length}</div>
                  </div>
                  <div className="rounded-xl bg-accent-soft p-2">
                    <div className="text-[10px] text-accent uppercase">Vacant</div>
                    <div className="font-bold text-accent">{vacant}</div>
                  </div>
                  <div className="rounded-xl bg-primary-soft p-2">
                    <div className="text-[10px] text-primary uppercase">Occupied</div>
                    <div className="font-bold text-primary">{occupied}</div>
                  </div>
                </div>
                <div className="mt-4 text-sm">
                  <span className="text-muted-foreground">From </span>
                  <span className="font-bold">{formatKsh(rentFrom)}</span>
                  <span className="text-muted-foreground text-xs">/mo</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="gap-1"><Eye className="h-3.5 w-3.5" /> View</Button>
                  <Button variant="outline" size="sm" className="gap-1"><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                  <Button variant="ghost" size="sm" className="gap-1 text-accent" onClick={() => setAllUnits(p.id, "vacant")}>
                    <DoorOpen className="h-3.5 w-3.5" /> Mark vacant
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1 text-primary" onClick={() => setAllUnits(p.id, "occupied")}>
                    <DoorClosed className="h-3.5 w-3.5" /> Mark occupied
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1 text-destructive col-span-2" onClick={() => remove(p.id)}>
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
