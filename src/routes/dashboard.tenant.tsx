import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { RequireAuth } from "@/components/auth/RequireAuth";
import {
  Bell,
  CalendarCheck,
  CreditCard,
  Heart,
  Home,
  MessageSquare,
  Search,
  Star,
  User,
} from "lucide-react";

// Every item must point at its own real child route — pointing several items
// at "/dashboard/tenant" (as the old version did) makes the sidebar itself
// impossible to navigate anywhere but Home.
const navItems = [
  { to: "/dashboard/tenant", label: "Home", icon: Home },
  { to: "/dashboard/tenant/feed", label: "Home feed", icon: Search },
  { to: "/dashboard/tenant/favorites", label: "Saved houses", icon: Heart },
  { to: "/dashboard/tenant/rent", label: "My rent", icon: CreditCard },
  { to: "/dashboard/tenant/notifications", label: "Notifications", icon: Bell },
  { to: "/dashboard/tenant/messages", label: "Messages", icon: MessageSquare },
  { to: "/dashboard/tenant/visits", label: "House visits", icon: CalendarCheck },
  { to: "/dashboard/tenant/reviews", label: "Your reviews", icon: Star },
  { to: "/dashboard/tenant/profile", label: "Profile", icon: User },
];

export const Route = createFileRoute("/dashboard/tenant")({
  head: () => ({ meta: [{ title: "Tenant Dashboard — GetKeja" }] }),
  component: () => (
    <RequireAuth requireRole="tenant">
      <div className="flex min-h-screen w-full bg-background">
        <DashboardSidebar title="Tenant" items={navItems} />
        <main className="flex-1 min-w-0 pt-14 md:pt-0">
          <Outlet />
        </main>
      </div>
    </RequireAuth>
  ),
});
