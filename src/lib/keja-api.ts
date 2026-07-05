import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type DbProperty = Database["public"]["Tables"]["properties"]["Row"];
export type DbUnit = Database["public"]["Tables"]["property_units"]["Row"];
export type DbFavorite = Database["public"]["Tables"]["favorites"]["Row"];
export type DbVisit = Database["public"]["Tables"]["visits"]["Row"];
export type DbReview = Database["public"]["Tables"]["reviews"]["Row"];
export type DbNotification = Database["public"]["Tables"]["notifications"]["Row"];
export type DbConversation = Database["public"]["Tables"]["conversations"]["Row"];
export type DbMessage = Database["public"]["Tables"]["messages"]["Row"];
export type DbTenantPrefs = Database["public"]["Tables"]["tenant_preferences"]["Row"];
export type DbVerification = Database["public"]["Tables"]["landlord_verifications"]["Row"];
export type DbReport = Database["public"]["Tables"]["reports"]["Row"];

export const KENYA_COUNTIES = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Kiambu", "Machakos",
  "Uasin Gishu", "Kajiado", "Kilifi", "Nyeri",
];

export const HOUSE_TYPES = [
  "Bedsitter", "Studio", "1 Bedroom", "2 Bedroom", "3 Bedroom", "4 Bedroom", "Maisonette", "Bungalow",
] as const;

export const AMENITY_OPTIONS = [
  "WiFi", "Parking", "Water", "Security", "Furnished", "Balcony", "Gym",
  "Swimming Pool", "Pet Friendly", "Elevator", "Backup Generator", "CCTV",
];

export const formatKsh = (n: number | null | undefined) =>
  n == null ? "—" : "KSh " + Number(n).toLocaleString("en-KE");

export type PropertyFilters = {
  q?: string;
  county?: string;
  estate?: string;
  house_types?: string[];
  min_price?: number;
  max_price?: number;
  bedrooms?: number | null;
  bathrooms?: number | null;
  amenities?: string[];
  move_in?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "rating";
  limit?: number;
  offset?: number;
};

export async function fetchProperties(filters: PropertyFilters = {}) {
  let q = supabase.from("properties").select("*", { count: "exact" }).eq("status", "active");
  if (filters.q) q = q.or(`name.ilike.%${filters.q}%,estate.ilike.%${filters.q}%,address.ilike.%${filters.q}%`);
  if (filters.county) q = q.eq("county", filters.county);
  if (filters.estate) q = q.ilike("estate", `%${filters.estate}%`);
  if (filters.house_types?.length) q = q.in("house_type", filters.house_types);
  if (filters.min_price != null) q = q.gte("monthly_rent", filters.min_price);
  if (filters.max_price != null) q = q.lte("monthly_rent", filters.max_price);
  if (filters.bedrooms != null) q = q.gte("bedrooms", filters.bedrooms);
  if (filters.bathrooms != null) q = q.gte("bathrooms", filters.bathrooms);
  if (filters.amenities?.length) q = q.contains("amenities", filters.amenities);
  switch (filters.sort) {
    case "price_asc": q = q.order("monthly_rent", { ascending: true }); break;
    case "price_desc": q = q.order("monthly_rent", { ascending: false }); break;
    case "rating": q = q.order("average_rating", { ascending: false }); break;
    default: q = q.order("created_at", { ascending: false });
  }
  const limit = filters.limit ?? 12;
  const offset = filters.offset ?? 0;
  q = q.range(offset, offset + limit - 1);
  const { data, count, error } = await q;
  if (error) throw error;
  return { rows: (data ?? []) as DbProperty[], count: count ?? 0 };
}

