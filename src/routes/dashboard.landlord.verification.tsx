import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ValidatedInput } from "@/components/shared/ValidatedInput";
import { phoneFieldState } from "@/lib/validators";
import {
  getMyVerificationStatus,
  submitLandlordVerification,
  uploadPropertyMedia,
  type MyVerificationStatus,
} from "@/lib/keja-api";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Loader2,
  Camera,
  IdCard,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/landlord/verification")({
  head: () => ({ meta: [{ title: "Identity Verification — Landlord" }] }),
  component: VerificationPage,
});

function VerificationPage() {
  const { profile } = useAuth();
  const [status, setStatus] = useState<MyVerificationStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [nationalId, setNationalId] = useState("");
  const [businessName, setBusinessName] = useState("");

  const [idFile, setIdFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState("");
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const idInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const loadStatus = () => {
    if (!profile?.id) return;
    setLoadingStatus(true);
    getMyVerificationStatus(profile.id)
      .then(setStatus)
      .catch(() => toast.error("Couldn't load verification status."))
      .finally(() => setLoadingStatus(false));
  };

  useEffect(loadStatus, [profile?.id]);

  const canEdit =
    !status?.verification ||
    status.verification.status === "info_requested" ||
    status.verification.status === "rejected";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    if (!fullName.trim() || !nationalId.trim() || !idFile || !selfieFile) {
      toast.error("Full name, national ID number, an ID photo, and a selfie are all required.");
      return;
    }

    setSubmitting(true);
    try {
      const [idPhotoUrl, selfieUrl] = await Promise.all([
        uploadPropertyMedia(idFile, `${profile.id}/verification`),
        uploadPropertyMedia(selfieFile, `${profile.id}/verification`),
      ]);

      await submitLandlordVerification({
        landlord_id: profile.id,
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        national_id: nationalId.trim(),
        id_photo_url: idPhotoUrl,
        selfie_url: selfieUrl,
        business_name: businessName.trim() || undefined,
      });

      toast.success("Verification submitted for review.");
      loadStatus();
    } catch (err: any) {
      toast.error(err.message || "Couldn't submit verification.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto space-y-6">
      <header>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Identity verification</h1>
        <p className="text-sm text-muted-foreground mt-1">
          You need to be a verified landlord before you can post or update listings. This
          protects tenants from fake listings and confirms you're a real person.
        </p>
      </header>

      {loadingStatus ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" /> Loading…
        </div>
      ) : (
        <StatusBanner status={status} />
      )}

      {!loadingStatus && canEdit && (
        <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Full legal name
              </Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Phone number
              </Label>
              <ValidatedInput
                state={phoneFieldState(phone)}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07XXXXXXXX"
                invalidText="Enter a valid Kenyan phone number."
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                National ID number
              </Label>
              <Input value={nationalId} onChange={(e) => setNationalId(e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Business name (optional)
              </Label>
              <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* ID photo */}
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Photo of your National ID
              </Label>
              <div
                onClick={() => idInputRef.current?.click()}
                className="mt-1.5 cursor-pointer rounded-xl border-2 border-dashed border-border bg-surface hover:bg-muted aspect-video flex items-center justify-center overflow-hidden"
              >
                {idPreview ? (
                  <img src={idPreview} alt="ID preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-muted-foreground text-xs">
                    <IdCard className="h-6 w-6" /> Tap to upload
                  </div>
                )}
              </div>
              <input
                ref={idInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setIdFile(f);
                  setIdPreview(URL.createObjectURL(f));
                }}
              />
            </div>

            {/* Selfie */}
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                A clear selfie of your face
              </Label>
              <div
                onClick={() => selfieInputRef.current?.click()}
                className="mt-1.5 cursor-pointer rounded-xl border-2 border-dashed border-border bg-surface hover:bg-muted aspect-video flex items-center justify-center overflow-hidden"
              >
                {selfiePreview ? (
                  <img src={selfiePreview} alt="Selfie preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-muted-foreground text-xs">
                    <Camera className="h-6 w-6" /> Tap to upload (or take a photo)
                  </div>
                )}
              </div>
              <input
                ref={selfieInputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setSelfieFile(f);
                  setSelfiePreview(URL.createObjectURL(f));
                }}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            A real reviewer checks your ID photo against your selfie — this isn't automated,
            so please make sure both are clear and well-lit. Reviews typically take 1–2
            business days.
          </p>

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                </span>
              ) : (
                "Submit for review"
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function StatusBanner({ status }: { status: MyVerificationStatus | null }) {
  if (!status || !status.verification) {
    return (
      <div className="rounded-2xl border border-border bg-muted/40 p-5 flex items-start gap-3">
        <ShieldQuestion className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div>
          <div className="font-semibold text-sm">Not yet submitted</div>
          <p className="text-xs text-muted-foreground mt-1">
            Submit your details below to get verified. You won't be able to post or update
            listings until this is approved.
          </p>
        </div>
      </div>
    );
  }

  const v = status.verification;

  if (v.status === "approved") {
    return (
      <div className="rounded-2xl border border-accent/40 bg-accent/5 p-5 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-accent mt-0.5" />
        <div>
          <div className="font-semibold text-sm">Verified</div>
          <p className="text-xs text-muted-foreground mt-1">
            You're a verified landlord. You can post and update listings.
          </p>
        </div>
      </div>
    );
  }

  if (v.status === "pending") {
    return (
      <div className="rounded-2xl border border-border bg-muted/40 p-5 flex items-start gap-3">
        <ShieldQuestion className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div>
          <div className="font-semibold text-sm">Pending review</div>
          <p className="text-xs text-muted-foreground mt-1">
            Submitted on {new Date(v.created_at).toLocaleDateString()}. We'll notify you once
            it's reviewed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5 flex items-start gap-3">
      <ShieldAlert className="h-5 w-5 text-destructive mt-0.5" />
      <div>
        <div className="font-semibold text-sm">
          {v.status === "rejected" ? "Rejected" : "More information requested"}
        </div>
        {v.admin_notes && <p className="text-xs text-muted-foreground mt-1">{v.admin_notes}</p>}
        <p className="text-xs text-muted-foreground mt-1">Please update and resubmit below.</p>
      </div>
    </div>
  );
}
