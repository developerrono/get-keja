import { createFileRoute } from "@tanstack/react-router";
import { Home, ShieldCheck, Search, Wallet } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About — GetKeja" }] }),
  component: About,
});

function About() {
  return (
    <div className="container-page py-16 max-w-3xl">
      <h1 className="font-display text-3xl md:text-4xl font-bold">About GetKeja</h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        GetKeja is a house-hunting platform built for Kenya. We connect tenants directly with
        landlords and verified listings, cutting out the middlemen and fake listings that make
        finding a home harder than it needs to be.
      </p>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        Search real, up-to-date listings, message landlords directly, schedule visits, and even
        pay rent — all in one place.
      </p>

      <div className="mt-10 grid sm:grid-cols-2 gap-4">
        <Feature icon={Search} title="Real listings" desc="Every property is tied to a real landlord account, not a repost." />
        <Feature icon={ShieldCheck} title="Verified landlords" desc="Landlords can verify their identity for a trust badge on their listings." />
        <Feature icon={Home} title="Direct messaging" desc="Talk to landlords directly — no agents, no middlemen." />
        <Feature icon={Wallet} title="Pay rent in-app" desc="M-Pesa rent payments tracked automatically, receipts included." />
      </div>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: typeof Home; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <Icon className="h-5 w-5 text-primary" />
      <div className="mt-3 font-semibold">{title}</div>
      <p className="text-sm text-muted-foreground mt-1">{desc}</p>
    </div>
  );
}
