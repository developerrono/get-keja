import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Eye, Building2, CalendarCheck, MessageSquare, Loader2 } from "lucide-react";
import { fetchProperties, listVisitsForLandlord, listConversations, type DbProperty } from "@/lib/keja-api";
import { useAuth } from "@/hooks/use-auth";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from "recharts";

export const Route = createFileRoute("/dashboard/landlord/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Landlord" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { profile } = useAuth();
  const [properties, setProperties] = useState<DbProperty[]>([]);
  const [visitCount, setVisitCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    Promise.all([
      fetchProperties({ landlord_id: profile.id, status: "all", limit: 100 }),
      listVisitsForLandlord(profile.id).catch(() => []),
      listConversations(profile.id).catch(() => []),
    ])
      .then(([propsRes, visits, convos]) => {
        setProperties(propsRes.rows);
        setVisitCount((visits as any[]).length);
        setMessageCount((convos as any[]).length);
      })
      .finally(() => setLoading(false));
  }, [profile?.id]);

  const totalViews = properties.reduce((s, p) => s + (p.views_count ?? 0), 0);
  const totalUnits = properties.reduce((s, p) => s + (p.units_count ?? 0), 0);
  const vacantUnits = properties.reduce((s, p) => s + (p.vacant_count ?? 0), 0);
  const occupiedUnits = totalUnits - vacantUnits;

  const pie = [
    { name: "Occupied", value: occupiedUnits, color: "oklch(0.36 0.13 258)" },
    { name: "Vacant", value: vacantUnits, color: "oklch(0.65 0.17 158)" },
  ];

  if (loading) {
    return (
      <div className="p-6 lg:p-10 max-w-7xl mx-auto grid place-items-center py-24 text-sm text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading analytics…
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <header>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your portfolio performance.</p>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total views" value={totalViews.toLocaleString()} icon={Eye} />
        <StatCard label="Properties" value={String(properties.length)} icon={Building2} />
        <StatCard label="Visit requests" value={String(visitCount)} icon={CalendarCheck} />
        <StatCard label="Conversations" value={String(messageCount)} icon={MessageSquare} />
      </div>

      <div className="mt-6 grid lg:grid-cols-3 gap-6">
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display font-bold">Occupancy</h2>
          {totalUnits === 0 ? (
            <div className="mt-4 py-12 text-center text-sm text-muted-foreground">No units yet.</div>
          ) : (
            <>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pie} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={4}>
                      {pie.map((p, i) => <Cell key={i} fill={p.color} />)}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2 text-center">
                <div>
                  <div className="text-xs text-muted-foreground">Occupancy</div>
                  <div className="font-bold text-primary">{Math.round((occupiedUnits / totalUnits) * 100)}%</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Vacancy</div>
                  <div className="font-bold text-accent">{Math.round((vacantUnits / totalUnits) * 100)}%</div>
                </div>
              </div>
            </>
          )}
        </section>

        <section className="lg:col-span-2 rounded-2xl border border-dashed border-border bg-card p-6 flex flex-col items-center justify-center text-center">
          <h2 className="font-display font-bold">Views & saves over time</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            Historical trends aren't tracked yet — that needs a table logging daily views/saves/visits/messages,
            which doesn't exist in the schema yet. The stat cards above show real current totals.
          </p>
        </section>
      </div>
    </div>
  );
}
