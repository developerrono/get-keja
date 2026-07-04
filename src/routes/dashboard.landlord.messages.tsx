import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { conversations as seed, landlordProperties, type Conversation } from "@/lib/landlord-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Send, Image as ImageIcon, CheckCheck, Check } from "lucide-react";

export const Route = createFileRoute("/dashboard/landlord/messages")({
  head: () => ({ meta: [{ title: "Messages — Landlord" }] }),
  component: MessagesPage,
});

const QUICK_REPLIES = [
  "Yes, it's still available.",
  "You can visit tomorrow at 10am.",
  "Rent is negotiable.",
  "Please share your details.",
];

function MessagesPage() {
  const [items, setItems] = useState<Conversation[]>(seed);
  const [activeId, setActiveId] = useState<string>(seed[0]?.id ?? "");
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState("");
  const [typing] = useState(true);

  const active = items.find((c) => c.id === activeId);
  const filtered = useMemo(
    () => items.filter((c) => c.name.toLowerCase().includes(q.toLowerCase())),
    [items, q],
  );

  const send = (text?: string) => {
    const msg = (text ?? draft).trim();
    if (!msg || !active) return;
    setItems((prev) =>
      prev.map((c) =>
        c.id === active.id
          ? {
              ...c,
              lastMessage: msg,
              time: "now",
              messages: [...c.messages, { id: crypto.randomUUID(), from: "me", text: msg, time: "now", read: false }],
            }
          : c,
      ),
    );
    setDraft("");
  };

  const property = active?.propertyId ? landlordProperties.find((p) => p.id === active.propertyId) : undefined;

  return (
    <div className="h-[calc(100vh-3.5rem)] md:h-screen flex">
      {/* Conversations */}
      <aside className="w-full sm:w-80 border-r border-border bg-card flex flex-col shrink-0" hidden={!!active && typeof window !== "undefined" && window.innerWidth < 640 ? false : false}>
        <div className="p-4 border-b border-border">
          <h1 className="font-display font-bold text-lg">Messages</h1>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-9" />
          </div>
        </div>
        <ul className="flex-1 overflow-y-auto">
          {filtered.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setActiveId(c.id)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b border-border/60 transition-colors ${activeId === c.id ? "bg-primary-soft" : "hover:bg-muted/50"}`}
              >
                <span className="relative shrink-0">
                  <span className="grid place-items-center h-11 w-11 rounded-full bg-primary text-primary-foreground text-xs font-bold">{c.avatarInitials}</span>
                  {c.online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-accent border-2 border-card" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold truncate">{c.name}</div>
                    <div className="text-[11px] text-muted-foreground shrink-0">{c.time}</div>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{c.lastMessage}</div>
                </div>
                {c.unread > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground">{c.unread}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Chat */}
      <section className="hidden sm:flex flex-1 min-w-0 flex-col bg-background">
        {active ? (
          <>
            <header className="h-16 border-b border-border bg-card px-5 flex items-center gap-3">
              <span className="grid place-items-center h-10 w-10 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">{active.avatarInitials}</span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate">{active.name}</div>
                <div className="text-xs text-muted-foreground">{active.online ? "Online" : "Offline"}{typing && active.online && " • typing…"}</div>
              </div>
            </header>

            {property && (
              <div className="p-4 border-b border-border">
                <div className="rounded-2xl border border-border bg-card p-3 flex items-center gap-3">
                  <img src={property.cover} alt="" className="h-14 w-20 object-cover rounded-lg shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">{property.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{property.estate} • {property.units.length} units</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {active.messages.map((m) => (
                <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${m.from === "me" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border border-border rounded-bl-sm"}`}>
                    <div>{m.text}</div>
                    <div className={`text-[10px] mt-1 flex items-center gap-1 ${m.from === "me" ? "text-primary-foreground/70 justify-end" : "text-muted-foreground"}`}>
                      {m.time}
                      {m.from === "me" && (m.read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border bg-card p-3 space-y-2">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {QUICK_REPLIES.map((r) => (
                  <button key={r} onClick={() => send(r)} className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors">
                    {r}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" aria-label="Attach image"><ImageIcon className="h-4 w-4" /></Button>
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Type a message…"
                />
                <Button onClick={() => send()} className="gap-1"><Send className="h-4 w-4" /></Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 grid place-items-center text-sm text-muted-foreground">Select a conversation</div>
        )}
      </section>
    </div>
  );
}
