import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listFavorites, formatKsh, type DbProperty } from "@/lib/keja-api";
import { useAuth } from "@/hooks/use-auth";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/dashboard/tenant/compare")({ component: Compare });

function Compare() {
  const { user } = useAuth();
  const [items, setItems] = useState<DbProperty[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    listFavorites(user.id).then((props) => {
      setItems(props);
      setPicked(new Set(props.slice(0, 3).map((p) => p.id)));
    });
  }, [user]);

  const chosen = items.filter((p) => picked.has(p.id));
  const toggle = (id: string) => setPicked((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="p-6 lg:p-10">
      <h1 className="font-display text-2xl md:text-3xl font-bold">Compare properties</h1>
      <p className="text-sm text-muted-foreground mt-1">Select up to 4 favorites to compare side-by-side.</p>

      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">Save some favorites first.</div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-2">
            {items.map((p) => (
              <label key={p.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card text-xs cursor-pointer">
                <Checkbox checked={picked.has(p.id)} onCheckedChange={() => toggle(p.id)} /> {p.name}
              </label>
            ))}
          </div>
          {chosen.length > 0 && (
            <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted"><tr>
                  <th className="p-3 text-left">Feature</th>
                  {chosen.map((p) => <th key={p.id} className="p-3 text-left">{p.name}</th>)}
                </tr></thead>
                <tbody className="[&_td]:p-3 [&_tr]:border-t [&_tr]:border-border">
                  <tr><td>Rent</td>{chosen.map((p) => <td key={p.id}>{formatKsh(p.monthly_rent)}</td>)}</tr>
                  <tr><td>Type</td>{chosen.map((p) => <td key={p.id}>{p.house_type}</td>)}</tr>
                  <tr><td>Location</td>{chosen.map((p) => <td key={p.id}>{[p.estate, p.county].filter(Boolean).join(", ")}</td>)}</tr>
                  <tr><td>Bedrooms</td>{chosen.map((p) => <td key={p.id}>{p.bedrooms}</td>)}</tr>
                  <tr><td>Bathrooms</td>{chosen.map((p) => <td key={p.id}>{p.bathrooms}</td>)}</tr>
                  <tr><td>Amenities</td>{chosen.map((p) => <td key={p.id}>{(p.amenities ?? []).join(", ") || "—"}</td>)}</tr>
                  <tr><td>Rating</td>{chosen.map((p) => <td key={p.id}>{Number(p.average_rating).toFixed(1)} ★</td>)}</tr>
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
