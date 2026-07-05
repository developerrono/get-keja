import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listVisits, updateVisitStatus } from "@/lib/keja-api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/dashboard/tenant/visits")({ component: Visits });

function Visits() {
  const { user } = useAuth();
  const [items, setItems] = useState<Awaited<ReturnType<typeof listVisits>>>([]);
  const load = () => { if (user) listVisits(user.id).then(setItems); };
  useEffect(load, [user]);

  const cancel = async (id: string) => {
    try { await updateVisitStatus(id, "cancelled"); toast.success("Visit cancelled"); load(); }
    catch { toast.error("Could not cancel"); }
  };

  return (
    <div className="p-6 lg:p-10">
      <h1 className="font-display text-2xl md:text-3xl font-bold">My visits</h1>
      <p className="text-sm text-muted-foreground mt-1">Track and manage your scheduled house visits.</p>

      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">No visits scheduled yet.</div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((v) => {
            const prop = (v as unknown as { properties: { name: string; cover_image: string | null; county: string; estate: string | null } }).properties;
            return (
              <div key={v.id} className="rounded-2xl border border-border bg-card p-4 flex flex-wrap items-center gap-4">
                {prop?.cover_image && <img src={prop.cover_image} alt="" className="h-16 w-16 rounded-xl object-cover" />}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{prop?.name}</div>
                  <div className="text-xs text-muted-foreground">{[prop?.estate, prop?.county].filter(Boolean).join(", ")}</div>
                  <div className="text-xs mt-1">{format(new Date(v.scheduled_at), "EEE d MMM · HH:mm")}</div>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  v.status === "approved" ? "bg-accent text-accent-foreground" :
                  v.status === "declined" || v.status === "cancelled" ? "bg-destructive/10 text-destructive" :
                  "bg-muted"
                }`}>{v.status}</span>
                {(v.status === "pending" || v.status === "approved") && (
                  <Button size="sm" variant="outline" onClick={() => cancel(v.id)}>Cancel</Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
