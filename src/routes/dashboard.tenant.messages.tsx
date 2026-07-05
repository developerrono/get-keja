import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listConversations, listMessages, sendMessage, type DbMessage } from "@/lib/keja-api";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/dashboard/tenant/messages")({ component: Messages });

type Convo = { id: string; tenant_id: string; landlord_id: string; property_id: string | null;
  properties?: { name: string; cover_image: string | null } | null;
  tenant?: { full_name: string | null; avatar_url: string | null } | null;
  landlord?: { full_name: string | null; avatar_url: string | null } | null };

function Messages() {
  const { user } = useAuth();
  const [convos, setConvos] = useState<Convo[]>([]);
  const [active, setActive] = useState<Convo | null>(null);
  const [msgs, setMsgs] = useState<DbMessage[]>([]);
  const [text, setText] = useState("");

  useEffect(() => { if (user) listConversations(user.id).then((c) => setConvos(c as unknown as Convo[])); }, [user]);
  useEffect(() => { if (active) listMessages(active.id).then(setMsgs); }, [active]);

  const send = async () => {
    if (!active || !user || !text.trim()) return;
    await sendMessage(active.id, user.id, text.trim());
    setText("");
    listMessages(active.id).then(setMsgs);
  };

  return (
    <div className="p-6 lg:p-10">
      <h1 className="font-display text-2xl md:text-3xl font-bold mb-6">Messages</h1>
      <div className="grid lg:grid-cols-[320px_1fr] gap-4 h-[70vh]">
        <div className="rounded-2xl border border-border bg-card overflow-y-auto">
          {convos.length === 0 && <div className="p-6 text-sm text-muted-foreground">No conversations yet.</div>}
          {convos.map((c) => {
            const other = user?.id === c.tenant_id ? c.landlord : c.tenant;
            return (
              <button key={c.id} onClick={() => setActive(c)}
                className={`w-full text-left p-4 border-b border-border hover:bg-muted ${active?.id === c.id ? "bg-muted" : ""}`}>
                <div className="font-semibold text-sm">{other?.full_name ?? "User"}</div>
                <div className="text-xs text-muted-foreground truncate">{c.properties?.name}</div>
              </button>
            );
          })}
        </div>
        <div className="rounded-2xl border border-border bg-card flex flex-col">
          {!active ? (
            <div className="flex-1 grid place-items-center text-sm text-muted-foreground">Select a conversation</div>
          ) : (
            <>
              <div className="p-4 border-b border-border font-semibold">
                {active.properties?.name ?? "Conversation"}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {msgs.map((m) => (
                  <div key={m.id} className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.sender_id === user?.id ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {m.body}
                    <div className="text-[10px] opacity-70 mt-0.5">{format(new Date(m.created_at), "HH:mm")}</div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-border flex gap-2">
                <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." onKeyDown={(e) => e.key === "Enter" && send()} />
                <Button onClick={send} size="icon"><Send className="h-4 w-4" /></Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
