
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Tv, PlayCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import StreamPlayer from "@/components/StreamPlayer";
import { supabase } from "@/integrations/supabase/client";

const Player = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentChannel, setCurrentChannel] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    fetchChannels();
  }, []);

  useEffect(() => {
    if (channels.length > 0) {
      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(channels.map(channel => channel.category))
      );
      setCategories(uniqueCategories);
      
      // Apply filters
      filterChannels();
    }
  }, [channels, searchQuery, selectedCategory]);

  const checkAuth = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const { data: userData } = await supabase.auth.getUser();
        setUserData(userData.user);
      }
    } catch (error) {
      console.error("Auth check error:", error);
    }
  };

  const fetchChannels = async () => {
    setIsLoading(true);
    
    // For demo purposes, we'll use mock data
    // In a real implementation, this would fetch from Supabase or an IPTV API
    setTimeout(() => {
      const mockChannels = [
        // Sports
        { id: 1, name: "SteadyStream Sports HD", category: "Sports", logo: "/lovable-uploads/a4f38b34-3525-4484-9579-0ffa490a5613.png", url: "https://example.com/sports" },
        { id: 2, name: "Football TV", category: "Sports", logo: "/lovable-uploads/a4f38b34-3525-4484-9579-0ffa490a5613.png", url: "https://example.com/football" },
        { id: 3, name: "ESPN HD", category: "Sports", logo: "/lovable-uploads/a4f38b34-3525-4484-9579-0ffa490a5613.png", url: "https://example.com/espn" },
        { id: 4, name: "Fox Sports", category: "Sports", logo: "/lovable-uploads/a4f38b34-3525-4484-9579-0ffa490a5613.png", url: "https://example.com/fox" },
        
        // Movies
        { id: 5, name: "SteadyStream Movies", category: "Movies", logo: "/lovable-uploads/a4f38b34-3525-4484-9579-0ffa490a5613.png", url: "https://example.com/movies" },
        { id: 6, name: "HBO HD", category: "Movies", logo: "/lovable-uploads/a4f38b34-3525-4484-9579-0ffa490a5613.png", url: "https://example.com/hbo" },
        { id: 7, name: "Cinema Channel", category: "Movies", logo: "/lovable-uploads/a4f38b34-3525-4484-9579-0ffa490a5613.png", url: "https://example.com/cinema" },
        { id: 8, name: "Action Movies", category: "Movies", logo: "/lovable-uploads/a4f38b34-3525-4484-9579-0ffa490a5613.png", url: "https://example.com/action" },
        
        // News
        { id: 9, name: "SteadyStream News", category: "News", logo: "/lovable-uploads/a4f38b34-3525-4484-9579-0ffa490a5613.png", url: "https://example.com/news" },
        { id: 10, name: "CNN HD", category: "News", logo: "/lovable-uploads/a4f38b34-3525-4484-9579-0ffa490a5613.png", url: "https://example.com/cnn" },
        { id: 11, name: "BBC World", category: "News", logo: "/lovable-uploads/a4f38b34-3525-4484-9579-0ffa490a5613.png", url: "https://example.com/bbc" },
        { id: 12, name: "Sky News", category: "News", logo: "/lovable-uploads/a4f38b34-3525-4484-9579-0ffa490a5613.png", url: "https://example.com/sky" },
        
        // Entertainment
        { id: 13, name: "SteadyStream Entertainment", category: "Entertainment", logo: "/lovable-uploads/a4f38b34-3525-4484-9579-0ffa490a5613.png", url: "https://example.com/ent" },
        { id: 14, name: "Comedy Central", category: "Entertainment", logo: "/lovable-uploads/a4f38b34-3525-4484-9579-0ffa490a5613.png", url: "https://example.com/comedy" },
        { id: 15, name: "AMC", category: "Entertainment", logo: "/lovable-uploads/a4f38b34-3525-4484-9579-0ffa490a5613.png", url: "https://example.com/amc" },
        { id: 16, name: "FX", category: "Entertainment", logo: "/lovable-uploads/a4f38b34-3525-4484-9579-0ffa490a5613.png", url: "https://example.com/fx" }
      ];
      
      setChannels(mockChannels);
      setFilteredChannels(mockChannels);
      setIsLoading(false);
    }, 1000);
  };

  const filterChannels = () => {
    let filtered = [...channels];
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(channel => 
        channel.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(channel => 
        channel.category === selectedCategory
      );
    }
    
    setFilteredChannels(filtered);
  };

  const handleChannelSelect = (channel) => {
    setCurrentChannel(channel);
    toast({
      title: "Channel selected",
      description: `Now playing: ${channel.name}`
    });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const channelCard = (channel) => (
    <div 
      key={channel.id} 
      className={`
        flex items-center p-3 rounded-lg cursor-pointer transition-all
        ${currentChannel?.id === channel.id 
          ? "bg-gold text-black" 
          : "bg-dark-300 hover:bg-dark-100"
        }
      `}
      onClick={() => handleChannelSelect(channel)}
    >
      <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-dark-400 mr-3">
        <img 
          src={channel.logo || "/lovable-uploads/290f9a54-2de2-4de6-b9d3-190059bb6e9f.png"} 
          alt={channel.name} 
          className="w-full h-full object-contain"
        />
      </div>
      <div className="flex-1 overflow-hidden">
        <p className="font-medium truncate">{channel.name}</p>
        <p className={`text-xs ${currentChannel?.id === channel.id ? "text-black/70" : "text-gray-400"}`}>
          {channel.category}
        </p>
      </div>
      <PlayCircle size={18} className={currentChannel?.id === channel.id ? "text-black/70" : "text-gray-400"} />
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gold mb-2">IPTV Player</h1>
              <p className="text-gray-400">
                Stream your favorite channels with SteadyStream TV
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Channel List */}
            <div className={`bg-dark-200 rounded-xl p-4 border border-gray-800 ${isFullscreen ? 'hidden' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gold">Channels</h2>
                <img 
                  src="/lovable-uploads/290f9a54-2de2-4de6-b9d3-190059bb6e9f.png" 
                  alt="SteadyStream Logo" 
                  className="h-8" 
                />
              </div>
              
              <div className="space-y-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input 
                    type="text" 
                    placeholder="Search channels..." 
                    className="bg-dark-300 border-gray-700 pl-10"
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button
                    size="sm"
                    variant={selectedCategory === "all" ? "default" : "outline"}
                    className={selectedCategory === "all" ? "bg-gold text-black hover:bg-gold/90" : ""}
                    onClick={() => handleCategoryChange("all")}
                  >
                    All
                  </Button>
                  
                  {categories.map(category => (
                    <Button
                      key={category}
                      size="sm"
                      variant={selectedCategory === category ? "default" : "outline"}
                      className={selectedCategory === category ? "bg-gold text-black hover:bg-gold/90" : ""}
                      onClick={() => handleCategoryChange(category)}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
                
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
                  </div>
                ) : (
                  <div className="max-h-[calc(100vh-350px)] overflow-y-auto space-y-2 pr-1">
                    {filteredChannels.length > 0 ? (
                      filteredChannels.map(channel => channelCard(channel))
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <Tv size={48} className="mx-auto mb-3 opacity-30" />
                        <p>No channels found</p>
                        <p className="text-sm">Try adjusting your search</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Video Player */}
            <div className={isFullscreen ? "fixed inset-0 z-50 bg-black" : "md:col-span-2"}>
              <div className="bg-dark-300 rounded-xl overflow-hidden border border-gray-800 tv-glow h-full">
                <StreamPlayer
                  url={currentChannel?.url}
                  title={currentChannel?.name}
                  isFullscreen={isFullscreen}
                  onToggleFullscreen={toggleFullscreen}
                />
              </div>
            </div>
          </div>
          
          {/* User info section */}
          <div className={`mt-12 bg-dark-200 rounded-xl p-6 border border-gray-800 ${isFullscreen ? 'hidden' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gold">IPTV Reseller Package</h2>
              <img 
                src="/lovable-uploads/290f9a54-2de2-4de6-b9d3-190059bb6e9f.png" 
                alt="SteadyStream Logo" 
                className="h-10" 
              />
            </div>
            
            <p className="text-gray-300 mb-4">
              Welcome to your IPTV reseller package. You can access and manage your subscription, add customers, and view your credits from the dashboard.
            </p>
            
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
              <InfoCard 
                title="Manage Customers" 
                description="Add and manage customer subscriptions" 
                buttonText="Go to Dashboard"
                buttonLink="/dashboard"
              />
              <InfoCard 
                title="Purchase Credits" 
                description="Get credits to add more customers" 
                buttonText="Buy Credits"
                buttonLink="/dashboard?tab=credits"
              />
              <InfoCard 
                title="Need Help?" 
                description="Contact our 24/7 support team" 
                buttonText="Contact Support"
                buttonLink="#"
              />
            </div>
          </div>
        </div>
      </div>
      
      {!isFullscreen && <FooterSection />}
    </div>
  );
};

const InfoCard = ({ title, description, buttonText, buttonLink }) => (
  <div className="bg-dark-300 p-4 rounded-lg border border-gray-700">
    <div className="mb-3">
      <h3 className="font-semibold text-gold">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
    <Button 
      size="sm"
      className="w-full bg-dark-400 hover:bg-dark-500 text-white"
      onClick={() => window.location.href = buttonLink}
    >
      {buttonText}
    </Button>
  </div>
);

export default Player;
