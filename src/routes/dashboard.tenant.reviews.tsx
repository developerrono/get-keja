import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Star, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { listMyReviews, deleteReview, type DbReview } from "@/lib/keja-api";

export const Route = createFileRoute("/dashboard/tenant/reviews")({ component: MyReviews });

function MyReviews() {
  const { user } = useAuth();
  const [items, setItems] = useState<DbReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const rows = await listMyReviews(user.id);
      setItems(rows);
    } catch {
      toast.error("Could not load your reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const remove = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteReview(id);
      toast.success("Review deleted");
      setItems((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast.error("Could not delete review.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-10 grid place-items-center py-24 text-sm text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading your reviews…
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10">
      <h1 className="font-display text-2xl md:text-3xl font-bold">Your reviews</h1>
      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">You haven't left any reviews yet.</div>
      ) : (
        <ul className="mt-6 space-y-3 max-w-2xl">
          {items.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{r.property_name ?? "Property"}</div>
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => remove(r.id)}
                  disabled={deletingId === r.id}
                  className="text-destructive shrink-0 ml-3"
                  aria-label="Delete review"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {r.body && <p className="text-sm mt-2 text-muted-foreground">{r.body}</p>}
              <div className="text-xs text-muted-foreground mt-2">{new Date(r.created_at).toLocaleDateString()}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
