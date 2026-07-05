import { createFileRoute, Outlet } from "@tanstack/react-router";
import { TenantSidebar } from "@/components/dashboard/TenantSidebar";
import { RequireAuth } from "@/components/auth/RequireAuth";

export const Route = createFileRoute("/dashboard/tenant")({
  head: () => ({ meta: [{ title: "Tenant Dashboard — GetKeja" }] }),
  component: () => (
    <RequireAuth requireRole="tenant">
      <div className="flex min-h-screen w-full bg-background">
        <TenantSidebar />
        <main className="flex-1 min-w-0 pt-14 md:pt-0">
          <Outlet />
        </main>
      </div>
    </RequireAuth>
  ),
});
