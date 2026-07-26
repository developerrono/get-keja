import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/cookies")({
  head: () => ({ meta: [{ title: "Cookie Policy — GetKeja" }] }),
  component: Cookies,
});

function Cookies() {
  return (
    <div className="container-page py-16 max-w-3xl">
      <h1 className="font-display text-3xl md:text-4xl font-bold">Cookie policy</h1>
      <p className="mt-2 text-xs text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="mt-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
        <Section title="What we use">
          GetKeja uses your browser's local storage to keep you signed in and remember basic
          preferences like grid vs. list view. We don't use third-party advertising or tracking
          cookies.
        </Section>
        <Section title="Essential storage">
          Your session (so you don't have to sign in on every page) is stored locally in your
          browser and is required for the site to function.
        </Section>
        <Section title="Analytics">
          We may use basic, privacy-respecting analytics to understand how people use GetKeja and
          improve the product. This doesn't identify you individually.
        </Section>
        <Section title="Managing storage">
          You can clear your browser's local storage at any time from your browser settings —
          this will sign you out of GetKeja.
        </Section>
      </div>

      <p className="mt-10 text-xs text-muted-foreground/70 border-t border-border pt-4">
        This is a general template and hasn't been reviewed by a lawyer. Please have it reviewed
        before relying on it as your official policy.
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display font-bold text-foreground text-base mb-1.5">{title}</h2>
      <p>{children}</p>
    </div>
  );
}
