import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, Phone, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact — GetKeja" }] }),
  component: Contact,
});

function Contact() {
  return (
    <div className="container-page py-16 max-w-2xl">
      <h1 className="font-display text-3xl md:text-4xl font-bold">Contact us</h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        Have a question, a problem with your account, or feedback on GetKeja? Reach us directly:
      </p>

      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        <a href="mailto:support@getkeja.com" className="rounded-2xl border border-border bg-card p-5 hover:bg-muted/50 transition-colors">
          <Mail className="h-5 w-5 text-primary" />
          <div className="mt-3 font-semibold">Email</div>
          <p className="text-sm text-muted-foreground mt-1">support@getkeja.com</p>
        </a>
        <a href="tel:+254700000000" className="rounded-2xl border border-border bg-card p-5 hover:bg-muted/50 transition-colors">
          <Phone className="h-5 w-5 text-primary" />
          <div className="mt-3 font-semibold">Phone</div>
          <p className="text-sm text-muted-foreground mt-1">+254 700 000 000</p>
        </a>
      </div>

      <div className="mt-8 rounded-2xl border border-dashed border-border p-6 flex items-start gap-3">
        <MessageSquare className="h-5 w-5 text-accent shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          Already have an account? You'll get a faster response using the "Need help" option
          in your dashboard, since it's tied to your account.{" "}
          <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
