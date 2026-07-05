import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, CalendarCheck, Heart, MessageSquare, Search } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { PropertyCardDB } from "@/components/site/PropertyCardDB";
import { OnboardingCard } from "@/components/tenant/OnboardingCard";
import { useAuth } from "@/hooks/use-auth";
import { fetchProperties, listFavorites, listVisits, listNotifications, type DbProperty } from "@/lib/keja-api";

export const Route = createFileRoute("/dashboard/tenant/")({
  component: TenantHome,
});

function TenantHome() {
  const { user, profile } = useAuth();
  const [recs, setRecs] = useState<DbProperty[]>([]);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [counts, setCounts] = useState({ saved: 0, visits: 0, msgs: 0, notifs: 0 });

  useEffect(() => {
    if (!user) return;
    fetchProperties({ limit: 6, sort: "newest" }).then((r) => setRecs(r.rows));
    listFavorites(user.id).then((f) => { setFavIds(new Set(f.map((x) => x.property_id))); setCounts((c) => ({ ...c, saved: f.length })); });
    listVisits(user.id).then((v) => setCounts((c) => ({ ...c, visits: v.length })));
    listNotifications(user.id).then((n) => setCounts((c) => ({ ...c, notifs: n.filter((x) => !x.read).length })));
  }, [user]);

  return (
    <div className="p-6 lg:p-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Welcome back, {profile?.full_name?.split(" ")[0] ?? "friend"} 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">Here's what's happening with your hunt.</p>
        </div>
        <Link to="/dashboard/tenant/search" className="inline-flex items-center gap-2 px-4 h-10 rounded-full border border-border bg-card text-sm hover:bg-muted">
          <Search className="h-4 w-4" /> Advanced search
        </Link>
      </div>

      <div className="mt-8">
        <OnboardingCard />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Saved properties" value={String(counts.saved)} icon={Heart} />
        <StatCard label="Scheduled visits" value={String(counts.visits)} icon={CalendarCheck} />
        <StatCard label="Unread messages" value={String(counts.msgs)} icon={MessageSquare} />
        <StatCard label="New notifications" value={String(counts.notifs)} icon={Bell} />
      </div>

      <section className="mt-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-bold">Recommended for you</h2>
          <Link to="/dashboard/tenant/feed" className="text-sm font-semibold text-accent">View all</Link>
        </div>
        {recs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            No listings yet — check back soon or explore the feed.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recs.map((p) => <PropertyCardDB key={p.id} property={p} initialSaved={favIds.has(p.id)} />)}
          </div>
        )}
      </section>
    </div>
  );
}
