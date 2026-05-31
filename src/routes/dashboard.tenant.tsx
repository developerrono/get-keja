import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { StatCard } from "@/components/dashboard/StatCard";
import { PropertyCard } from "@/components/site/PropertyCard";
import { properties } from "@/lib/properties";
import {
  Bell,
  CalendarCheck,
  Heart,
  Home,
  MessageSquare,
  Search,
  User,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAuth } from "@/hooks/use-auth";

const navItems = [
  { to: "/dashboard/tenant", label: "Home", icon: Home },
  { to: "/listings", label: "Saved houses", icon: Heart },
  { to: "/dashboard/tenant", label: "Notifications", icon: Bell },
  { to: "/dashboard/tenant", label: "Messages", icon: MessageSquare },
  { to: "/dashboard/tenant", label: "House visits", icon: CalendarCheck },
  { to: "/dashboard/tenant", label: "Profile", icon: User },
];

export const Route = createFileRoute("/dashboard/tenant")({
  head: () => ({ meta: [{ title: "Tenant Dashboard — GetKeja" }] }),
  component: () => (
    <RequireAuth requireRole="tenant">
      <TenantDashboard />
    </RequireAuth>
  ),
});

function TenantDashboard() {
  return (
    <div className="flex min-h-screen w-full">
      <DashboardSidebar title="Tenant" items={navItems} />
      <main className="flex-1 p-6 lg:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">
              Welcome back, {useAuth().profile?.full_name?.split(" ")[0] ?? "friend"} 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Here's what's happening with your hunt.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search homes..." className="pl-9 rounded-full h-10 w-72" />
          </div>
        </div>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Saved homes" value="12" delta="+3 this week" icon={Heart} />
          <StatCard label="Scheduled visits" value="2" icon={CalendarCheck} />
          <StatCard label="Unread messages" value="5" icon={MessageSquare} />
          <StatCard label="New notifications" value="8" icon={Bell} />
        </div>

        <section className="mt-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-bold">Recommended for you</h2>
            <Link to="/listings" className="text-sm font-semibold text-accent">View all</Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {properties.slice(0, 3).map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </section>

        <section className="mt-12 grid lg:grid-cols-[1fr_380px] gap-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display font-bold">Upcoming visits</h3>
            <ul className="mt-4 divide-y divide-border">
              {properties.slice(0, 2).map((p) => (
                <li key={p.id} className="flex items-center gap-4 py-4">
                  <img src={p.image} alt="" className="h-14 w-14 rounded-xl object-cover" loading="lazy" />
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.location}</div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-semibold">Sat 10:30 AM</div>
                    <div className="text-accent">Confirmed</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display font-bold">Notifications</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                "Your visit to Westview was confirmed.",
                "3 new listings match your filters.",
                "James Kariuki sent you a message.",
              ].map((n, i) => (
                <li key={i} className="flex gap-3 p-3 rounded-xl hover:bg-muted">
                  <span className="h-2 w-2 mt-2 rounded-full bg-accent" />
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
