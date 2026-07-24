import { Link, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  Plus,
  Users,
  CalendarCheck,
  MessageSquare,
  BarChart3,
  Star,
  Wallet,
  Settings,
  Home,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const navItems = [
  { to: "/dashboard/landlord", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/landlord/properties", label: "My Properties", icon: Building2 },
  { to: "/dashboard/landlord/add-property", label: "Add Property", icon: Plus },
  { to: "/dashboard/landlord/tenants", label: "Tenants", icon: Users },
  { to: "/dashboard/landlord/visits", label: "Visit Requests", icon: CalendarCheck },
  { to: "/dashboard/landlord/messages", label: "Messages", icon: MessageSquare },
  { to: "/dashboard/landlord/transactions", label: "Transactions", icon: Wallet },
  { to: "/dashboard/landlord/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/landlord/reviews", label: "Reviews", icon: Star },
  { to: "/dashboard/landlord/settings", label: "Settings", icon: Settings },
];

export function LandlordSidebar() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-card h-screen sticky top-0">
      <div className="p-5 border-b border-border">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg">
          <span className="grid place-items-center h-9 w-9 rounded-xl gradient-primary text-primary-foreground shrink-0">
            <Home className="h-4 w-4" />
          </span>
          <span>Get<span className="text-accent">Keja</span></span>
        </Link>
      </div>

      <div className="px-5 pt-4 pb-1">
        <span className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground">Landlord</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to as never}
            activeOptions={{ exact: item.exact }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            activeProps={{ className: "!bg-primary !text-primary-foreground" }}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="rounded-xl bg-surface p-3">
          <div className="text-sm font-semibold truncate">{profile?.fullName ?? "Landlord"}</div>
          <div className="text-xs text-muted-foreground truncate">{profile?.email}</div>
          <button
            onClick={handleSignOut}
            className="mt-2 w-full flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
