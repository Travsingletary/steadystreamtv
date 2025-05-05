
import { useState } from "react";
import { Button } from "@/components/ui/button";

// Channel categories and sample logos
const categories = ["Entertainment", "Sports", "Movies", "News", "Kids", "International"];

// Sample channel data (in real implementation, this would be more comprehensive)
const channelsByCategory = {
  Entertainment: [
    "HBO", "AMC", "FX", "TNT", "USA", "Paramount", "Showtime", "ABC", "NBC", "CBS",
  ],
  Sports: [
    "ESPN", "Fox Sports", "NBC Sports", "MLB Network", "NFL Network", "NBA TV", "CBS Sports", "Golf Channel", "Tennis Channel", "UFC",
  ],
  Movies: [
    "HBO", "Showtime", "Starz", "Cinemax", "The Movie Channel", "Sony Movies", "Action Max", "IFC", "Sundance", "TCM",
  ],
  News: [
    "CNN", "Fox News", "MSNBC", "BBC World", "Al Jazeera", "Bloomberg", "CNBC", "Sky News", "Euronews", "RT",
  ],
  Kids: [
    "Disney Channel", "Nickelodeon", "Cartoon Network", "PBS Kids", "Boomerang", "Discovery Kids", "Baby TV", "Nick Jr.", "Disney Junior", "Universal Kids",
  ],
  International: [
    "Star Plus", "Zee TV", "Univision", "Telemundo", "TV5 Monde", "RAI", "Deutsche Welle", "Globo", "TVE", "NHK World",
  ]
};

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

        {/* Channel grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6 opacity-0 animate-fade-in">
          {channelsByCategory[activeCategory as keyof typeof channelsByCategory].map((channel, index) => (
            <ChannelLogo key={index} name={channel} />
          ))}
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

const ChannelLogo = ({ name }: { name: string }) => (
  <div className="bg-dark-300 rounded-lg flex items-center justify-center h-20 border border-gray-800 hover:border-gold/30 transition-all duration-300">
    <span className="text-lg font-bold text-gradient-gold">{name}</span>
  </div>
);

export default ChannelsSection;
