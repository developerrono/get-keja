import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { RequireAuth } from "@/components/auth/RequireAuth";

export const Route = createFileRoute("/dashboard/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — GetKeja" }] }),
  component: () => (
    <RequireAuth>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar />
        <main className="flex-1 min-w-0 pt-14 md:pt-0">
          <Outlet />
        </main>
      </div>
    </RequireAuth>
  ),
});
