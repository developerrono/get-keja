import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Hero } from "@/components/site/Hero";
import { FeaturedListings } from "@/components/site/FeaturedListings";
import { Categories } from "@/components/site/Categories";
import { HowItWorks } from "@/components/site/HowItWorks";
import { Testimonials } from "@/components/site/Testimonials";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GetKeja — Find Your Next Keja Easily" },
      {
        name: "description",
        content:
          "Search verified rental houses and apartments in Kenya with real-time availability. Bedsitters, studios, apartments and family houses.",
      },
      { property: "og:title", content: "GetKeja — Find Your Next Keja Easily" },
      {
        property: "og:description",
        content:
          "Verified rentals, real-time availability, and an easy way to book house visits.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <FeaturedListings />
        <Categories />
        <HowItWorks />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}
