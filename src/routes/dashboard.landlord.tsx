import { createFileRoute } from "@tanstack/react-router";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { StatCard } from "@/components/dashboard/StatCard";
import { properties, formatKsh } from "@/lib/properties";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Building2,
  CalendarCheck,
  Eye,
  Heart,
  MessageSquare,
  Plus,
  User,
} from "lucide-react";

const navItems = [
  { to: "/dashboard/landlord", label: "My properties", icon: Building2 },
  { to: "/dashboard/landlord", label: "Add property", icon: Plus },
  { to: "/dashboard/landlord", label: "Messages", icon: MessageSquare },
  { to: "/dashboard/landlord", label: "Bookings", icon: CalendarCheck },
  { to: "/dashboard/landlord", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/landlord", label: "Profile", icon: User },
];

export const Route = createFileRoute("/dashboard/landlord")({
  head: () => ({ meta: [{ title: "Landlord Dashboard — GetKeja" }] }),
  component: LandlordDashboard,
});

function LandlordDashboard() {
  return (
    <div className="flex min-h-screen w-full">
      <DashboardSidebar title="Landlord" items={navItems} />
      <main className="flex-1 p-6 lg:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Your portfolio</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage properties, tenants and bookings.</p>
          </div>
          <Button className="rounded-full gap-2"><Plus className="h-4 w-4" />Add property</Button>
        </div>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total properties" value="14" delta="+2 this month" icon={Building2} />
          <StatCard label="Profile views" value="2,418" delta="+18% WoW" icon={Eye} />
          <StatCard label="Saves" value="389" icon={Heart} />
          <StatCard label="Inquiries" value="56" delta="+12 new" icon={MessageSquare} />
        </div>

        <section className="mt-12 rounded-2xl border border-border bg-card overflow-hidden">
          <div className="p-6 flex items-center justify-between border-b border-border">
            <h2 className="font-display font-bold">My properties</h2>
            <span className="text-xs text-muted-foreground">{properties.length} listings</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold">Property</th>
                  <th className="text-left px-6 py-3 font-semibold">Location</th>
                  <th className="text-left px-6 py-3 font-semibold">Rent</th>
                  <th className="text-left px-6 py-3 font-semibold">Status</th>
                  <th className="text-left px-6 py-3 font-semibold">Views</th>
                  <th className="text-right px-6 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {properties.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={p.image} alt="" className="h-10 w-10 rounded-lg object-cover" loading="lazy" />
                        <div>
                          <div className="font-semibold">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{p.location}</td>
                    <td className="px-6 py-4 font-semibold">{formatKsh(p.price)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        p.available ? "bg-accent-soft text-accent" : "bg-muted text-muted-foreground"
                      }`}>
                        {p.available ? "Vacant" : "Occupied"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{Math.floor(Math.random() * 400) + 80}</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm">Manage</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
