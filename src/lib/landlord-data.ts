import p1 from "@/assets/property-1.jpg";
import p2 from "@/assets/property-2.jpg";
import p3 from "@/assets/property-3.jpg";
import p4 from "@/assets/property-4.jpg";

export type UnitStatus = "vacant" | "occupied";
export type HouseType =
  | "Bedsitter"
  | "Single Room"
  | "Studio"
  | "One Bedroom"
  | "Two Bedroom"
  | "Maisonette"
  | "Apartment";

export type Unit = {
  id: string;
  unitNumber: string;
  houseType: HouseType;
  rent: number;
  deposit: number;
  serviceCharge: number;
  status: UnitStatus;
};

export type LandlordProperty = {
  id: string;
  name: string;
  cover: string;
  gallery: string[];
  type: HouseType | "Apartment";
  county: string;
  town: string;
  estate: string;
  street: string;
  amenities: string[];
  units: Unit[];
  views: number;
  inquiries: number;
  status: "active" | "draft";
};

export const AMENITIES = [
  "Wi-Fi",
  "Parking",
  "CCTV",
  "Electric Fence",
  "Borehole",
  "Backup Water",
  "Hot Shower",
  "Balcony",
  "Furnished",
  "Security Guard",
  "Garbage Collection",
  "Children's Playground",
  "Lift",
  "Swimming Pool",
  "Gym",
  "Pet Friendly",
];

export const HOUSE_TYPES: HouseType[] = [
  "Apartment",
  "Bedsitter",
  "Single Room",
  "Studio",
  "One Bedroom",
  "Two Bedroom",
  "Maisonette",
];

export const landlordProperties: LandlordProperty[] = [
  {
    id: "gh",
    name: "Green Heights Apartments",
    cover: p1,
    gallery: [p1, p2, p3],
    type: "Apartment",
    county: "Nairobi",
    town: "Nairobi",
    estate: "Kilimani",
    street: "Rose Ave",
    amenities: ["Wi-Fi", "Parking", "CCTV", "Backup Water", "Security Guard"],
    views: 1240,
    inquiries: 22,
    status: "active",
    units: [
      { id: "gh-a1", unitNumber: "A1", houseType: "Bedsitter", rent: 8000, deposit: 8000, serviceCharge: 500, status: "vacant" },
      { id: "gh-a2", unitNumber: "A2", houseType: "Bedsitter", rent: 8000, deposit: 8000, serviceCharge: 500, status: "occupied" },
      { id: "gh-b1", unitNumber: "B1", houseType: "One Bedroom", rent: 13000, deposit: 13000, serviceCharge: 800, status: "vacant" },
      { id: "gh-b2", unitNumber: "B2", houseType: "One Bedroom", rent: 13000, deposit: 13000, serviceCharge: 800, status: "occupied" },
    ],
  },
  {
    id: "wv",
    name: "Westview Court",
    cover: p2,
    gallery: [p2, p3],
    type: "Apartment",
    county: "Nairobi",
    town: "Nairobi",
    estate: "Westlands",
    street: "Ring Rd",
    amenities: ["Wi-Fi", "Lift", "Gym", "Parking"],
    views: 2110,
    inquiries: 41,
    status: "active",
    units: [
      { id: "wv-1", unitNumber: "101", houseType: "Studio", rent: 22000, deposit: 22000, serviceCharge: 1500, status: "occupied" },
      { id: "wv-2", unitNumber: "102", houseType: "One Bedroom", rent: 32000, deposit: 32000, serviceCharge: 1500, status: "occupied" },
      { id: "wv-3", unitNumber: "201", houseType: "Two Bedroom", rent: 55000, deposit: 55000, serviceCharge: 2000, status: "vacant" },
    ],
  },
  {
    id: "lk",
    name: "Lavington Skyline",
    cover: p3,
    gallery: [p3, p4],
    type: "Apartment",
    county: "Nairobi",
    town: "Nairobi",
    estate: "Lavington",
    street: "James Gichuru",
    amenities: ["Swimming Pool", "Gym", "Lift", "CCTV", "Parking"],
    views: 3402,
    inquiries: 60,
    status: "active",
    units: [
      { id: "lk-1", unitNumber: "301", houseType: "Two Bedroom", rent: 65000, deposit: 65000, serviceCharge: 3000, status: "vacant" },
      { id: "lk-2", unitNumber: "302", houseType: "Two Bedroom", rent: 65000, deposit: 65000, serviceCharge: 3000, status: "vacant" },
      { id: "lk-3", unitNumber: "401", houseType: "Maisonette", rent: 120000, deposit: 120000, serviceCharge: 5000, status: "occupied" },
    ],
  },
  {
    id: "kr",
    name: "Karen Family Villas",
    cover: p4,
    gallery: [p4, p1],
    type: "Maisonette",
    county: "Nairobi",
    town: "Nairobi",
    estate: "Karen",
    street: "Marula Ln",
    amenities: ["Parking", "Security Guard", "Pet Friendly", "Borehole"],
    views: 890,
    inquiries: 14,
    status: "active",
    units: [
      { id: "kr-1", unitNumber: "V1", houseType: "Maisonette", rent: 150000, deposit: 300000, serviceCharge: 6000, status: "occupied" },
      { id: "kr-2", unitNumber: "V2", houseType: "Maisonette", rent: 150000, deposit: 300000, serviceCharge: 6000, status: "occupied" },
    ],
  },
];

