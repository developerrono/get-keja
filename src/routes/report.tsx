import { createFileRoute, Link } from "@tanstack/react-router";
import { Flag, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/report")({
  head: () => ({ meta: [{ title: "Report a Listing — GetKeja" }] }),
  component: ReportListing,
});

function ReportListing() {
  return (
    <div className="container-page py-16 max-w-2xl">
      <h1 className="font-display text-3xl md:text-4xl font-bold">Report a listing</h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        Spotted a fake, misleading, or inappropriate listing? Reporting it directly from the
        property page gives our team the most context and gets it reviewed fastest.
      </p>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6 flex items-start gap-4">
        <Flag className="h-6 w-6 text-primary shrink-0" />
        <div>
          <div className="font-semibold">Report from the listing</div>
          <p className="text-sm text-muted-foreground mt-1">
            Open the property, and use the "Report" option on the page. This links your report to
            the exact listing so an admin can review it quickly.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-dashed border-border p-6 flex items-start gap-4">
        <ShieldAlert className="h-6 w-6 text-accent shrink-0" />
        <div>
          <div className="font-semibold">Can't find the listing anymore?</div>
          <p className="text-sm text-muted-foreground mt-1">
            <Link to="/contact" className="text-primary font-semibold hover:underline">Contact us</Link> with
            as much detail as you can — the property name, location, or a link — and we'll look into it.
          </p>
        </div>
      </div>
    </div>
  );
}
