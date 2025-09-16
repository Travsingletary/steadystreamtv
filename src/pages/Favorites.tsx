
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Heart, Tv, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import { Link, useNavigate } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";
import { fetchChannels, Channel } from "@/services/channelService";

const Favorites = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { favorites, removeFavorite } = useFavorites();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadFavoriteChannels();
  }, [favorites]);

  const loadFavoriteChannels = async () => {
    setIsLoading(true);
    try {
      const allChannels = await fetchChannels();
      const favoriteChannels = allChannels.filter(channel => 
        favorites.includes(channel.id)
      );
      setChannels(favoriteChannels);
    } catch (error) {
      console.error("Error loading favorite channels:", error);
      toast({
        title: "Error",
        description: "Failed to load favorite channels",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFavorite = (channelId: number) => {
    removeFavorite(channelId);
  };

  const handleWatchChannel = (channelId: number) => {
    navigate(`/player?channel=${channelId}`);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-700"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="mr-1" size={16} /> Back
            </Button>
            
            <div>
              <h1 className="text-4xl font-bold text-gold mb-2">My Favorites</h1>
              <p className="text-gray-400">
                Your collection of favorite channels
              </p>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
            </div>
          ) : favorites.length === 0 ? (
            <div className="bg-dark-200 rounded-xl p-8 border border-gray-800 text-center">
              <Heart className="mx-auto mb-4 text-gray-500" size={48} />
              <h2 className="text-xl font-semibold mb-2">No Favorites Yet</h2>
              <p className="text-gray-400 mb-6">
                You haven't added any channels to your favorites yet. 
                Browse channels and click the heart icon to add them here.
              </p>
              <Button asChild>
                <Link to="/player">
                  Browse Channels
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {channels.map(channel => (
                <div 
                  key={channel.id}
                  className="bg-dark-200 rounded-lg border border-gray-800 overflow-hidden hover:border-gray-700 transition-colors"
                >
                  <div className="aspect-video bg-dark-300 relative flex items-center justify-center">
                    <img
                      src={channel.logo || "/lovable-uploads/290f9a54-2de2-4de6-b9d3-190059bb6e9f.png"}
                      alt={channel.name}
                      className="h-16 object-contain"
                    />
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-white mb-1">{channel.name}</h3>
                    <p className="text-gray-400 text-sm mb-4">{channel.category}</p>
                    
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1 bg-gold hover:bg-gold/90 text-black"
                        onClick={() => handleWatchChannel(channel.id)}
                      >
                        Watch
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-gray-400 hover:text-red-500"
                        onClick={() => handleRemoveFavorite(channel.id)}
                      >
                        <Heart fill="currentColor" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <FooterSection />
    </div>
  );
};

export default Favorites;
