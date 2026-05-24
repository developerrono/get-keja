import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Twitter, Home } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="container-page py-14 grid gap-10 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-display font-bold text-lg">
            <span className="grid place-items-center h-9 w-9 rounded-xl gradient-primary text-primary-foreground">
              <Home className="h-4 w-4" />
            </span>
            Get<span className="text-accent">Keja</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground max-w-xs">
            Find verified rental houses and apartments around you in real time.
          </p>
        </div>
        <FooterCol title="Company" items={["About", "Careers", "Press"]} />
        <FooterCol title="Support" items={["Contact", "Help center", "Report listing"]} />
        <FooterCol title="Legal" items={["Privacy policy", "Terms", "Cookies"]} />
      </div>
      <div className="border-t border-border">
        <div className="container-page py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} GetKeja. All rights reserved.
          </p>
          <div className="flex items-center gap-3 text-muted-foreground">
            <a href="#" aria-label="Twitter" className="hover:text-foreground"><Twitter className="h-4 w-4" /></a>
            <a href="#" aria-label="Instagram" className="hover:text-foreground"><Instagram className="h-4 w-4" /></a>
            <a href="#" aria-label="Facebook" className="hover:text-foreground"><Facebook className="h-4 w-4" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-3">{title}</h4>
      <ul className="space-y-2">
        {items.map((i) => (
          <li key={i}>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {i}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
