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

const API_URL = "http://localhost:5000/api";

export async function getProperties(): Promise<Property[]> {
  try {
    const response = await fetch(`${API_URL}/properties`);

    if (!response.ok) {
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getProperty(id: string): Promise<Property | null> {
  try {
    const properties = await getProperties();
    return properties.find((p) => p.id === id) || null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export const formatKsh = (n: number) =>
  "KSh " + n.toLocaleString("en-KE");

/*
 TEMPORARY EXPORT
 Keeps old pages working while we migrate
 to Express + MySQL.
*/
export const properties: Property[] = [];