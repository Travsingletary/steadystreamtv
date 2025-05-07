
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { AlertCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TvLogoProps {
  category: string;
}

// This component displays a grid of TV logos from a specific category
const TvLogoGrid = ({ category }: TvLogoProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [logoStatus, setLogoStatus] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [logosChecked, setLogosChecked] = useState(false);
  const { toast } = useToast();

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

  // Load logos and check their status
  useEffect(() => {
    const checkLogos = async () => {
      setIsLoading(true);
      const newLogoStatus: Record<string, boolean> = {};
      
      // Get logos for the current category
      const logos = logosMap[category] || [];
      
      // Check each logo
      for (const logo of logos) {
        try {
          const response = await fetch(`/logos/${categoryToFolder[category]}/${logo}.png`, { method: 'HEAD' });
          newLogoStatus[logo] = response.ok;
        } catch (error) {
          newLogoStatus[logo] = false;
        }
      }
      
      setLogoStatus(newLogoStatus);
      setIsLoading(false);
      setLogosChecked(true);
      
      // Check if any logos were found
      const foundLogosCount = Object.values(newLogoStatus).filter(Boolean).length;
      if (foundLogosCount === 0) {
        toast({
          title: "No logos found",
          description: "Run 'node scripts/download-logos.js' to download channel logos",
          variant: "destructive"
        });
      } else if (foundLogosCount < logos.length / 2) {
        toast({
          title: "Some logos are missing",
          description: "Run 'node scripts/download-logos.js' to download all logos",
          variant: "default"
        });
      }
    };
    
    checkLogos();
  }, [category, toast]);

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
      
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin h-8 w-8 border-b-2 border-gold"></div>
        </div>
      ) : filteredLogos.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No channels found matching "{searchQuery}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredLogos.map((logo) => (
            <div 
              key={logo} 
              className="bg-dark-300 rounded-lg flex flex-col items-center justify-center p-3 border border-gray-800 hover:border-gold/30 transition-all duration-300"
            >
              {logoStatus[logo] ? (
                <img 
                  src={`/logos/${categoryToFolder[category]}/${logo}.png`} 
                  alt={`${logo} logo`} 
                  className="h-12 w-auto object-contain mb-2"
                  onError={(e) => {
                    // Fallback for images that fail to load
                    const target = e.target as HTMLImageElement;
                    target.src = "/lovable-uploads/0951aea1-2e5f-4aa0-9de1-ec13d0eb3489.png";
                  }}
                />
              ) : (
                <div className="h-12 w-full flex items-center justify-center mb-2">
                  <img 
                    src="/lovable-uploads/0951aea1-2e5f-4aa0-9de1-ec13d0eb3489.png" 
                    alt="SteadyStream TV" 
                    className="h-10 w-auto object-contain"
                  />
                </div>
              )}
              <span className="text-sm text-gray-300 text-center capitalize">
                {logo.split('-').join(' ')}
              </span>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-6">
        {logosChecked && Object.values(logoStatus).some(status => !status) ? (
          <div className="flex flex-col gap-3">
            <div className="inline-flex items-center gap-2 bg-dark-300 px-3 py-2 rounded-lg text-sm text-gray-400">
              <AlertCircle className="h-4 w-4 text-gold" />
              <span>Run the download script to get actual channel logos:</span>
            </div>
            <div className="bg-dark-400 p-3 rounded-lg text-sm font-mono overflow-x-auto">
              <code>node scripts/download-logos.js</code>
            </div>
            <div className="inline-flex items-center gap-2 bg-dark-300 px-3 py-2 rounded-lg text-sm text-gray-400">
              <Info className="h-4 w-4 text-blue-400" />
              <span>Logos will be saved to: <code className="bg-dark-500 px-1 py-0.5 rounded">/public/logos/{categoryToFolder[category]}/</code></span>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 text-sm">
            {Object.values(logoStatus).every(status => status) && logosChecked ? 
              "All channel logos loaded successfully" : 
              "Run the download-logos.js script to get actual channel logos"
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default TvLogoGrid;
