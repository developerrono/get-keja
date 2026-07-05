import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminBroadcast } from "@/lib/keja-api";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/admin/notifications")({ component: AdminNotifs });

function AdminNotifs() {
  const { user } = useAuth();
  const [category, setCategory] = useState("system");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const send = async () => {
    if (!user) return;
    setSaving(true);
    try { await adminBroadcast({ author_id: user.id, category, title, body }); toast.success("Announcement published"); setTitle(""); setBody(""); }
    catch { toast.error("Failed"); }
    finally { setSaving(false); }
  };
  return (
    <div className="p-6 lg:p-10 max-w-2xl">
      <h1 className="font-display text-2xl md:text-3xl font-bold">Send announcement</h1>
      <div className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6">
        <div>
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
              <SelectItem value="update">Platform update</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" /></div>
        <div><Label>Message</Label><Textarea value={body} onChange={(e) => setBody(e.target.value)} className="mt-1 min-h-32" /></div>
        <Button onClick={send} disabled={saving || !title || !body} className="rounded-full">{saving ? "Sending..." : "Publish"}</Button>
      </div>
    </div>
  );
}
