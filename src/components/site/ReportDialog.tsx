import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { submitReport } from "@/lib/keja-api";
import { useAuth } from "@/hooks/use-auth";

const CATS = [
  { v: "fake_listing", l: "Fake listing" },
  { v: "scam", l: "Scam" },
  { v: "spam", l: "Spam" },
  { v: "incorrect_info", l: "Incorrect information" },
  { v: "abuse", l: "Abuse" },
  { v: "support_request", l: "General help / question" },
  { v: "other", l: "Other" },
];

export function ReportDialog({
  open, onOpenChange, targetType, targetId, defaultCategory, title,
}: {
  open: boolean; onOpenChange: (o: boolean) => void;
  targetType: "property" | "user" | "review"; targetId: string;
  /** Preselect a category — used when opening this as a "Need help?" support request. */
  defaultCategory?: string;
  /** Override the dialog title — used for the support-request case. */
  title?: string;
}) {
  const { user } = useAuth();
  const [category, setCategory] = useState(defaultCategory ?? "fake_listing");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!user) return toast.error("Sign in to continue");
    if (category === "support_request" && !desc.trim()) return toast.error("Tell us what you need help with.");
    setSaving(true);
    try {
      await submitReport({ reporter_id: user.id, target_type: targetType, target_id: targetId, category, description: desc });
      toast.success(category === "support_request" ? "Message sent — our team will get back to you." : "Report submitted");
      setDesc("");
      onOpenChange(false);
    } catch { toast.error("Could not send. Try again."); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{title ?? "Report this listing"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Reason</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{CATS.map((c) => <SelectItem key={c.v} value={c.v}>{c.l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>{category === "support_request" ? "How can we help?" : "Details (optional)"}</Label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="mt-1" />
          </div>
          <Button onClick={submit} disabled={saving} className="w-full rounded-full">
            {saving ? "Sending..." : category === "support_request" ? "Send to support" : "Submit report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
