import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  LayoutDashboard,
  Building2,
  Plus,
  Users,
  CalendarCheck,
  MessageSquare,
  BarChart3,
  Star,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

type NavItem = { to: string; label: string; icon: typeof Home; exact?: boolean };
const items: NavItem[] = [
  { to: "/dashboard/landlord", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/landlord/properties", label: "My Properties", icon: Building2 },
  { to: "/dashboard/landlord/add-property", label: "Add Property", icon: Plus },
  { to: "/dashboard/landlord/tenants", label: "Tenants", icon: Users },
  { to: "/dashboard/landlord/visits", label: "Visit Requests", icon: CalendarCheck },
  { to: "/dashboard/landlord/messages", label: "Messages", icon: MessageSquare },
  { to: "/dashboard/landlord/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/landlord/reviews", label: "Reviews", icon: Star },
  { to: "/dashboard/landlord/settings", label: "Settings", icon: Settings },
];

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { signOut, profile } = useAuth();

  return (
    <div className="flex h-full flex-col">
      <Link
        to="/"
        className="flex items-center gap-2 font-display font-bold px-6 h-16 border-b border-sidebar-border shrink-0"
        onClick={onNavigate}
      >
        <span className="grid place-items-center h-8 w-8 rounded-lg gradient-primary text-primary-foreground shrink-0">
          <Home className="h-4 w-4" />
        </span>
        <span>
          Get<span className="text-accent">Keja</span>
        </span>
      </Link>
      <div className="px-3 pt-5 pb-2 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
        Landlord
      </div>
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {items.map((i) => {
          const active = i.exact ? pathname === i.to : pathname === i.to || pathname.startsWith(i.to + "/");
          return (
          <Link
            key={i.to}
            to={i.to as never}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              active
                ? "bg-primary text-primary-foreground shadow-soft"
                : "text-sidebar-foreground hover:bg-sidebar-accent"
            }`}
          >
            <i.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{i.label}</span>
          </Link>
          );
        })}
      </nav>
      <div className="m-3 p-4 rounded-2xl bg-primary-soft">
        <div className="text-xs font-semibold truncate">{profile?.full_name || "Landlord"}</div>
        <p className="text-xs text-muted-foreground mt-1 truncate">{profile?.email}</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut()}
          className="mt-3 w-full justify-start gap-2 h-8 px-2"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </Button>
      </div>
    </div>
  );
}

export function LandlordSidebar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Desktop */}
      <aside className="w-64 shrink-0 border-r border-sidebar-border bg-sidebar min-h-screen sticky top-0 hidden md:flex flex-col">
        <NavContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 h-14 border-b border-border bg-background/90 backdrop-blur flex items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display font-bold">
          <span className="grid place-items-center h-7 w-7 rounded-lg gradient-primary text-primary-foreground">
            <Home className="h-3.5 w-3.5" />
          </span>
          Get<span className="text-accent">Keja</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-sidebar shadow-card">
            <div className="flex justify-end p-2">
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <NavContent onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
