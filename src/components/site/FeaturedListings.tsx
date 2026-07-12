import { useQuery } from "@tanstack/react-query";
import { getProperties } from "@/lib/properties";
import { PropertyCard } from "./PropertyCard";

export function FeaturedListings() {
  // Fetch live properties from your XAMPP get_listings.php endpoint
  const { data: propertiesList, isLoading, error } = useQuery({
    queryKey: ["properties"],
    queryFn: getProperties,
  });

  if (isLoading) {
    return (
      <div className="py-12 text-center text-gray-500">
        Loading properties from local XAMPP backend...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center text-red-500">
        Failed to connect to local database server.
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
          {propertiesList?.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
        
        {propertiesList?.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No properties found in your database table.
          </div>
        )}
      </div>
    </section>
  );
}