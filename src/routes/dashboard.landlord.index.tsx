import { createFileRoute, Link } from "@tanstack/react-router";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  Building2,
  DoorOpen,
  DoorClosed,
  Eye,
  MessageSquare,
  CalendarCheck,
  Wallet,
  Layers,
  Plus,
  Bell,
  ArrowUpRight,
} from "lucide-react";
import { landlordProperties, totals, visitRequests, conversations } from "@/lib/landlord-data";
import { formatKsh } from "@/lib/properties";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/landlord/")({
  head: () => ({ meta: [{ title: "Overview — Landlord Dashboard" }] }),
  component: Overview,
});

function Overview() {
  const t = totals(landlordProperties);
  const activity = [
    { icon: CalendarCheck, tone: "accent", title: "New visit request", desc: "Amina Wanjiru • Green Heights A1", time: "12m ago" },
    { icon: MessageSquare, tone: "primary", title: "New message", desc: "Cynthia Mwikali asked about pets", time: "1h ago" },
    { icon: Building2, tone: "accent", title: "Property added", desc: "Karen Family Villas is now live", time: "3h ago" },
    { icon: Bell, tone: "primary", title: "New inquiry", desc: "Brian Otieno viewed Lavington Skyline", time: "Yesterday" },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl font-bold truncate">Welcome back, Landlord 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">Here's what's happening across your portfolio.</p>
        </div>
        <Link to={"/dashboard/landlord/add-property" as never}>
          <Button className="rounded-full gap-2 shrink-0">
            <Plus className="h-4 w-4" /> Add property
          </Button>
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total properties" value={String(t.properties)} delta="+1 this month" icon={Building2} />
        <StatCard label="Total units" value={String(t.units)} icon={Layers} />
        <StatCard label="Vacant units" value={String(t.vacant)} delta={`${Math.round((t.vacant / t.units) * 100)}% vacancy`} icon={DoorOpen} />
        <StatCard label="Occupied units" value={String(t.occupied)} delta={`${Math.round((t.occupied / t.units) * 100)}% occupancy`} icon={DoorClosed} />
        <StatCard label="Property views" value={t.views.toLocaleString()} delta="+18% WoW" icon={Eye} />
        <StatCard label="New inquiries" value={String(t.inquiries)} delta="+6 today" icon={MessageSquare} />
        <StatCard label="Scheduled visits" value={String(visitRequests.filter((v) => v.status === "accepted").length)} icon={CalendarCheck} />
        <StatCard label="Monthly income" value={formatKsh(t.income)} delta="+4.2% MoM" icon={Wallet} />
      </div>

      <div className="mt-10 grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 rounded-2xl border border-border bg-card">
          <div className="p-5 flex items-center justify-between border-b border-border">
            <h2 className="font-display font-bold">Recent activity</h2>
            <Link to={"/dashboard/landlord/visits" as never} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {activity.map((a, idx) => (
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
                  {c.avatarInitials}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold truncate">{c.name}</div>
                    <div className="text-[11px] text-muted-foreground shrink-0">{c.time}</div>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{c.lastMessage}</div>
                </div>
                {c.unread > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground">{c.unread}</span>
                )}
              </li>
            ))}
          </ul>
          <div className="p-3">
            <Link to={"/dashboard/landlord/messages" as never}>
              <Button variant="ghost" className="w-full text-sm">Open inbox</Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
