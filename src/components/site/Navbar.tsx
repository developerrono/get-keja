import { Link, useNavigate } from "@tanstack/react-router";
import { Home, LogOut, Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth, dashboardPathForRole } from "@/hooks/use-auth";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const baseLinks = [
    { to: "/", label: "Home" },
    { to: "/listings", label: "Listings" },
  ];
  const links = user
    ? [...baseLinks, { to: dashboardPathForRole(role), label: "Dashboard" }]
    : baseLinks;

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg">
          <span className="grid place-items-center h-9 w-9 rounded-xl gradient-primary text-primary-foreground shadow-glow">
            <Home className="h-4 w-4" />
          </span>
          <span>Get<span className="text-accent">Keja</span></span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to + l.label}
              to={l.to}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              activeProps={{ className: "text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDark((d) => !d)}
            aria-label="Toggle theme"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {user ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="hidden sm:inline-flex gap-2"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          ) : (
            <>
              <Link to="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link to="/signup" className="hidden sm:block">
                <Button size="sm" className="rounded-full">Get started</Button>
              </Link>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container-page py-3 flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.to + l.label}
                to={l.to}
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted"
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              <Button
                onClick={() => {
                  setOpen(false);
                  handleSignOut();
                }}
                className="w-full mt-2 rounded-full"
                variant="outline"
              >
                Sign out
              </Button>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full mt-2 rounded-full">Sign in</Button>
                </Link>
                <Link to="/signup" onClick={() => setOpen(false)}>
                  <Button className="w-full mt-2 rounded-full">Get started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
