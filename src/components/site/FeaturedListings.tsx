import { useQuery } from "@tanstack/react-query";
import { fetchProperties } from "@/lib/keja-api";
import { PropertyCardDB } from "./PropertyCardDB";

export function FeaturedListings() {
  // Same data path as the rest of the app (tenant feed, search, etc) — hits
  // get-properties.php via keja-api, not the old disconnected lib/properties.
  const { data, isLoading, error } = useQuery({
    queryKey: ["properties", "featured"],
    queryFn: () => fetchProperties({ limit: 6, sort: "newest", status: "active" }),
  });

  const properties = data?.rows ?? [];

  if (isLoading) {
    return (
      <div className="py-12 text-center text-gray-500">
        Loading properties...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center text-red-500">
        Couldn't load properties right now. Please try again shortly.
      </div>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Properties</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore our handpicked collection of available houses straight from the database.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map((property) => (
            <PropertyCardDB key={property.id} property={property} />
          ))}
        </div>

        {properties.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No properties found yet.
          </div>
        )}
      </div>
    </section>
  );
}
