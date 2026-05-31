import { createFileRoute } from "@tanstack/react-router";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  ShieldCheck,
  Users,
  Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequireAuth } from "@/components/auth/RequireAuth";

const navItems = [
  { to: "/dashboard/admin", label: "Overview", icon: BarChart3 },
  { to: "/dashboard/admin", label: "Users", icon: Users },
  { to: "/dashboard/admin", label: "Landlords", icon: Building2 },
  { to: "/dashboard/admin", label: "Verifications", icon: ShieldCheck },
  { to: "/dashboard/admin", label: "Reports", icon: Flag },
];

export const Route = createFileRoute("/dashboard/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — GetKeja" }] }),
  component: () => (
    <RequireAuth requireRole="admin">
      <AdminDashboard />
    </RequireAuth>
  ),
});

function AdminDashboard() {
  return (
    <div className="flex min-h-screen w-full">
      <DashboardSidebar title="Admin" items={navItems} />
      <main className="flex-1 p-6 lg:p-10">
        <h1 className="font-display text-3xl font-bold">Platform overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitor users, listings and reports across GetKeja.</p>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total users" value="14,238" delta="+412 this week" icon={Users} />
          <StatCard label="Active listings" value="3,820" icon={Building2} />
          <StatCard label="Pending verifications" value="27" icon={ShieldCheck} />
          <StatCard label="Open reports" value="9" icon={AlertTriangle} />
        </div>

        <div className="mt-10 grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display font-bold">Landlords awaiting verification</h2>
            <ul className="mt-4 divide-y divide-border">
              {["Mary Achieng", "Peter Otieno", "Faith Nyambura", "David Kimani"].map((n) => (
                <li key={n} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full gradient-primary grid place-items-center text-primary-foreground text-xs font-bold">
                      {n[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{n}</div>
                      <div className="text-xs text-muted-foreground">Submitted 2 days ago</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Reject</Button>
                    <Button size="sm">Verify</Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display font-bold">Recent reports</h2>
            <ul className="mt-4 space-y-3">
              {[
                { t: "Fake listing on Riverside Studio", s: "High" },
                { t: "Spam messages from user @joe", s: "Medium" },
                { t: "Pricing mismatch — Karen Family Home", s: "Low" },
              ].map((r) => (
                <li key={r.t} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted">
                  <div className="flex items-center gap-3">
                    <Flag className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium">{r.t}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    r.s === "High" ? "bg-destructive/10 text-destructive" :
                    r.s === "Medium" ? "bg-accent-soft text-accent" : "bg-muted text-muted-foreground"
                  }`}>
                    {r.s}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
