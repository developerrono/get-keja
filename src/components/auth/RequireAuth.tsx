import { useEffect, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth, dashboardPathForRole, type AppRole } from "@/hooks/use-auth";

export function RequireAuth({
  children,
  requireRole,
}: {
  children: ReactNode;
  requireRole?: AppRole;
}) {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login", search: { redirect: pathname } as never });
      return;
    }
    if (requireRole && role && role !== requireRole) {
      navigate({ to: dashboardPathForRole(role) });
    }
  }, [loading, user, role, requireRole, navigate, pathname]);

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (requireRole && role && role !== requireRole) return null;

  return <>{children}</>;
}
