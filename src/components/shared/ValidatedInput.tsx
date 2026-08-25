import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle } from "lucide-react";
import type { FieldState } from "@/lib/validators";
import type { InputHTMLAttributes } from "react";

/**
 * A text input that highlights green/red as the user types, based on a
 * format check (e.g. phone number shape, email shape). This only checks
 * *format* — it does not prove the phone/email is actually reachable by
 * the user. Pair with an OTP flow for real ownership verification.
 */
export function ValidatedInput({
  state,
  helperText,
  invalidText,
  className = "",
  ...props
}: {
  state: FieldState;
  helperText?: string;
  invalidText?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  const borderClass =
    state === "valid"
      ? "border-green-500 focus-visible:ring-green-500"
      : state === "invalid"
      ? "border-destructive focus-visible:ring-destructive"
      : "";

  return (
    <div>
      <div className="relative">
        <Input {...props} className={`${borderClass} ${state !== "empty" ? "pr-9" : ""} ${className}`} />
        {state === "valid" && (
          <CheckCircle2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
        )}
        {state === "invalid" && (
          <XCircle className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
        )}
      </div>
      {state === "invalid" && invalidText && (
        <p className="text-xs text-destructive mt-1">{invalidText}</p>
      )}
      {state !== "invalid" && helperText && (
        <p className="text-xs text-muted-foreground mt-1">{helperText}</p>
      )}
    </div>
  );
}
