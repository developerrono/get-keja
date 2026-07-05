import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { DbReview } from "@/lib/keja-api";

export const Route = createFileRoute("/dashboard/tenant/reviews")({ component: MyReviews });

function MyReviews() {
  const { user } = useAuth();
  const [items, setItems] = useState<DbReview[]>([]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("reviews").select("*").eq("tenant_id", user.id).order("created_at", { ascending: false });
    setItems((data ?? []) as DbReview[]);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const remove = async (id: string) => {
    await supabase.from("reviews").delete().eq("id", id);
    toast.success("Review deleted"); load();
  };

  return (
    <div className="p-6 lg:p-10">
      <h1 className="font-display text-2xl md:text-3xl font-bold">Your reviews</h1>
      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">You haven't left any reviews yet.</div>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                  ))}
                </div>
                <button onClick={() => remove(r.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
              {r.body && <p className="text-sm mt-2">{r.body}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
