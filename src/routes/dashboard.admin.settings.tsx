import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/admin/settings")({ component: AdminSettings });

function AdminSettings() {
  return (
    <div className="p-6 lg:p-10 max-w-3xl">
      <h1 className="font-display text-2xl md:text-3xl font-bold">Platform settings</h1>
      <p className="text-sm text-muted-foreground mt-1">Configure platform-wide preferences.</p>
      <div className="mt-6 grid gap-4">
        {[
          { t: "Platform configuration", d: "General branding, contact details, currency." },
          { t: "Email templates", d: "Auth, transactional, marketing." },
          { t: "Notification settings", d: "Channels, quiet hours, defaults." },
          { t: "User roles & permissions", d: "Admin, landlord, verified landlord, tenant." },
          { t: "Security settings", d: "Password policy, session limits, HIBP." },
          { t: "Audit logs", d: "Chronological trail of admin actions." },
        ].map((s) => (
          <div key={s.t} className="rounded-2xl border border-border bg-card p-5">
            <div className="font-semibold">{s.t}</div>
            <p className="text-sm text-muted-foreground mt-1">{s.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