export async function fetchPropertyById(id: string) {
  const [p, units, reviews] = await Promise.all([
    supabase.from("properties").select("*").eq("id", id).maybeSingle(),
    supabase.from("property_units").select("*").eq("property_id", id),
    supabase.from("reviews").select("*").eq("property_id", id).eq("status", "active").order("created_at", { ascending: false }),
  ]);
  if (p.error) throw p.error;
  if (!p.data) return null;
  // fetch landlord profile
  const { data: landlord } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, is_verified, business_name")
    .eq("id", p.data.landlord_id)
    .maybeSingle();
  // bump views
  await supabase.rpc("noop_dummy" as never).catch(() => {});
  await supabase.from("properties").update({ views_count: (p.data.views_count ?? 0) + 1 }).eq("id", id);
  return {
    property: p.data as DbProperty,
    units: (units.data ?? []) as DbUnit[],
    reviews: (reviews.data ?? []) as DbReview[],
    landlord,
  };
}

export async function listFavorites(userId: string) {
  const { data, error } = await supabase
    .from("favorites")
    .select("*, properties(*)")
    .eq("user_id", userId);
  if (error) throw error;
  return data ?? [];
}

export async function toggleFavorite(userId: string, propertyId: string) {
  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId).eq("property_id", propertyId).maybeSingle();
  if (existing) {
    await supabase.from("favorites").delete().eq("id", existing.id);
    return false;
  }
  await supabase.from("favorites").insert({ user_id: userId, property_id: propertyId });
  return true;
}

export async function fetchTenantPrefs(userId: string) {
  const { data } = await supabase.from("tenant_preferences").select("*").eq("user_id", userId).maybeSingle();
  return data as DbTenantPrefs | null;
}

export async function upsertTenantPrefs(userId: string, patch: Partial<DbTenantPrefs>) {
  const { data, error } = await supabase
    .from("tenant_preferences")
    .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" })
    .select().maybeSingle();
  if (error) throw error;
  return data as DbTenantPrefs;
}

export async function bookVisit(input: {
  tenant_id: string; property_id: string; unit_id?: string | null;
  scheduled_at: string; notes?: string;
}) {
  const { error } = await supabase.from("visits").insert(input);
  if (error) throw error;
}

export async function listVisits(tenantId: string) {
  const { data, error } = await supabase
    .from("visits")
    .select("*, properties(id, name, cover_image, county, estate)")
    .eq("tenant_id", tenantId)
    .order("scheduled_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function updateVisitStatus(id: string, status: string) {
  const { error } = await supabase.from("visits").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function listNotifications(userId: string) {
  const { data, error } = await supabase
    .from("notifications").select("*").eq("user_id", userId)
    .order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return (data ?? []) as DbNotification[];
}

export async function markNotificationRead(id: string) {
  await supabase.from("notifications").update({ read: true }).eq("id", id);
}

export async function submitReview(input: {
  property_id: string; tenant_id: string; rating: number; body?: string; photos?: string[];
}) {
  const { error } = await supabase.from("reviews").upsert(input, { onConflict: "property_id,tenant_id" });
  if (error) throw error;
}

export async function submitReport(input: {
  reporter_id: string; target_type: "property" | "user" | "review";
  target_id: string; category: string; description?: string;
}) {
  const { error } = await supabase.from("reports").insert(input);
  if (error) throw error;
}

export async function getOrCreateConversation(tenantId: string, landlordId: string, propertyId?: string | null) {
  const { data: existing } = await supabase
    .from("conversations")
    .select("*")
    .eq("tenant_id", tenantId).eq("landlord_id", landlordId)
    .maybeSingle();
  if (existing) return existing as DbConversation;
  const { data, error } = await supabase
    .from("conversations")
    .insert({ tenant_id: tenantId, landlord_id: landlordId, property_id: propertyId ?? null })
    .select().single();
  if (error) throw error;
  return data as DbConversation;
}

export async function listConversations(userId: string) {
  const { data, error } = await supabase
    .from("conversations")
    .select("*, properties(id, name, cover_image), tenant:profiles!conversations_tenant_id_fkey(id, full_name, avatar_url), landlord:profiles!conversations_landlord_id_fkey(id, full_name, avatar_url)")
    .or(`tenant_id.eq.${userId},landlord_id.eq.${userId}`)
    .order("last_message_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listMessages(conversationId: string) {
  const { data, error } = await supabase.from("messages")
    .select("*").eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DbMessage[];
}

export async function sendMessage(conversationId: string, senderId: string, body: string, imageUrl?: string) {
  const { error } = await supabase.from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, body, image_url: imageUrl ?? null });
  if (error) throw error;
  await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conversationId);
}

