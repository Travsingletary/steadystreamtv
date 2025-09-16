
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, MonitorPlay, LayoutDashboard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import StreamPlayer from "@/components/StreamPlayer";
import ChannelGrid from "@/components/ChannelGrid";
import ProgramInfo from "@/components/ProgramInfo";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/useFavorites";
import { fetchChannels, Channel } from "@/services/channelService";

const Player = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    loadChannels();
  }, []);

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

  const loadChannels = async () => {
    setIsLoading(true);
    try {
      const channelsData = await fetchChannels();
      setChannels(channelsData);
      
      // Set initial channel (first in the list or first favorite if available)
      if (channelsData.length > 0) {
        const favoriteChannel = channelsData.find(channel => favorites.includes(channel.id));
        setCurrentChannel(favoriteChannel || channelsData[0]);
      }
    } catch (error) {
      console.error("Error loading channels:", error);
      toast({
        title: "Error",
        description: "Failed to load channels",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChannelSelect = (channel: Channel) => {
    setCurrentChannel(channel);
    toast({
      title: "Channel selected",
      description: `Now playing: ${channel.name}`
    });
  };

  const handleToggleFavorite = () => {
    if (currentChannel) {
      toggleFavorite(currentChannel.id);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

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
              
              <ChannelGrid 
                channels={channels}
                selectedChannel={currentChannel}
                onSelectChannel={handleChannelSelect}
                isLoading={isLoading}
              />
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
              
              {!isFullscreen && currentChannel && (
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{currentChannel.name}</h3>
                    <p className="text-gray-400 text-sm">{currentChannel.category}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className={isFavorite(currentChannel.id) ? "text-gold border-gold" : ""}
                    onClick={handleToggleFavorite}
                  >
                    <Heart fill={isFavorite(currentChannel.id) ? "currentColor" : "none"} />
                  </Button>
                </div>
              )}
              
              {!isFullscreen && currentChannel && (
                <ProgramInfo 
                  title={`${currentChannel.name} Programming`}
                  description={currentChannel.description}
                  startTime="Now"
                  endTime="Next: 8:00 PM"
                  category={currentChannel.category}
                />
              )}
            </div>
          </div>
          
          {/* User info section */}
          <div className={`mt-12 bg-dark-200 rounded-xl p-6 border border-gray-800 ${isFullscreen ? 'hidden' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gold">Quick Access</h2>
              <img 
                src="/lovable-uploads/290f9a54-2de2-4de6-b9d3-190059bb6e9f.png" 
                alt="SteadyStream Logo" 
                className="h-10" 
              />
            </div>
            
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <InfoCard 
                icon={<MonitorPlay className="text-gold" />}
                title="My Favorites" 
                description={`${favorites.length} channels saved`} 
                buttonText="View Favorites"
                buttonAction={() => {}}
              />
              <InfoCard 
                icon={<LayoutDashboard className="text-gold" />}
                title="Manage Subscription" 
                description="Subscription details and billing" 
                buttonText="Go to Dashboard"
                buttonLink="/dashboard"
              />
              <InfoCard 
                title="Recently Watched" 
                description="Access your viewing history" 
                buttonText="View History"
                buttonAction={() => {}}
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

const InfoCard = ({ 
  icon, 
  title, 
  description, 
  buttonText, 
  buttonLink,
  buttonAction
}: { 
  icon?: React.ReactNode;
  title: string; 
  description: string;
  buttonText: string;
  buttonLink?: string;
  buttonAction?: () => void;
}) => (
  <div className="bg-dark-300 p-4 rounded-lg border border-gray-700">
    <div className="mb-3">
      {icon && (
        <div className="mb-2">
          {icon}
        </div>
      )}
      <h3 className="font-semibold text-gold">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
    <Button 
      size="sm"
      className="w-full bg-dark-400 hover:bg-dark-500 text-white"
      onClick={buttonLink ? () => window.open(buttonLink, '_blank') : buttonAction}
    >
      {buttonText}
    </Button>
  </div>
);

export default Player;
