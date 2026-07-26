import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export const Route = createFileRoute("/help")({
  head: () => ({ meta: [{ title: "Help Center — GetKeja" }] }),
  component: HelpCenter,
});

const FAQS = [
  {
    q: "How do I contact a landlord?",
    a: "Open any listing and tap \"Message landlord\" — it starts a conversation you can continue from your dashboard's Messages tab.",
  },
  {
    q: "How do I schedule a house visit?",
    a: "On a listing page, tap \"Schedule visit\" and pick a date and time. The landlord will approve or decline it, and you'll see the status in My Visits.",
  },
  {
    q: "How does rent payment work?",
    a: "Once you have an active tenancy, go to My Rent in your dashboard to pay via M-Pesa. Payments are recorded automatically and you'll see them in your payment history.",
  },
  {
    q: "How do I report a listing?",
    a: "Open the listing and use the \"Report\" option, or visit our Report a listing page for general reporting help.",
  },
  {
    q: "How do I delete my account?",
    a: "Go to Settings → Danger zone in your dashboard. This permanently removes your account and data.",
  },
  {
    q: "I'm a landlord — how do I get verified?",
    a: "Go to Settings and submit your verification documents. An admin reviews requests and you'll get a notification once it's approved.",
  },
];

function HelpCenter() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="container-page py-16 max-w-2xl">
      <h1 className="font-display text-3xl md:text-4xl font-bold">Help center</h1>
      <p className="mt-4 text-muted-foreground">Answers to common questions about using GetKeja.</p>

      <div className="mt-8 space-y-3">
        {FAQS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q} className="rounded-2xl border border-border bg-card overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-3 p-4 text-left"
              >
                <span className="font-semibold text-sm">{item.q}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{item.a}</p>}
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Still stuck? <a href="/contact" className="text-primary font-semibold hover:underline">Contact us</a>.
      </p>
    </div>
  );
}
