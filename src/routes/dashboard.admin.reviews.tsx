import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminListReviews, adminUpdateReviewStatus, type DbReview } from "@/lib/keja-api";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/admin/reviews")({ component: RevMod });

function RevMod() {
  const [rows, setRows] = useState<DbReview[]>([]);
  const load = () => adminListReviews().then(setRows);
  useEffect(() => { load(); }, []);
  const set = async (id: string, s: "active" | "hidden" | "deleted") => {
    try { await adminUpdateReviewStatus(id, s); toast.success("Updated"); load(); } catch { toast.error("Failed"); }
  };
  return (
    <div className="p-6 lg:p-10">
      <h1 className="font-display text-2xl md:text-3xl font-bold">Review moderation</h1>
      <div className="mt-6 space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-accent text-accent" : "text-muted-foreground"}`} />)}
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-muted">{r.status}</span>
            </div>
            {r.body && <p className="text-sm mt-2">{r.body}</p>}
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => set(r.id, "active")}>Restore</Button>
              <Button size="sm" variant="outline" onClick={() => set(r.id, "hidden")}>Hide</Button>
              <Button size="sm" variant="outline" onClick={() => set(r.id, "deleted")}>Delete</Button>
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">No reviews.</div>}
      </div>
    </div>
  );
}
