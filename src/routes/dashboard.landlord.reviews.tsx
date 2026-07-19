import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listReviewsForLandlord, replyToReview, type DbReview } from "@/lib/keja-api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/landlord/reviews")({
  head: () => ({ meta: [{ title: "Reviews — Landlord" }] }),
  component: ReviewsPage,
});

function ReviewsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<DbReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [replyingId, setReplyingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    listReviewsForLandlord(user.id)
      .then(setItems)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load reviews."))
      .finally(() => setLoading(false));
  }, [user]);

  const avg = items.length ? items.reduce((s, r) => s + r.rating, 0) / items.length : 0;

  const reply = async (id: string) => {
    const text = drafts[id]?.trim();
    if (!text || !user) return;
    setReplyingId(id);
    try {
      await replyToReview(id, user.id, text);
      setItems((prev) =>
        prev.map((r) => (r.id === id ? { ...r, landlord_reply: text, replied_at: new Date().toISOString() } : r)),
      );
      setDrafts((d) => ({ ...d, [id]: "" }));
      toast.success("Reply posted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post reply.");
    } finally {
      setReplyingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-10 max-w-4xl mx-auto grid place-items-center py-24 text-sm text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading reviews…
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <header>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Reviews</h1>
        <p className="text-sm text-muted-foreground mt-1">What tenants are saying about your properties.</p>
      </header>

      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No reviews yet.
        </div>
      ) : (
        <>
          <section className="mt-6 rounded-2xl border border-border bg-card p-6 flex flex-wrap items-center gap-6">
            <div>
              <div className="text-4xl font-display font-black">{avg.toFixed(1)}</div>
              <div className="flex text-accent">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.round(avg) ? "fill-current" : ""}`} />
                ))}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{items.length} reviews</div>
            </div>
            <div className="flex-1 min-w-[200px] space-y-1.5">
              {[5, 4, 3, 2, 1].map((n) => {
                const count = items.filter((r) => r.rating === n).length;
                const pct = (count / items.length) * 100;
                return (
                  <div key={n} className="flex items-center gap-2 text-xs">
                    <span className="w-3">{n}</span>
                    <Star className="h-3 w-3 text-accent fill-current" />
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="mt-6 space-y-4">
            {items.map((r) => (
              <article key={r.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="grid place-items-center h-10 w-10 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                      {(r.tenant_name ?? "?").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{r.tenant_name ?? "Tenant"}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {r.property_name} • {new Date(r.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex text-accent shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-current" : ""}`} />
                    ))}
                  </div>
                </div>
                {r.body && <p className="mt-3 text-sm">{r.body}</p>}

                {r.landlord_reply ? (
                  <div className="mt-3 rounded-xl bg-primary-soft p-3">
                    <div className="text-[11px] font-bold uppercase text-primary">Your reply</div>
                    <p className="text-sm mt-1">{r.landlord_reply}</p>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      rows={2}
                      value={drafts[r.id] ?? ""}
                      onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                      placeholder="Reply to this review…"
                    />
                    <div className="flex justify-end">
                      <Button size="sm" disabled={replyingId === r.id} onClick={() => reply(r.id)}>
                        {replyingId === r.id ? "Posting…" : "Post reply"}
                      </Button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
