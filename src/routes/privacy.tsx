import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — GetKeja" }] }),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="container-page py-16 max-w-3xl prose-sm">
      <h1 className="font-display text-3xl md:text-4xl font-bold">Privacy policy</h1>
      <p className="mt-2 text-xs text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="mt-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
        <Section title="Information we collect">
          When you create an account, we collect your name, email address, phone number, and role
          (tenant or landlord). Landlords who apply for verification also provide a national ID
          and photos as part of that process. When you use GetKeja, we also store the listings,
          messages, visit requests, reviews, and rent payments tied to your account.
        </Section>
        <Section title="How we use your information">
          We use your information to operate the platform — matching tenants with listings,
          enabling messaging between tenants and landlords, processing rent payments, and sending
          you notifications about your account activity. We don't sell your personal data to
          third parties.
        </Section>
        <Section title="Payments">
          Rent payments are processed via M-Pesa. GetKeja records the transaction details needed
          to track payment status and calculate the platform fee, but does not store your M-Pesa
          PIN or full payment credentials.
        </Section>
        <Section title="Your rights">
          You can update or delete your account at any time from Settings. Deleting your account
          removes your profile and associated listings, messages, and reviews.
        </Section>
        <Section title="Contact">
          Questions about this policy? Reach us at privacy@getkeja.com.
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
