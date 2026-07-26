import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms of Service — GetKeja" }] }),
  component: Terms,
});

function Terms() {
  return (
    <div className="container-page py-16 max-w-3xl">
      <h1 className="font-display text-3xl md:text-4xl font-bold">Terms of service</h1>
      <p className="mt-2 text-xs text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="mt-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
        <Section title="1. Using GetKeja">
          GetKeja connects tenants looking for a home with landlords listing rental properties.
          You must be 18 or older to create an account. You're responsible for keeping your
          account credentials secure.
        </Section>
        <Section title="2. Listings">
          Landlords are responsible for the accuracy of their listings, including rent, location,
          and availability. Posting false or misleading listings may result in the listing being
          removed and the account suspended.
        </Section>
        <Section title="3. Payments">
          Rent payments made through GetKeja are processed via M-Pesa. GetKeja charges a 1%
          platform fee on successful rent payments, deducted automatically before funds reach the
          landlord.
        </Section>
        <Section title="4. Reviews">
          Reviews must reflect a genuine tenancy experience. GetKeja may remove reviews that
          violate this or contain abusive content.
        </Section>
        <Section title="5. Account termination">
          We may suspend or terminate accounts that violate these terms, including fraudulent
          listings, harassment, or abuse of the platform.
        </Section>
        <Section title="6. Limitation of liability">
          GetKeja facilitates connections between tenants and landlords but is not a party to any
          tenancy agreement. We're not liable for disputes arising from a tenancy itself.
        </Section>
      </div>

      <p className="mt-10 text-xs text-muted-foreground/70 border-t border-border pt-4">
        This is a general template and hasn't been reviewed by a lawyer. Please have it reviewed
        before relying on it as your official terms.
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
