
import { useState } from "react";
import { Button } from "@/components/ui/button";
import TvLogoGrid from "@/components/TvLogoGrid";

// Channel categories
const categories = ["Entertainment", "Sports", "Movies", "News", "Kids", "International"];

const ChannelsSection = () => {
  const [activeCategory, setActiveCategory] = useState("Entertainment");

  return (
    <section id="channels" className="py-16 bg-dark-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Discover Our <span className="text-gradient-gold">Premium Channels</span>
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Explore thousands of channels across various categories. From entertainment to sports, movies to news - we've got you covered.
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? "default" : "outline"}
              className={
                activeCategory === category
                  ? "bg-gold hover:bg-gold-dark text-black"
                  : "border-gray-700 text-gray-300 hover:border-gold hover:text-gold"
              }
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* TV Logo Grid */}
        <div className="opacity-0 animate-fade-in">
          <TvLogoGrid category={activeCategory} />
        </div>

        <div className="text-center mt-10">
          <p className="text-gray-400 mb-4">
            And many more! Our library includes 10,000+ channels from around the world.
          </p>
          <Button variant="outline" className="border-gold text-gold hover:bg-gold/10">
            View All Channels
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ChannelsSection;
