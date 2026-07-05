import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminListProperties, adminUpdateProperty, formatKsh, type DbProperty } from "@/lib/keja-api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/admin/properties")({ component: Props });

function Props() {
  const [rows, setRows] = useState<DbProperty[]>([]);
  const load = () => adminListProperties().then(setRows);
  useEffect(() => { load(); }, []);
  const setStatus = async (id: string, status: DbProperty["status"]) => {
    try { await adminUpdateProperty(id, { status }); toast.success(`Marked ${status}`); load(); }
    catch { toast.error("Update failed"); }
  };
  return (
    <div className="p-6 lg:p-10">
      <h1 className="font-display text-2xl md:text-3xl font-bold">Property moderation</h1>
      <div className="mt-6 space-y-3">
        {rows.map((p) => (
          <div key={p.id} className="rounded-2xl border border-border bg-card p-4 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{p.name}</div>
              <div className="text-xs text-muted-foreground">{p.county} · {formatKsh(p.monthly_rent)} · {p.status}</div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setStatus(p.id, "active")}>Approve</Button>
              <Button size="sm" variant="outline" onClick={() => setStatus(p.id, "hidden")}>Hide</Button>
              <Button size="sm" variant="outline" onClick={() => setStatus(p.id, "rejected")}>Reject</Button>
              <Button size="sm" onClick={() => adminUpdateProperty(p.id, { featured: !p.featured }).then(load)}>{p.featured ? "Unfeature" : "Feature"}</Button>
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">No properties yet.</div>}
      </div>
    </div>
  );
}
