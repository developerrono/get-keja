import { Link, useRouterState } from "@tanstack/react-router";
import { Home } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = { to: string; label: string; icon: LucideIcon };

export function DashboardSidebar({
  title,
  items,
}: {
  title: string;
  items: NavItem[];
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-sidebar min-h-screen sticky top-0 hidden md:flex flex-col">
      <Link to="/" className="flex items-center gap-2 font-display font-bold px-6 h-16 border-b border-border">
        <span className="grid place-items-center h-8 w-8 rounded-lg gradient-primary text-primary-foreground">
          <Home className="h-4 w-4" />
        </span>
        Get<span className="text-accent">Keja</span>
      </Link>
      <div className="px-3 pt-5 pb-2 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
        {title}
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {items.map((i) => {
          const active = pathname === i.to;
          return (
            <Link
              key={i.to}
              to={i.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <i.icon className="h-4 w-4" />
              {i.label}
            </Link>
          );
        })}
      </nav>
      <div className="m-3 p-4 rounded-2xl bg-primary-soft">
        <div className="text-xs font-semibold">Need help?</div>
        <p className="text-xs text-muted-foreground mt-1">Reach out to our support team anytime.</p>
      </div>
    </aside>
  );
}
