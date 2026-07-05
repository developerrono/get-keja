import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutGrid, List as ListIcon } from "lucide-react";
import { PropertyCardDB } from "@/components/site/PropertyCardDB";
import { fetchProperties, listFavorites, type DbProperty } from "@/lib/keja-api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/dashboard/tenant/feed")({ component: Feed });

function Feed() {
  const { user } = useAuth();
  const [rows, setRows] = useState<DbProperty[]>([]);
  const [offset, setOffset] = useState(0);
  const [count, setCount] = useState(0);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(false);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const pageSize = 12;

  useEffect(() => { if (user) listFavorites(user.id).then((f) => setFavIds(new Set(f.map((x) => x.property_id)))); }, [user]);

  const load = async (from = 0) => {
    setLoading(true);
    const r = await fetchProperties({ limit: pageSize, offset: from, sort: "newest" });
    setRows(from === 0 ? r.rows : [...rows, ...r.rows]);
    setCount(r.count); setOffset(from + r.rows.length);
    setLoading(false);
  };
  useEffect(() => { load(0); /* eslint-disable-next-line */ }, []);

  return (
    <div className="p-6 lg:p-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Home feed</h1>
          <p className="text-sm text-muted-foreground mt-1">{count} homes available</p>
        </div>
        <div className="inline-flex rounded-full border border-border p-1 bg-card">
          <button onClick={() => setView("grid")} className={`h-8 w-8 grid place-items-center rounded-full ${view === "grid" ? "bg-primary text-primary-foreground" : ""}`}><LayoutGrid className="h-4 w-4" /></button>
          <button onClick={() => setView("list")} className={`h-8 w-8 grid place-items-center rounded-full ${view === "list" ? "bg-primary text-primary-foreground" : ""}`}><ListIcon className="h-4 w-4" /></button>
        </div>
      </div>
      {rows.length === 0 && !loading ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">No listings yet.</div>
      ) : (
        <div className={view === "grid" ? "mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5" : "mt-8 space-y-4"}>
          {rows.map((p) => <PropertyCardDB key={p.id} property={p} initialSaved={favIds.has(p.id)} view={view} />)}
        </div>
      )}
      {offset < count && (
        <div className="mt-8 text-center">
          <Button onClick={() => load(offset)} disabled={loading} variant="outline" className="rounded-full">
            {loading ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
