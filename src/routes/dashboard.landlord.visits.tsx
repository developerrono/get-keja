import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listVisitsForLandlord, updateVisitStatus } from "@/lib/keja-api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Check, X, Phone, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/dashboard/landlord/visits")({
  head: () => ({ meta: [{ title: "Visit Requests — Landlord" }] }),
  component: VisitsPage,
});

function VisitsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [tab, setTab] = useState<"all" | "pending" | "approved" | "declined">("all");

  const load = () => { if (user) listVisitsForLandlord(user.id).then(setItems); };
  useEffect(load, [user]);

  const filtered = tab === "all" ? items : items.filter((i) => i.status === tab);

  const update = async (id: string, status: string) => {
    try { await updateVisitStatus(id, status); toast.success(`Visit ${status}`); load(); }
    catch { toast.error("Could not update visit."); }
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <header>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Visit requests</h1>
        <p className="text-sm text-muted-foreground mt-1">Review and manage property viewing requests.</p>
      </header>

      <div className="mt-6 flex gap-2 flex-wrap">
        {(["all", "pending", "approved", "declined"] as const).map((t) => (
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
              <div className="min-w-0">
                <div className="font-semibold truncate">{v.tenant_name ?? "Tenant"}</div>
                <div className="text-xs text-muted-foreground truncate">{v.property_name}</div>
              </div>
              <StatusBadge s={v.status} />
            </div>

            <div className="mt-4 space-y-1.5 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" /> {format(new Date(v.scheduled_at), "EEE d MMM · HH:mm")}
              </div>
              {v.tenant_phone && (
                <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /> {v.tenant_phone}</div>
              )}
            </div>

            {v.status === "pending" && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button size="sm" className="gap-1" onClick={() => update(v.id, "approved")}>
                  <Check className="h-3.5 w-3.5" /> Approve
                </Button>
                <Button size="sm" variant="ghost" className="gap-1 text-destructive" onClick={() => update(v.id, "declined")}>
                  <X className="h-3.5 w-3.5" /> Decline
                </Button>
              </div>
            )}
          </article>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            No visit requests yet.
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    pending: "bg-muted text-muted-foreground",
    approved: "bg-accent-soft text-accent",
    declined: "bg-destructive/10 text-destructive",
    cancelled: "bg-destructive/10 text-destructive",
    completed: "bg-primary-soft text-primary",
  };
  return <span className={`text-[10px] font-bold px-2 py-1 rounded-full capitalize shrink-0 ${map[s] ?? "bg-muted"}`}>{s}</span>;
}
