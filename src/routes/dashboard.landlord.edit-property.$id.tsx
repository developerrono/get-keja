import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AMENITIES, HOUSE_TYPES, type Unit, type HouseType } from "@/lib/landlord-data";
import {
  fetchPropertyById,
  updateProperty,
  updatePropertyUnits,
  uploadPropertyMedia,
  getMyVerificationStatus,
  type CreatePropertyUnit,
} from "@/lib/keja-api";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Trash2, MapPin, ImageIcon, X, Film, Loader2, LocateFixed, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/landlord/edit-property/$id")({
  head: () => ({ meta: [{ title: "Edit Property — Landlord" }] }),
  component: EditPropertyPage,
});

const DEFAULT_CENTER = { lat: -1.286389, lng: 36.817223 };

function EditPropertyPage() {
  const { id } = Route.useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [verifiedStatus, setVerifiedStatus] = useState<"loading" | "verified" | "unverified">("loading");

  useEffect(() => {
    if (!profile?.id) return;
    getMyVerificationStatus(profile.id)
      .then((s) => setVerifiedStatus(s.is_verified_landlord ? "verified" : "unverified"))
      .catch(() => setVerifiedStatus("unverified"));
  }, [profile?.id]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [county, setCounty] = useState("");
  const [town, setTown] = useState("");
  const [estate, setEstate] = useState("");
  const [street, setStreet] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // ---- Existing media (already on the server) ----
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);
  const [coverRemoved, setCoverRemoved] = useState(false);
  const [existingGallery, setExistingGallery] = useState<string[]>([]);
  const [existingVideoUrl, setExistingVideoUrl] = useState<string | null>(null);
  const [videoRemoved, setVideoRemoved] = useState(false);

  // ---- New media (picked in this session) ----
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>("");

  // ---- Load existing property ----
  useEffect(() => {
    fetchPropertyById(id)
      .then(({ property: p, units: dbUnits }) => {
        setName(p.name);
        setDescription(p.description ?? "");
        setCounty(p.county);
        // estate was stored as "Town - Estate" by the add form; split back out best-effort
        const [maybeTown, ...rest] = (p.estate ?? "").split(" - ");
        if (rest.length) {
          setTown(maybeTown);
          setEstate(rest.join(" - "));
        } else {
          setEstate(p.estate ?? "");
        }
        setStreet(p.address ?? "");
        setAmenities(p.amenities ?? []);
        setExistingCoverUrl(p.cover_image);
        setExistingGallery(p.images ?? []);
        setExistingVideoUrl(p.video);
        if (p.latitude != null && p.longitude != null) {
          setCoords({ lat: p.latitude, lng: p.longitude });
        }
        setUnits(
          (dbUnits ?? []).map((u) => ({
            id: u.id,
            unitNumber: u.label,
            // DbUnit doesn't currently return house_type/deposit/service_charge —
            // defaulted here until the backend includes them.
            houseType: ((u as any).house_type ?? "Bedsitter") as HouseType,
            rent: u.monthly_rent ?? 0,
            deposit: (u as any).deposit ?? 0,
            serviceCharge: (u as any).service_charge ?? 0,
            status: u.is_vacant ? "vacant" : "occupied",
          })),
        );
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Failed to load property.");
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const addUnit = () =>
    setUnits((u) => [
      ...u,
      { id: crypto.randomUUID(), unitNumber: "", houseType: "Bedsitter", rent: 0, deposit: 0, serviceCharge: 0, status: "vacant" },
    ]);
  const removeUnit = (uid: string) => setUnits((u) => u.filter((x) => x.id !== uid));
  const updateUnit = (uid: string, patch: Partial<Unit>) =>
    setUnits((u) => u.map((x) => (x.id === uid ? { ...x, ...patch } : x)));

  const toggleAmenity = (a: string) =>
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const IMAGE_EXT_RE = /\.(jpe?g|png|gif|webp|bmp|heic|heif|avif|tiff?)$/i;
  function looksLikeImage(file: File) {
    if (file.type.startsWith("image/")) return true;
    if (!file.type && IMAGE_EXT_RE.test(file.name)) return true;
    return false;
  }

  const onCoverSelect = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!looksLikeImage(file)) {
      toast.error("Cover photo must be an image.");
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setCoverRemoved(false);
  };

  const removeCover = () => {
    setCoverFile(null);
    setCoverPreview("");
    setExistingCoverUrl(null);
    setCoverRemoved(true);
  };

  const onGallerySelect = (files: FileList | null) => {
    if (!files) return;
    const imgs = Array.from(files).filter(looksLikeImage);
    if (imgs.length !== files.length) {
      toast.error("Only image files are allowed in the gallery.");
    }
    setGalleryFiles((prev) => [...prev, ...imgs]);
    setGalleryPreviews((prev) => [...prev, ...imgs.map((f) => URL.createObjectURL(f))]);
  };

  const removeExistingGalleryImage = (idx: number) =>
    setExistingGallery((prev) => prev.filter((_, i) => i !== idx));

  const removeNewGalleryImage = (idx: number) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== idx));
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const onVideoSelect = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a video file.");
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      toast.error("Video must be under 200MB.");
      return;
    }
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setVideoRemoved(false);
  };

  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreview("");
    setExistingVideoUrl(null);
    setVideoRemoved(true);
  };

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      if (videoPreview) URL.revokeObjectURL(videoPreview);
      galleryPreviews.forEach((p) => URL.revokeObjectURL(p));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) {
      toast.error("You must be signed in.");
      return;
    }
    if (!name || !county || units.length === 0) {
      toast.error("Property name, county, and at least one unit are required.");
      return;
    }

    setSubmitting(true);
    try {
      const [newCoverUrl, newGalleryUrls, newVideoUrl] = await Promise.all([
        coverFile ? uploadPropertyMedia(coverFile, `${profile.id}/cover`) : Promise.resolve(null),
        Promise.all(galleryFiles.map((f) => uploadPropertyMedia(f, `${profile.id}/gallery`))),
        videoFile ? uploadPropertyMedia(videoFile, `${profile.id}/video`) : Promise.resolve(null),
      ]);

      const finalCover = newCoverUrl ?? (coverRemoved ? null : existingCoverUrl);
      const finalImages = [...existingGallery, ...newGalleryUrls];
      const finalVideo = newVideoUrl ?? (videoRemoved ? null : existingVideoUrl);

      await updateProperty(id, {
        name,
        description,
        county,
        estate: [town, estate].filter(Boolean).join(" - ") || estate,
        address: street,
        amenities,
        cover_image: finalCover,
        images: finalImages,
        video: finalVideo,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
      });

      const submittedUnits: CreatePropertyUnit[] = units.map((u) => ({
        label: u.unitNumber,
        house_type: u.houseType,
        rent: u.rent,
        status: u.status,
      }));
      await updatePropertyUnits(id, submittedUnits);

      toast.success("Property updated!");
      navigate({ to: "/dashboard/landlord/properties" });
    } catch (err: any) {
      toast.error(err.message || "Could not update listing.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 grid place-items-center text-sm text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading property…
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="p-10 text-center text-sm text-muted-foreground">
        Couldn't load this property. It may have been deleted, or you don't have access to it.
      </div>
    );
  }

  if (verifiedStatus === "unverified") {
    return (
      <div className="p-6 lg:p-10 max-w-3xl mx-auto">
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-8 text-center">
          <ShieldAlert className="h-8 w-8 mx-auto text-destructive" />
          <h1 className="font-display text-xl font-bold mt-4">Verification required</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            You need to complete identity verification before you can update listings.
          </p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/dashboard/landlord/verification">Get verified</Link>
          </Button>
        </div>
      </div>
    );
  }

  const combinedCoverPreview = coverPreview || (coverRemoved ? "" : existingCoverUrl ?? "");
  const combinedVideoPreview = videoPreview || (videoRemoved ? "" : existingVideoUrl ?? "");

  return (
    <form onSubmit={submit} className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
      <header>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Edit property</h1>
        <p className="text-sm text-muted-foreground mt-1">Update the details below and save your changes.</p>
      </header>

      <Section title="Basic information" description="Give tenants an accurate summary.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Property name">
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Green Heights" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Description">
              <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the property, neighbourhood, and highlights…" />
            </Field>
          </div>
        </div>
      </Section>

      <Section title="Photos & video" description="Upload a cover photo, a few gallery photos, and an optional walkthrough video.">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cover photo</Label>
            <UploadDropzone accept="image/*,.heic,.heif" onFiles={onCoverSelect} className="mt-1.5 aspect-video">
              {combinedCoverPreview ? (
                <div className="relative h-full w-full">
                  <img src={combinedCoverPreview} alt="Cover preview" className="h-full w-full object-cover rounded-xl" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCover();
                    }}
                    className="absolute top-2 right-2 rounded-full bg-black/60 text-white p-1 hover:bg-black/80"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <EmptyUploadState icon={<ImageIcon className="h-6 w-6" />} label="Click or drag a cover photo" />
              )}
            </UploadDropzone>
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Walkthrough video (optional)</Label>
            <UploadDropzone accept="video/*" onFiles={onVideoSelect} className="mt-1.5 aspect-video">
              {combinedVideoPreview ? (
                <div className="relative h-full w-full">
                  <video src={combinedVideoPreview} controls className="h-full w-full object-cover rounded-xl bg-black" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeVideo();
                    }}
                    className="absolute top-2 right-2 rounded-full bg-black/60 text-white p-1 hover:bg-black/80"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <EmptyUploadState icon={<Film className="h-6 w-6" />} label="Click or drag a video (max 200MB)" />
              )}
            </UploadDropzone>
          </div>
        </div>

        <div className="mt-6">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Gallery photos</Label>
          <div className="mt-1.5 grid grid-cols-3 sm:grid-cols-5 gap-2">
            {existingGallery.map((url, i) => (
              <div key={`existing-${i}`} className="relative aspect-square rounded-lg overflow-hidden bg-surface border border-border group">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeExistingGalleryImage(i)}
                  className="absolute top-1 right-1 rounded-full bg-black/60 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {galleryPreviews.map((url, i) => (
              <div key={`new-${i}`} className="relative aspect-square rounded-lg overflow-hidden bg-surface border border-border group">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeNewGalleryImage(i)}
                  className="absolute top-1 right-1 rounded-full bg-black/60 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <UploadDropzone accept="image/*,.heic,.heif" multiple onFiles={onGallerySelect} className="aspect-square">
              <EmptyUploadState icon={<Plus className="h-5 w-5" />} label="Add photos" compact />
            </UploadDropzone>
          </div>
        </div>
      </Section>

      <Section title="Location" description="Where can tenants find this property?">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="County"><Input required value={county} onChange={(e) => setCounty(e.target.value)} placeholder="e.g. Nairobi" /></Field>
          <Field label="Town"><Input value={town} onChange={(e) => setTown(e.target.value)} placeholder="e.g. Nairobi" /></Field>
          <Field label="Estate"><Input value={estate} onChange={(e) => setEstate(e.target.value)} placeholder="e.g. Kilimani" /></Field>
          <Field label="Street"><Input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="e.g. Rose Avenue" /></Field>
        </div>

        <GooglePinPicker
          coords={coords}
          onChange={setCoords}
          onReverseGeocode={(parts) => {
            if (parts.county && !county) setCounty(parts.county);
            if (parts.town && !town) setTown(parts.town);
            if (parts.street && !street) setStreet(parts.street);
          }}
        />
      </Section>

      <Section title="Units management" description="Add and manage individual units within this property.">
        <div className="space-y-3">
          {units.map((u) => (
            <div key={u.id} className="grid gap-3 md:grid-cols-[1fr_1.4fr_1fr_1fr_1fr_auto] items-end p-4 rounded-2xl border border-border bg-surface">
              <Field label="Unit #">
                <Input value={u.unitNumber} onChange={(e) => updateUnit(u.id, { unitNumber: e.target.value })} placeholder="A1" />
              </Field>
              <Field label="House type">
                <Select value={u.houseType} onValueChange={(v) => updateUnit(u.id, { houseType: v as HouseType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HOUSE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Rent"><Input type="number" value={u.rent} onChange={(e) => updateUnit(u.id, { rent: +e.target.value })} /></Field>
              <Field label="Deposit"><Input type="number" value={u.deposit} onChange={(e) => updateUnit(u.id, { deposit: +e.target.value })} /></Field>
              <Field label="Status">
                <Select value={u.status} onValueChange={(v) => updateUnit(u.id, { status: v as "vacant" | "occupied" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vacant">Vacant</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeUnit(u.id)} className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addUnit} className="gap-2 rounded-full">
            <Plus className="h-4 w-4" /> Add unit
          </Button>
        </div>
      </Section>

      <Section title="Amenities" description="Select all that apply.">
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map((a) => {
            const active = amenities.includes(a);
            return (
              <button
                type="button"
                key={a}
                onClick={() => toggleAmenity(a)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  active
                    ? "bg-accent text-accent-foreground border-accent"
                    : "bg-card text-foreground border-border hover:bg-muted"
                }`}
              >
                {a}
              </button>
            );
          })}
        </div>
      </Section>

      <div className="flex flex-wrap gap-3 justify-end sticky bottom-4 bg-background/80 backdrop-blur p-3 rounded-2xl border border-border">
        <Button type="submit" className="rounded-full" disabled={submitting}>
          {submitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Saving...
            </span>
          ) : (
            "Save changes"
          )}
        </Button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Free map pin picker — Leaflet + OpenStreetMap (no API key, no cost) */
/* ------------------------------------------------------------------ */

let leafletLoadPromise: Promise<void> | null = null;

function loadLeaflet(): Promise<void> {
  if (typeof window !== "undefined" && (window as any).L) {
    return Promise.resolve();
  }
  if (leafletLoadPromise) return leafletLoadPromise;

  leafletLoadPromise = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-leaflet]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.setAttribute("data-leaflet", "true");
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load the map library"));
    document.head.appendChild(script);
  });

  return leafletLoadPromise;
}