/* Admin helpers */

export async function adminStats() {
  const [users, roles, properties, verifs, reports, reviews] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("user_roles").select("role"),
    supabase.from("properties").select("id, status", { count: "exact" }),
    supabase.from("landlord_verifications").select("status"),
    supabase.from("reports").select("status", { count: "exact", head: false }),
    supabase.from("reviews").select("id", { count: "exact", head: true }),
  ]);
  const roleCounts = (roles.data ?? []).reduce<Record<string, number>>((a, r) => {
    a[r.role] = (a[r.role] ?? 0) + 1; return a;
  }, {});
  const propStatus = (properties.data ?? []).reduce<Record<string, number>>((a, p) => {
    a[p.status] = (a[p.status] ?? 0) + 1; return a;
  }, {});
  const verifStatus = (verifs.data ?? []).reduce<Record<string, number>>((a, v) => {
    a[v.status] = (a[v.status] ?? 0) + 1; return a;
  }, {});
  return {
    totalUsers: users.count ?? 0,
    totalLandlords: (roleCounts.landlord ?? 0) + (roleCounts.verified_landlord ?? 0),
    verifiedLandlords: roleCounts.verified_landlord ?? 0,
    pendingVerifications: verifStatus.pending ?? 0,
    totalProperties: properties.count ?? 0,
    activeListings: propStatus.active ?? 0,
    flaggedListings: propStatus.hidden ?? 0,
    openReports: (reports.data ?? []).filter((r) => r.status === "open").length,
    totalReviews: reviews.count ?? 0,
  };
}

export async function adminListUsers() {
  const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
  const { data: roles } = await supabase.from("user_roles").select("user_id, role");
  const byId = new Map<string, string[]>();
  (roles ?? []).forEach((r) => {
    const arr = byId.get(r.user_id) ?? [];
    arr.push(r.role); byId.set(r.user_id, arr);
  });
  return (data ?? []).map((u) => ({ ...u, roles: byId.get(u.id) ?? [] }));
}

export async function adminListVerifications() {
  const { data } = await supabase
    .from("landlord_verifications")
    .select("*, landlord:profiles!landlord_verifications_landlord_id_fkey(id, full_name, email, avatar_url, phone)")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function adminUpdateVerification(id: string, patch: Partial<DbVerification>, reviewerId: string) {
  const { error } = await supabase.from("landlord_verifications")
    .update({ ...patch, reviewed_by: reviewerId, reviewed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function adminListReports() {
  const { data } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
  return (data ?? []) as DbReport[];
}

export async function adminUpdateReport(id: string, patch: Partial<DbReport>) {
  const { error } = await supabase.from("reports").update(patch).eq("id", id);
  if (error) throw error;
}

export async function adminListProperties() {
  const { data } = await supabase.from("properties").select("*").order("created_at", { ascending: false });
  return (data ?? []) as DbProperty[];
}

export async function adminUpdateProperty(id: string, patch: Partial<DbProperty>) {
  const { error } = await supabase.from("properties").update(patch).eq("id", id);
  if (error) throw error;
}

export async function adminListReviews() {
  const { data } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
  return (data ?? []) as DbReview[];
}

export async function adminUpdateReviewStatus(id: string, status: "active" | "hidden" | "deleted") {
  const { error } = await supabase.from("reviews").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function adminBroadcast(input: { author_id: string; category: string; title: string; body: string }) {
  const { error } = await supabase.from("admin_announcements").insert(input);
  if (error) throw error;
}
