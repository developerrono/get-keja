import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  Building2,
  DoorOpen,
  DoorClosed,
  Eye,
  MessageSquare,
  CalendarCheck,
  Layers,
  Plus,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import {
  fetchProperties,
  listVisitsForLandlord,
  listConversations,
  type DbProperty,
} from "@/lib/keja-api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/landlord/")({
  head: () => ({ meta: [{ title: "Overview — Landlord Dashboard" }] }),
  component: Overview,
});

type VisitRow = { id: string; tenant_name?: string; property_name?: string; status: string; scheduled_at: string };
type ConversationRow = { id: string; name?: string; tenant_name?: string; landlord_name?: string; last_message_at: string };

function Overview() {
  const { profile } = useAuth();
  const [properties, setProperties] = useState<DbProperty[]>([]);
  const [visits, setVisits] = useState<VisitRow[]>([]);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    setLoading(true);
    Promise.all([
      fetchProperties({ landlord_id: profile.id, status: "all", limit: 100 }),
      listVisitsForLandlord(profile.id).catch(() => []),
      listConversations(profile.id).catch(() => []),
    ])
      .then(([propsRes, visitsRes, convosRes]) => {
        setProperties(propsRes.rows);
        setVisits((visitsRes ?? []) as VisitRow[]);
        setConversations((convosRes ?? []) as ConversationRow[]);
      })
      .finally(() => setLoading(false));
  }, [profile?.id]);

  const totalUnits = properties.reduce((s, p) => s + (p.units_count ?? 0), 0);
  const vacantUnits = properties.reduce((s, p) => s + (p.vacant_count ?? 0), 0);
  const occupiedUnits = totalUnits - vacantUnits;
  const totalViews = properties.reduce((s, p) => s + (p.views_count ?? 0), 0);
  const scheduledVisits = visits.filter((v) => v.status === "approved").length;

  const recentActivity = [
    ...visits.slice(0, 3).map((v) => ({
      icon: CalendarCheck,
      tone: "accent" as const,
      title: v.status === "pending" ? "New visit request" : `Visit ${v.status}`,
      desc: `${v.tenant_name ?? "A tenant"} • ${v.property_name ?? ""}`,
      time: new Date(v.scheduled_at).toLocaleDateString(),
    })),
    ...conversations.slice(0, 3).map((c) => ({
      icon: MessageSquare,
      tone: "primary" as const,
      title: "Conversation",
      desc: c.tenant_name ?? c.name ?? "Tenant",
      time: new Date(c.last_message_at).toLocaleDateString(),
    })),
  ].slice(0, 4);

  if (loading) {
    return (
      <div className="p-6 lg:p-10 max-w-7xl mx-auto grid place-items-center py-24 text-sm text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading your dashboard…
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl font-bold truncate">
            Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Here's what's happening across your portfolio.</p>
        </div>
        <Link to={"/dashboard/landlord/add-property" as never}>
          <Button className="rounded-full gap-2 shrink-0">
            <Plus className="h-4 w-4" /> Add property
          </Button>
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">You haven't added any properties yet — your stats will show up here once you do.</p>
          <Link to={"/dashboard/landlord/add-property" as never}>
            <Button className="mt-4 rounded-full">Add your first property</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total properties" value={String(properties.length)} icon={Building2} />
            <StatCard label="Total units" value={String(totalUnits)} icon={Layers} />
            <StatCard
              label="Vacant units"
              value={String(vacantUnits)}
              delta={totalUnits ? `${Math.round((vacantUnits / totalUnits) * 100)}% vacancy` : undefined}
              icon={DoorOpen}
            />
            <StatCard
              label="Occupied units"
              value={String(occupiedUnits)}
              delta={totalUnits ? `${Math.round((occupiedUnits / totalUnits) * 100)}% occupancy` : undefined}
              icon={DoorClosed}
            />
            <StatCard label="Property views" value={totalViews.toLocaleString()} icon={Eye} />
            <StatCard label="Scheduled visits" value={String(scheduledVisits)} icon={CalendarCheck} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Monthly income and inquiry counts aren't tracked yet — those need a tenancy/lease table and historical event logging that don't exist in the schema yet.
          </p>

          <div className="mt-10 grid lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2 rounded-2xl border border-border bg-card">
              <div className="p-5 flex items-center justify-between border-b border-border">
                <h2 className="font-display font-bold">Recent activity</h2>
                <Link to={"/dashboard/landlord/visits" as never} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                  View all <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              <ul className="divide-y divide-border">
                {recentActivity.length === 0 && (
                  <li className="p-6 text-sm text-muted-foreground text-center">No activity yet.</li>
                )}
                {recentActivity.map((a, idx) => (
                  <li key={idx} className="p-4 flex items-start gap-3">
                    <span className={`grid place-items-center h-9 w-9 rounded-xl shrink-0 ${a.tone === "accent" ? "bg-accent-soft text-accent" : "bg-primary-soft text-primary"}`}>
                      <a.icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold truncate">{a.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{a.desc}</div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{a.time}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-border bg-card">
              <div className="p-5 border-b border-border">
                <h2 className="font-display font-bold">Recent messages</h2>
              </div>
              <ul className="divide-y divide-border">
                {conversations.slice(0, 4).map((c) => (
                  <li key={c.id} className="p-4 flex items-center gap-3">
                    <span className="grid place-items-center h-10 w-10 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                      {(c.tenant_name ?? c.name ?? "?").split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold truncate">{c.tenant_name ?? c.name}</div>
                        <div className="text-[11px] text-muted-foreground shrink-0">{new Date(c.last_message_at).toLocaleString()}</div>
                      </div>
                    </div>
                  </li>
                ))}
                {conversations.length === 0 && (
                  <li className="p-6 text-sm text-muted-foreground text-center">No conversations yet.</li>
                )}
              </ul>
              <div className="p-3">
                <Link to={"/dashboard/landlord/messages" as never}>
                  <Button variant="ghost" className="w-full text-sm">Open inbox</Button>
                </Link>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}