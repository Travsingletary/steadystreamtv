
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface TvLogoProps {
  category: string;
}

// This component displays a grid of TV logos from a specific category
const TvLogoGrid = ({ category }: TvLogoProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Map category names to folder names in the GitHub repository
  const categoryToFolder: Record<string, string> = {
    Entertainment: "entertainment",
    Sports: "sports",
    Movies: "movies",
    News: "news",
    Kids: "kids",
    International: "international"
  };

  // Sample logos for each category
  const logosMap: Record<string, string[]> = {
    Entertainment: [
      "hbo", "amc", "fx", "tnt", "usa", "paramount", "showtime", "abc", "nbc", "cbs",
      "bet", "comedy-central", "tbs", "syfy", "bravo", "ae", "tlc", "history"
    ],
    Sports: [
      "espn", "fox-sports", "nbc-sports", "mlb-network", "nfl-network", "nba-tv", 
      "cbs-sports", "golf", "sky-sports", "bein-sports", "dazn", "eurosport"
    ],
    Movies: [
      "hbo", "showtime", "starz", "cinemax", "tmc", "sony-movies", "action-max", 
      "ifc", "sundance", "tcm", "film4", "mgm"
    ],
    News: [
      "cnn", "fox-news", "msnbc", "bbc-world", "al-jazeera", "bloomberg", "cnbc", 
      "sky-news", "euronews", "rt", "france24", "cbs-news"
    ],
    Kids: [
      "disney-channel", "nickelodeon", "cartoon-network", "pbs-kids", "boomerang", 
      "discovery-kids", "baby-tv", "nick-jr", "disney-junior", "universal-kids"
    ],
    International: [
      "star-plus", "zee-tv", "univision", "telemundo", "tv5-monde", "rai", 
      "deutsche-welle", "globo", "tve", "nhk-world", "tvn", "canal+"
    ]
  };

  // Get logos for the current category
  const logos = logosMap[category] || [];
  
  // Filter logos based on search query
  const filteredLogos = searchQuery
    ? logos.filter(logo => logo.toLowerCase().includes(searchQuery.toLowerCase()))
    : logos;

  return (
    <div>
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Search channels..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-dark-300 border-gray-700"
        />
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredLogos.map((logo) => (
          <div 
            key={logo} 
            className="bg-dark-300 rounded-lg flex flex-col items-center justify-center p-3 border border-gray-800 hover:border-gold/30 transition-all duration-300"
          >
            <img 
              src={`/logos/${categoryToFolder[category]}/${logo}.png`} 
              alt={`${logo} logo`} 
              className="h-12 w-auto object-contain mb-2"
              onError={(e) => {
                // Fallback for missing logos
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = "/placeholder.svg";
              }}
            />
            <span className="text-sm text-gray-300 text-center capitalize">
              {logo.split('-').join(' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TvLogoGrid;
