import { createFileRoute, Link } from "@tanstack/react-router";
import { Home, Mail, ArrowRight, Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Sign in — GetKeja" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="gradient-hero hidden lg:flex flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-2 font-display font-bold">
          <span className="grid place-items-center h-9 w-9 rounded-xl gradient-primary text-primary-foreground">
            <Home className="h-4 w-4" />
          </span>
          Get<span className="text-accent">Keja</span>
        </Link>
        <div>
          <h2 className="font-display text-4xl font-bold leading-tight max-w-md">
            Welcome home. <br />
            <span className="text-accent">Literally.</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-md">
            Sign in to save your favorites, message landlords, and schedule house visits.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">© {new Date().getFullYear()} GetKeja</div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-bold">Sign in to GetKeja</h1>
          <p className="text-sm text-muted-foreground mt-1">Continue your house hunt.</p>

          <Button variant="outline" className="mt-8 w-full rounded-xl gap-2 h-11">
            <Chrome className="h-4 w-4" /> Continue with Google
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
            <div>
              <Label htmlFor="email" className="text-xs">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" className="mt-1.5 h-11 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="password" className="text-xs">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" className="mt-1.5 h-11 rounded-xl" />
            </div>
            <Button type="submit" className="w-full rounded-xl h-11 gap-2">
              <Mail className="h-4 w-4" /> Continue with email
            </Button>
          </form>

          <p className="mt-6 text-xs text-muted-foreground text-center">
            New here?{" "}
            <Link to="/login" className="text-accent font-semibold inline-flex items-center gap-1">
              Create an account <ArrowRight className="h-3 w-3" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
