import { Link } from "@tanstack/react-router";
import { Home } from "lucide-react";
import type { ReactNode } from "react";

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="gradient-hero hidden lg:flex flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-2 font-display font-bold">
          <span className="grid place-items-center h-9 w-9 rounded-xl gradient-primary text-primary-foreground">
            <Home className="h-4 w-4" />
          </span>
          Get<span className="text-accent">Keja</span>
        </Link>
        <div>
          <h2 className="font-display text-4xl font-bold leading-tight max-w-md">
            {title} <span className="text-accent">{subtitle}</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-md">
            Find verified rentals, message landlords, schedule visits — all in one place.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} GetKeja. Real homes. Real landlords.
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
