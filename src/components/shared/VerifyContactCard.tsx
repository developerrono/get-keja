import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendOtp, verifyOtp } from "@/lib/keja-api";
import { isValidKenyanPhone, isValidEmail } from "@/lib/validators";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";

/**
 * Drop-in "Verify phone" / "Verify email" row. Shows a green check once
 * verified; otherwise lets the user request and enter a 6-digit code.
 */
export function VerifyContactCard({
  userId,
  channel,
  destination,
  verified,
  onVerified,
}: {
  userId: string;
  channel: "phone" | "email";
  destination: string;
  verified: boolean;
  onVerified?: () => void;
}) {
  const [stage, setStage] = useState<"idle" | "sent">("idle");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  const label = channel === "phone" ? "Phone number" : "Email address";
  const formatOk = channel === "phone" ? isValidKenyanPhone(destination) : isValidEmail(destination);

  const request = async () => {
    if (!formatOk) {
      toast.error(`Enter a valid ${label.toLowerCase()} first.`);
      return;
    }
    setSending(true);
    try {
      await sendOtp({ user_id: userId, channel, destination });
      toast.success(`Code sent to ${destination}.`);
      setStage("sent");
    } catch (err: any) {
      toast.error(err.message || "Couldn't send code.");
    } finally {
      setSending(false);
    }
  };

  const confirm = async () => {
    if (code.trim().length !== 6) {
      toast.error("Enter the 6-digit code.");
      return;
    }
    setChecking(true);
    try {
      await verifyOtp({ user_id: userId, channel, code: code.trim() });
      toast.success(`${label} verified.`);
      setStage("idle");
      setCode("");
      onVerified?.();
    } catch (err: any) {
      toast.error(err.message || "Incorrect or expired code.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 p-4 rounded-xl border border-border">
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-sm flex items-center gap-1.5">
          {label}
          {verified && <CheckCircle2 className="h-4 w-4 text-green-600" />}
        </div>
        <div className="text-xs text-muted-foreground truncate">{destination || "Not set"}</div>

        {!verified && stage === "sent" && (
          <div className="mt-3 flex items-center gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6-digit code"
              className="h-9 w-32"
            />
            <Button size="sm" onClick={confirm} disabled={checking}>
              {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
            </Button>
            <Button size="sm" variant="ghost" onClick={request} disabled={sending}>
              Resend
            </Button>
          </div>
        )}
      </div>

      {!verified && stage === "idle" && (
        <Button size="sm" variant="outline" onClick={request} disabled={sending || !destination}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
        </Button>
      )}
    </div>
  );
}