export const totals = (props: LandlordProperty[]) => {
  const units = props.flatMap((p) => p.units);
  const vacant = units.filter((u) => u.status === "vacant").length;
  const occupied = units.filter((u) => u.status === "occupied").length;
  const income = units.filter((u) => u.status === "occupied").reduce((s, u) => s + u.rent, 0);
  return {
    properties: props.length,
    units: units.length,
    vacant,
    occupied,
    income,
    views: props.reduce((s, p) => s + p.views, 0),
    inquiries: props.reduce((s, p) => s + p.inquiries, 0),
  };
};

export type VisitRequest = {
  id: string;
  tenant: string;
  phone: string;
  email: string;
  propertyId: string;
  unitNumber: string;
  date: string;
  time: string;
  status: "pending" | "accepted" | "declined";
};

export const visitRequests: VisitRequest[] = [
  { id: "v1", tenant: "Amina Wanjiru", phone: "+254 712 345 678", email: "amina@example.com", propertyId: "gh", unitNumber: "A1", date: "2026-07-08", time: "10:00", status: "pending" },
  { id: "v2", tenant: "Brian Otieno", phone: "+254 720 111 222", email: "brian@example.com", propertyId: "lk", unitNumber: "301", date: "2026-07-09", time: "14:30", status: "accepted" },
  { id: "v3", tenant: "Cynthia Mwikali", phone: "+254 733 555 999", email: "cynthia@example.com", propertyId: "wv", unitNumber: "201", date: "2026-07-10", time: "11:00", status: "pending" },
  { id: "v4", tenant: "David Kariuki", phone: "+254 701 000 123", email: "david@example.com", propertyId: "gh", unitNumber: "B1", date: "2026-07-11", time: "16:00", status: "declined" },
];

export type Conversation = {
  id: string;
  name: string;
  avatarInitials: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  propertyId?: string;
  messages: { id: string; from: "me" | "them"; text: string; time: string; read?: boolean }[];
};

export const conversations: Conversation[] = [
  {
    id: "c1",
    name: "Amina Wanjiru",
    avatarInitials: "AW",
    lastMessage: "Is the bedsitter still available?",
    time: "10:24",
    unread: 2,
    online: true,
    propertyId: "gh",
    messages: [
      { id: "m1", from: "them", text: "Hi, I saw your listing on GetKeja.", time: "10:20" },
      { id: "m2", from: "them", text: "Is the bedsitter still available?", time: "10:24" },
    ],
  },
  {
    id: "c2",
    name: "Brian Otieno",
    avatarInitials: "BO",
    lastMessage: "Thanks, confirmed for 2:30pm.",
    time: "Yesterday",
    unread: 0,
    online: false,
    propertyId: "lk",
    messages: [
      { id: "m1", from: "them", text: "Can we schedule a visit?", time: "Yesterday" },
      { id: "m2", from: "me", text: "Sure, tomorrow at 2:30pm works.", time: "Yesterday", read: true },
      { id: "m3", from: "them", text: "Thanks, confirmed for 2:30pm.", time: "Yesterday" },
    ],
  },
  {
    id: "c3",
    name: "Cynthia Mwikali",
    avatarInitials: "CM",
    lastMessage: "Do you allow pets?",
    time: "Mon",
    unread: 1,
    online: true,
    propertyId: "wv",
    messages: [{ id: "m1", from: "them", text: "Do you allow pets?", time: "Mon" }],
  },
];

export type Review = {
  id: string;
  tenant: string;
  rating: number;
  comment: string;
  date: string;
  propertyId: string;
  reply?: string;
};

export const reviews: Review[] = [
  { id: "r1", tenant: "Mary Njeri", rating: 5, comment: "Well maintained property and very responsive landlord.", date: "2026-06-14", propertyId: "gh" },
  { id: "r2", tenant: "Peter Ndegwa", rating: 4, comment: "Great location. Water pressure could be better.", date: "2026-06-02", propertyId: "wv", reply: "Thanks Peter, we're upgrading the pump next month." },
  { id: "r3", tenant: "Grace Achieng", rating: 5, comment: "Loved the amenities. Would recommend!", date: "2026-05-21", propertyId: "lk" },
];

export type Tenant = {
  id: string;
  name: string;
  phone: string;
  email: string;
  propertyId: string;
  unitNumber: string;
  since: string;
  balance: number;
};

export const tenants: Tenant[] = [
  { id: "t1", name: "John Kamau", phone: "+254 712 000 111", email: "john@example.com", propertyId: "gh", unitNumber: "A2", since: "2025-03-01", balance: 0 },
  { id: "t2", name: "Faith Chebet", phone: "+254 722 333 444", email: "faith@example.com", propertyId: "gh", unitNumber: "B2", since: "2024-11-12", balance: 5000 },
  { id: "t3", name: "Samuel Mutua", phone: "+254 733 888 111", email: "sam@example.com", propertyId: "wv", unitNumber: "101", since: "2025-01-20", balance: 0 },
  { id: "t4", name: "Lucy Wambui", phone: "+254 700 222 999", email: "lucy@example.com", propertyId: "wv", unitNumber: "102", since: "2024-08-05", balance: 12000 },
  { id: "t5", name: "Kevin Odhiambo", phone: "+254 711 555 222", email: "kevin@example.com", propertyId: "kr", unitNumber: "V1", since: "2024-05-11", balance: 0 },
];
