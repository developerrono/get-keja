import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminListReports, adminUpdateReport, type DbReport } from "@/lib/keja-api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/admin/reports")({ component: Reports });

function Reports() {
  const [rows, setRows] = useState<DbReport[]>([]);
  const [loading, setLoading] = useState(true);
  const load = () => {
    setLoading(true);
    adminListReports()
      .then(setRows)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Couldn't load reports"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);
  const set = async (id: string, status: DbReport["status"]) => {
    try { await adminUpdateReport(id, { status }); toast.success("Updated"); load(); } catch { toast.error("Failed"); }
  };
  return (
    <div className="p-6 lg:p-10">
      <h1 className="font-display text-2xl md:text-3xl font-bold">Reports</h1>
      <div className="mt-6 space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-sm capitalize">{r.category.replace("_", " ")} — {r.target_type}</div>
                <div className="text-xs text-muted-foreground">Target: {r.target_id}</div>
                {r.description && <p className="text-sm mt-2">{r.description}</p>}
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-muted">{r.status}</span>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => set(r.id, "investigating")}>Investigate</Button>
              <Button size="sm" variant="outline" onClick={() => set(r.id, "dismissed")}>Dismiss</Button>
              <Button size="sm" onClick={() => set(r.id, "resolved")}>Resolve</Button>
            </div>
          </div>
        ))}
        {loading && <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">Loading...</div>}
        {!loading && rows.length === 0 && <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">No reports.</div>}
      </div>
    </div>
  );
}
