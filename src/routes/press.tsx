import { createFileRoute } from "@tanstack/react-router";
import { Mail } from "lucide-react";

export const Route = createFileRoute("/press")({
  head: () => ({ meta: [{ title: "Press — GetKeja" }] }),
  component: Press,
});

function Press() {
  return (
    <div className="container-page py-16 max-w-3xl">
      <h1 className="font-display text-3xl md:text-4xl font-bold">Press</h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        GetKeja is on a mission to make finding a rental home in Kenya simple, transparent, and
        free of fake listings and agent middlemen.
      </p>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        For interviews, media assets, or press inquiries, reach out and we'll get back to you.
      </p>
      <a
        href="mailto:press@getkeja.com"
        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
      >
        <Mail className="h-4 w-4" /> press@getkeja.com
      </a>
    </div>
  );
}
