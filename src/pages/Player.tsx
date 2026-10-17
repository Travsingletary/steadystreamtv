import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Heart, MonitorPlay, LayoutDashboard, Tv, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import StreamPlayer from "@/components/StreamPlayer";
import ChannelGrid from "@/components/ChannelGrid";
import ProgramInfo from "@/components/ProgramInfo";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/useFavorites";
import {
  fetchChannelsDetailed,
  Channel,
} from "@/services/channelService";
import { getXtreamCredentials, buildM3uUrl } from "@/services/xtreamService";
import { CONFIG } from "@/services/config";

const Player = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [catalogMessage, setCatalogMessage] = useState<string | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [m3uUrl, setM3uUrl] = useState<string | null>(null);
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
    setCatalogError(null);
    setCatalogMessage(null);
    try {
      const result = await fetchChannelsDetailed();
      setChannels(result.channels);
      setCatalogError(result.error || null);
      setCatalogMessage(result.message || null);
      if (result.playlistUrl) setM3uUrl(result.playlistUrl);

      if (!result.playlistUrl) {
        const creds = await getXtreamCredentials();
        if (creds) setM3uUrl(buildM3uUrl(creds));
      }

      if (result.channels.length > 0) {
        const favoriteChannel = result.channels.find((channel) =>
          favorites.includes(channel.id),
        );
        setCurrentChannel(favoriteChannel || result.channels[0]);
      } else {
        setCurrentChannel(null);
      }
    } catch (error) {
      console.error("Error loading channels:", error);
      toast({
        title: "Error",
        description: "Failed to load channels",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChannelSelect = (channel: Channel) => {
    setCurrentChannel(channel);
    toast({
      title: "Channel selected",
      description: `Now playing: ${channel.name}`,
    });
  };

  const handleToggleFavorite = () => {
    if (currentChannel) {
      toggleFavorite(currentChannel.id);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  const emptyState = !isLoading && channels.length === 0;

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start justify-between mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gold mb-2">IPTV Player</h1>
              <p className="text-gray-400">
                Live Xtream / MegaOTT streams for your SteadyStream account
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="border-gray-700" asChild>
                <Link to="/connect-apps">
                  <Tv className="h-4 w-4 mr-2" />
                  Fire Stick / TiviMate
                </Link>
              </Button>
              <Button
                variant="outline"
                className="border-gray-700"
                onClick={loadChannels}
                disabled={isLoading}
              >
                Refresh catalog
              </Button>
            </div>
          </div>

          {emptyState && (
            <Alert className="mb-6 bg-dark-200 border-gold/40 text-white">
              <Tv className="h-4 w-4" />
              <AlertTitle className="text-gold">No live channels loaded</AlertTitle>
              <AlertDescription className="text-gray-300 space-y-3">
                <p>
                  {catalogMessage ||
                    "Sign in with an active subscription that has MegaOTT / Xtream credentials."}
                </p>
                {catalogError && (
                  <p className="text-xs text-gray-500 font-mono">
                    code: {catalogError}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button asChild className="bg-gold text-black hover:bg-gold/90">
                    <Link to="/connect-apps">Connect Apps / credentials</Link>
                  </Button>
                  <Button asChild variant="outline" className="border-gray-600">
                    <Link to="/dashboard">Dashboard</Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="border-gray-600"
                    onClick={() =>
                      window.open(CONFIG.tivimate.downloadUrl, "_blank")
                    }
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Install TiviMate (interim Fire Stick)
                  </Button>
                </div>
                {m3uUrl && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-400 mb-1">Your M3U URL</p>
                    <code className="block text-xs bg-black/50 p-2 rounded break-all">
                      {m3uUrl}
                    </code>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            <div
              className={`bg-dark-200 rounded-xl p-4 border border-gray-800 ${isFullscreen ? "hidden" : ""}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gold">
                  Channels{channels.length ? ` (${channels.length})` : ""}
                </h2>
              </div>

              <ChannelGrid
                channels={channels}
                selectedChannel={currentChannel}
                onSelectChannel={handleChannelSelect}
                isLoading={isLoading}
              />
            </div>

            <div className={isFullscreen ? "fixed inset-0 z-50 bg-black" : "md:col-span-2"}>
              <div className="bg-dark-300 rounded-xl overflow-hidden border border-gray-800 tv-glow h-full min-h-[280px]">
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
                    className={
                      isFavorite(currentChannel.id)
                        ? "text-gold border-gold"
                        : ""
                    }
                    onClick={handleToggleFavorite}
                  >
                    <Heart
                      fill={
                        isFavorite(currentChannel.id) ? "currentColor" : "none"
                      }
                    />
                  </Button>
                </div>
              )}

              {!isFullscreen && currentChannel && (
                <ProgramInfo
                  title={`${currentChannel.name} Programming`}
                  description={currentChannel.description}
                  startTime="Now"
                  endTime="Live"
                  category={currentChannel.category}
                />
              )}
            </div>
          </div>

          <div
            className={`mt-12 bg-dark-200 rounded-xl p-6 border border-gray-800 ${isFullscreen ? "hidden" : ""}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gold">Quick Access</h2>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <InfoCard
                icon={<MonitorPlay className="text-gold" />}
                title="My Favorites"
                description={`${favorites.length} channels saved`}
                buttonText="View Favorites"
                buttonLink="/favorites"
              />
              <InfoCard
                icon={<LayoutDashboard className="text-gold" />}
                title="Manage Subscription"
                description="Subscription details and billing"
                buttonText="Go to Dashboard"
                buttonLink="/dashboard"
              />
              <InfoCard
                icon={<Tv className="text-gold" />}
                title="TiviMate (Fire Stick)"
                description="Interim TV player — stock TiviMate + your M3U"
                buttonText="Setup guide"
                buttonLink="/connect-apps"
              />
              <InfoCard
                title="Signed in"
                description={
                  userData?.email
                    ? String(userData.email)
                    : "Not signed in — catalog requires auth"
                }
                buttonText="Account"
                buttonLink="/account"
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
  buttonAction,
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
      {icon && <div className="mb-2">{icon}</div>}
      <h3 className="font-semibold text-gold">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
    <Button
      size="sm"
      className="w-full bg-dark-400 hover:bg-dark-500 text-white"
      onClick={
        buttonLink
          ? () => {
              if (buttonLink.startsWith("http")) {
                window.open(buttonLink, "_blank");
              } else {
                window.location.href = buttonLink;
              }
            }
          : buttonAction
      }
    >
      {buttonText}
    </Button>
  </div>
);

export default Player;
