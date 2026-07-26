import { createFileRoute } from "@tanstack/react-router";
import { Mail } from "lucide-react";

export const Route = createFileRoute("/careers")({
  head: () => ({ meta: [{ title: "Careers — GetKeja" }] }),
  component: Careers,
});

function Careers() {
  return (
    <div className="container-page py-16 max-w-3xl">
      <h1 className="font-display text-3xl md:text-4xl font-bold">Careers</h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        We're a small team building GetKeja to make house hunting in Kenya faster and more
        trustworthy. We're not actively hiring for listed roles right now, but we're always
        happy to hear from people who want to help.
      </p>

      <div className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center">
        <p className="text-sm text-muted-foreground">No open roles at the moment.</p>
        <a
          href="mailto:careers@getkeja.com"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <Mail className="h-4 w-4" /> Send us your CV anyway
        </a>
      </div>
    </div>
  );
}
