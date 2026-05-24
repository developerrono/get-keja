import p1 from "@/assets/property-1.jpg";
import p2 from "@/assets/property-2.jpg";
import p3 from "@/assets/property-3.jpg";
import p4 from "@/assets/property-4.jpg";

export type Property = {
  id: string;
  name: string;
  image: string;
  price: number;
  location: string;
  type: "Bedsitter" | "1 Bedroom" | "2 Bedroom" | "3 Bedroom" | "Studio";
  rating: number;
  available: boolean;
  bedrooms: number;
  bathrooms: number;
  area: number;
  amenities: string[];
};

export const properties: Property[] = [
  {
    id: "1",
    name: "Sunrise Heights Bedsitter",
    image: p1,
    price: 12500,
    location: "Kilimani, Nairobi",
    type: "Bedsitter",
    rating: 4.8,
    available: true,
    bedrooms: 1,
    bathrooms: 1,
    area: 28,
    amenities: ["WiFi", "Water", "Security"],
  },
  {
    id: "2",
    name: "Westview One Bedroom",
    image: p2,
    price: 28000,
    location: "Westlands, Nairobi",
    type: "1 Bedroom",
    rating: 4.9,
    available: true,
    bedrooms: 1,
    bathrooms: 1,
    area: 45,
    amenities: ["WiFi", "Parking", "Gym", "Security"],
  },
  {
    id: "3",
    name: "Lavington Skyline 2BR",
    image: p3,
    price: 55000,
    location: "Lavington, Nairobi",
    type: "2 Bedroom",
    rating: 4.7,
    available: true,
    bedrooms: 2,
    bathrooms: 2,
    area: 78,
    amenities: ["Furnished", "WiFi", "Parking", "Pool"],
  },
  {
    id: "4",
    name: "Karen Family Home",
    image: p4,
    price: 95000,
    location: "Karen, Nairobi",
    type: "3 Bedroom",
    rating: 4.9,
    available: false,
    bedrooms: 3,
    bathrooms: 3,
    area: 180,
    amenities: ["Garden", "Parking", "Security", "Water"],
  },
  {
    id: "5",
    name: "Riverside Studio",
    image: p2,
    price: 22000,
    location: "Riverside, Nairobi",
    type: "Studio",
    rating: 4.6,
    available: true,
    bedrooms: 1,
    bathrooms: 1,
    area: 35,
    amenities: ["WiFi", "Security", "Furnished"],
  },
  {
    id: "6",
    name: "Kileleshwa Court 2BR",
    image: p3,
    price: 48000,
    location: "Kileleshwa, Nairobi",
    type: "2 Bedroom",
    rating: 4.8,
    available: true,
    bedrooms: 2,
    bathrooms: 2,
    area: 72,
    amenities: ["WiFi", "Parking", "Water", "Security"],
  },
];

export const formatKsh = (n: number) =>
  "KSh " + n.toLocaleString("en-KE");
