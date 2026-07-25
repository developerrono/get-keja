import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Home, Menu, X, HelpCircle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { ReportDialog } from "@/components/site/ReportDialog";

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };

export function DashboardSidebar({ title, items }: { title: string; items: NavItem[] }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const content = (
    <>
      <div className="p-5 border-b border-border">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg">
          <span className="grid place-items-center h-9 w-9 rounded-xl gradient-primary text-primary-foreground shrink-0">
            <Home className="h-4 w-4" />
          </span>
          <span>Get<span className="text-accent">Keja</span></span>
        </Link>
      </div>

      <div className="px-5 pt-4 pb-1">
        <span className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground">{title}</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to as never}
            activeOptions={{ exact: item.to === "/dashboard/tenant" || item.to === "/dashboard/landlord" }}
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            activeProps={{ className: "!bg-primary !text-primary-foreground" }}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-border space-y-2">
        <button
          onClick={() => setHelpOpen(true)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <HelpCircle className="h-4 w-4" /> Need help?
        </button>
        <div className="rounded-xl bg-surface p-3">
          <div className="text-sm font-semibold truncate">{profile?.full_name ?? title}</div>
          <div className="text-xs text-muted-foreground truncate">{profile?.email}</div>
          <button
            onClick={handleSignOut}
            className="mt-2 w-full flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-card h-screen sticky top-0">
        {content}
      </aside>

      {/* Mobile top bar + slide-out */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 border-b border-border bg-card flex items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display font-bold">
          <span className="grid place-items-center h-8 w-8 rounded-lg gradient-primary text-primary-foreground shrink-0">
            <Home className="h-3.5 w-3.5" />
          </span>
          Get<span className="text-accent">Keja</span>
        </Link>
        <button onClick={() => setMobileOpen((o) => !o)} aria-label="Menu" className="h-9 w-9 grid place-items-center rounded-lg hover:bg-muted">
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <aside
            className="absolute top-14 left-0 bottom-0 w-72 bg-card border-r border-border flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {content}
          </aside>
        </div>
      )}

      {profile?.id && (
        <ReportDialog
          open={helpOpen}
          onOpenChange={setHelpOpen}
          targetType="user"
          targetId={profile.id}
          defaultCategory="support_request"
          title="Need help?"
        />
      )}
    </>
  );
}