async function reverseGeocodeOsm(lat: number, lng: number) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
  );
  if (!res.ok) throw new Error("Reverse geocode failed");
  const data = await res.json();
  const addr = data.address ?? {};
  return {
    county: addr.county || addr.state,
    town: addr.town || addr.city || addr.suburb,
    street: addr.road,
  };
}

function GooglePinPicker({
  coords,
  onChange,
  onReverseGeocode,
}: {
  coords: { lat: number; lng: number } | null;
  onChange: (c: { lat: number; lng: number }) => void;
  onReverseGeocode?: (parts: { county?: string; town?: string; street?: string }) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObj = useRef<any>(null);
  const markerObj = useRef<any>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const placeMarker = (lat: number, lng: number) => {
    const L = (window as any).L;
    if (!mapObj.current) return;
    if (markerObj.current) {
      markerObj.current.setLatLng([lat, lng]);
    } else {
      markerObj.current = L.marker([lat, lng], { draggable: true }).addTo(mapObj.current);
      markerObj.current.on("dragend", () => {
        const pos = markerObj.current.getLatLng();
        handlePinChange(pos.lat, pos.lng);
      });
    }
    mapObj.current.panTo([lat, lng]);
  };

  const handlePinChange = (lat: number, lng: number) => {
    onChange({ lat, lng });
    if (onReverseGeocode) {
      reverseGeocodeOsm(lat, lng)
        .then(onReverseGeocode)
        .catch(() => {});
    }
  };

  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then(() => {
        if (cancelled || !mapRef.current) return;
        const L = (window as any).L;
        const center = coords ?? DEFAULT_CENTER;
        mapObj.current = L.map(mapRef.current).setView([center.lat, center.lng], coords ? 15 : 12);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(mapObj.current);

        mapObj.current.on("click", (e: any) => {
          const { lat, lng } = e.latlng;
          placeMarker(lat, lng);
          handlePinChange(lat, lng);
        });

        if (coords) placeMarker(coords.lat, coords.lng);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));

    return () => {
      cancelled = true;
      if (mapObj.current) {
        mapObj.current.remove();
        mapObj.current = null;
        markerObj.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation isn't available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        placeMarker(latitude, longitude);
        handlePinChange(latitude, longitude);
      },
      () => toast.error("Couldn't get your location."),
    );
  };

  if (status === "error") {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface aspect-[16/8] grid place-items-center text-center px-6">
        <div>
          <MapPin className="h-8 w-8 mx-auto text-primary" />
          <p className="mt-2 text-sm font-semibold">Map unavailable</p>
          <p className="text-xs text-muted-foreground">Couldn't load the map right now — check your connection and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="relative rounded-2xl overflow-hidden border border-border aspect-[16/8]">
        <div ref={mapRef} className="h-full w-full" />
        {status === "loading" && (
          <div className="absolute inset-0 grid place-items-center bg-surface z-[1000]">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-muted-foreground">
          {coords
            ? `Pin set at ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
            : "Click on the map, or drag the marker, to drop a pin."}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={useMyLocation} className="gap-1.5 rounded-full">
          <LocateFixed className="h-3.5 w-3.5" /> Use my location
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Upload dropzone                                                    */
/* ------------------------------------------------------------------ */

function UploadDropzone({
  accept,
  multiple,
  onFiles,
  children,
  className = "",
}: {
  accept: string;
  multiple?: boolean;
  onFiles: (files: FileList | null) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        onFiles(e.dataTransfer.files);
      }}
      className={`cursor-pointer rounded-xl border-2 border-dashed transition-colors overflow-hidden ${
        dragOver ? "border-primary bg-primary/5" : "border-border bg-surface hover:bg-muted"
      } ${className}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
      {children}
    </div>
  );
}

function EmptyUploadState({ icon, label, compact }: { icon: React.ReactNode; label: string; compact?: boolean }) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-1.5 text-muted-foreground px-3 text-center">
      {icon}
      <span className={compact ? "text-[11px] leading-tight" : "text-xs"}>{label}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Layout helpers                                                     */
/* ------------------------------------------------------------------ */

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4">
        <h2 className="font-display font-bold text-lg">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}