import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listConversations, listMessages, sendMessage, type DbMessage } from "@/lib/keja-api";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Search } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/dashboard/landlord/messages")({
  head: () => ({ meta: [{ title: "Messages — Landlord" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  const { user } = useAuth();
  const [convos, setConvos] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<DbMessage[]>([]);
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState("");

  useEffect(() => { if (user) listConversations(user.id).then(setConvos); }, [user]);
  useEffect(() => { if (activeId) listMessages(activeId).then(setMsgs); }, [activeId]);

  const active = convos.find((c) => c.id === activeId);
  const filtered = convos.filter((c) => !q || (c.tenant_name ?? "").toLowerCase().includes(q.toLowerCase()));

  const send = async () => {
    if (!activeId || !user || !draft.trim()) return;
    await sendMessage(activeId, user.id, draft.trim());
    setDraft("");
    listMessages(activeId).then(setMsgs);
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] md:h-screen flex">
      <aside className="w-full sm:w-80 border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <h1 className="font-display font-bold text-lg">Messages</h1>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-9" />
          </div>
        </div>
        <ul className="flex-1 overflow-y-auto">
          {filtered.length === 0 && <li className="p-4 text-sm text-muted-foreground">No conversations yet.</li>}
          {filtered.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setActiveId(c.id)}
                className={`w-full text-left px-4 py-3 border-b border-border/60 transition-colors ${activeId === c.id ? "bg-primary-soft" : "hover:bg-muted/50"}`}
              >
                <div className="text-sm font-semibold truncate">{c.tenant_name ?? "Tenant"}</div>
                <div className="text-xs text-muted-foreground truncate">{c.property_name ?? "General inquiry"}</div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="hidden sm:flex flex-1 min-w-0 flex-col bg-background">
        {active ? (
          <>
            <header className="h-16 border-b border-border bg-card px-5 flex items-center">
              <div className="font-semibold">{active.tenant_name ?? "Tenant"}</div>
            </header>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {msgs.map((m) => (
                <div key={m.id} className={`flex ${m.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${m.sender_id === user?.id ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border border-border rounded-bl-sm"}`}>
                    <div>{m.body}</div>
                    <div className="text-[10px] mt-1 opacity-70">{format(new Date(m.created_at), "HH:mm")}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border bg-card p-3 flex items-center gap-2">
              <Input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type a message…" />
              <Button onClick={send} className="gap-1"><Send className="h-4 w-4" /></Button>
            </div>
          </>
        ) : (
          <div className="flex-1 grid place-items-center text-sm text-muted-foreground">Select a conversation</div>
        )}
      </section>
    </div>
  );
}
