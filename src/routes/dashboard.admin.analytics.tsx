import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminStats } from "@/lib/keja-api";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/dashboard/admin/analytics")({ component: Analytics });

function Analytics() {
  const [s, setS] = useState<Awaited<ReturnType<typeof adminStats>> | null>(null);
  useEffect(() => { adminStats().then(setS); }, []);
  const data = s ? [
    { name: "Users", value: s.totalUsers },
    { name: "Landlords", value: s.totalLandlords },
    { name: "Verified", value: s.verifiedLandlords },
    { name: "Properties", value: s.totalProperties },
    { name: "Active", value: s.activeListings },
    { name: "Reports", value: s.openReports },
  ] : [];
  return (
    <div className="p-6 lg:p-10">
      <h1 className="font-display text-2xl md:text-3xl font-bold">Analytics</h1>
      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="text-sm font-semibold mb-4">Platform snapshot</div>
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="var(--primary)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
