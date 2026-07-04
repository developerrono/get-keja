import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { visitRequests as seed, landlordProperties, type VisitRequest } from "@/lib/landlord-data";
import { Button } from "@/components/ui/button";
import { Check, X, Clock, Phone, Mail, Calendar } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/landlord/visits")({
  head: () => ({ meta: [{ title: "Visit Requests — Landlord" }] }),
  component: VisitsPage,
});

function VisitsPage() {
  const [items, setItems] = useState<VisitRequest[]>(seed);
  const [tab, setTab] = useState<"all" | "pending" | "accepted" | "declined">("all");
  const filtered = tab === "all" ? items : items.filter((i) => i.status === tab);
  const propMap = Object.fromEntries(landlordProperties.map((p) => [p.id, p.name]));

  const update = (id: string, status: VisitRequest["status"]) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    toast.success(`Visit ${status}`);
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <header>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Visit requests</h1>
        <p className="text-sm text-muted-foreground mt-1">Review and manage property viewing requests.</p>
      </header>

      <div className="mt-6 flex gap-2 flex-wrap">
        {(["all", "pending", "accepted", "declined"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-semibold capitalize transition-colors ${
              tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {t} {t !== "all" && `(${items.filter((i) => i.status === t).length})`}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((v) => (
          <article key={v.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="grid place-items-center h-11 w-11 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                  {v.tenant.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </span>
                <div className="min-w-0">
                  <div className="font-semibold truncate">{v.tenant}</div>
                  <div className="text-xs text-muted-foreground truncate">{propMap[v.propertyId]} • Unit {v.unitNumber}</div>
                </div>
              </div>
              <StatusBadge s={v.status} />
            </div>

            <div className="mt-4 space-y-1.5 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /> {v.date} at {v.time}</div>
              <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /> {v.phone}</div>
              <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" /> {v.email}</div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <Button size="sm" className="gap-1" onClick={() => update(v.id, "accepted")}>
                <Check className="h-3.5 w-3.5" /> Accept
              </Button>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => toast.info("Reschedule flow coming soon")}>
                <Clock className="h-3.5 w-3.5" /> Reschedule
              </Button>
              <Button size="sm" variant="ghost" className="gap-1 text-destructive" onClick={() => update(v.id, "declined")}>
                <X className="h-3.5 w-3.5" /> Decline
              </Button>
            </div>
          </article>
        ))}
      </div>

      <section className="mt-10 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display font-bold">Upcoming schedule</h2>
        <p className="text-xs text-muted-foreground">A quick view of accepted visits.</p>
        <ul className="mt-4 divide-y divide-border">
          {items.filter((i) => i.status === "accepted").map((v) => (
            <li key={v.id} className="py-3 flex items-center gap-3">
              <div className="grid place-items-center h-12 w-12 rounded-2xl bg-accent-soft text-accent shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">{v.tenant} • {propMap[v.propertyId]}</div>
                <div className="text-xs text-muted-foreground">{v.date} at {v.time}</div>
              </div>
            </li>
          ))}
          {items.filter((i) => i.status === "accepted").length === 0 && (
            <li className="py-6 text-sm text-muted-foreground text-center">No accepted visits yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}

function StatusBadge({ s }: { s: VisitRequest["status"] }) {
  const map = {
    pending: "bg-muted text-muted-foreground",
    accepted: "bg-accent-soft text-accent",
    declined: "bg-destructive/10 text-destructive",
  } as const;
  return <span className={`text-[10px] font-bold px-2 py-1 rounded-full capitalize shrink-0 ${map[s]}`}>{s}</span>;
}
