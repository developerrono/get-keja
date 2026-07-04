import { createFileRoute, Outlet } from "@tanstack/react-router";
import { LandlordSidebar } from "@/components/dashboard/LandlordSidebar";
import { RequireAuth } from "@/components/auth/RequireAuth";

export const Route = createFileRoute("/dashboard/landlord")({
  head: () => ({ meta: [{ title: "Landlord Dashboard — GetKeja" }] }),
  component: () => (
    <RequireAuth requireRole="landlord">
      <div className="flex min-h-screen w-full bg-background">
        <LandlordSidebar />
        <main className="flex-1 min-w-0 pt-14 md:pt-0">
          <Outlet />
        </main>
      </div>
    </RequireAuth>
  ),
});
