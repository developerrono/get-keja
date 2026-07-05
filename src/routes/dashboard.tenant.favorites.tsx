import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PropertyCardDB } from "@/components/site/PropertyCardDB";
import { listFavorites, type DbProperty } from "@/lib/keja-api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/tenant/favorites")({ component: Favorites });

function Favorites() {
  const { user } = useAuth();
  const [items, setItems] = useState<DbProperty[]>([]);
  useEffect(() => {
    if (!user) return;
    listFavorites(user.id).then((f) => setItems(f.map((x) => x.properties as unknown as DbProperty).filter(Boolean)));
  }, [user]);

  return (
    <div className="p-6 lg:p-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Your favorites</h1>
          <p className="text-sm text-muted-foreground mt-1">{items.length} saved properties</p>
        </div>
        <Link to="/dashboard/tenant/compare"><Button variant="outline" className="rounded-full">Compare</Button></Link>
      </div>
      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          No favorites yet. Tap the heart on any listing to save it.
        </div>
      ) : (
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((p) => <PropertyCardDB key={p.id} property={p} initialSaved />)}
        </div>
      )}
    </div>
  );
}
