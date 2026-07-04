import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Eye, Heart, CalendarCheck, MessageSquare } from "lucide-react";
import { landlordProperties, totals } from "@/lib/landlord-data";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export const Route = createFileRoute("/dashboard/landlord/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Landlord" }] }),
  component: AnalyticsPage,
});

const seriesByRange = {
  weekly: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => ({
    label: d,
    views: 120 + i * 30 + Math.round(Math.random() * 40),
    saves: 20 + i * 5,
    visits: 4 + i,
    messages: 6 + i * 2,
  })),
  monthly: Array.from({ length: 12 }, (_, i) => ({
    label: new Date(2026, i, 1).toLocaleString("en", { month: "short" }),
    views: 800 + i * 90 + Math.round(Math.random() * 200),
    saves: 100 + i * 15,
    visits: 20 + i * 3,
    messages: 40 + i * 6,
  })),
  yearly: Array.from({ length: 5 }, (_, i) => ({
    label: `${2022 + i}`,
    views: 8000 + i * 2500,
    saves: 1200 + i * 400,
    visits: 250 + i * 60,
    messages: 500 + i * 120,
  })),
};

function AnalyticsPage() {
  const [range, setRange] = useState<"weekly" | "monthly" | "yearly">("monthly");
  const t = totals(landlordProperties);
  const data = seriesByRange[range];

  const pie = [
    { name: "Occupied", value: t.occupied, color: "oklch(0.36 0.13 258)" },
    { name: "Vacant", value: t.vacant, color: "oklch(0.65 0.17 158)" },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your portfolio performance.</p>
        </div>
        <div className="flex gap-1 rounded-full bg-muted p-1">
          {(["weekly", "monthly", "yearly"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                range === r ? "bg-card shadow-soft text-foreground" : "text-muted-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total views" value={t.views.toLocaleString()} delta="+18% WoW" icon={Eye} />
        <StatCard label="Saved listings" value="389" delta="+22 this week" icon={Heart} />
        <StatCard label="Visit requests" value="56" delta="+8 this week" icon={CalendarCheck} />
        <StatCard label="Messages" value="128" delta="+34 this week" icon={MessageSquare} />
      </div>

      <div className="mt-6 grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display font-bold">Views & saves</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="v" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.36 0.13 258)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.36 0.13 258)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.65 0.17 158)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.65 0.17 158)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="label" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="views" stroke="oklch(0.36 0.13 258)" fill="url(#v)" strokeWidth={2} />
                <Area type="monotone" dataKey="saves" stroke="oklch(0.65 0.17 158)" fill="url(#s)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display font-bold">Occupancy</h2>
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
              <div className="font-bold text-primary">{Math.round((t.occupied / t.units) * 100)}%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Vacancy</div>
              <div className="font-bold text-accent">{Math.round((t.vacant / t.units) * 100)}%</div>
            </div>
          </div>
        </section>

        <section className="lg:col-span-3 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display font-bold">Visits & messages</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="label" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="visits" fill="oklch(0.36 0.13 258)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="messages" fill="oklch(0.65 0.17 158)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
