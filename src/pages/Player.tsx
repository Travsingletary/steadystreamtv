import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Pause, SkipBack, SkipForward, Volume2, Minimize, Maximize } from "lucide-react";
import VideoPlayer from "@/components/VideoPlayer";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
const Player = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChannel, setCurrentChannel] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [volume, setVolume] = useState(80);
  const {
    toast
  } = useToast();

  // Sample channel list - in a real application, this would come from your IPTV service API
  const channels = [{
    id: 1,
    name: "SteadyStream Sports",
    url: "https://example.com/stream1"
  }, {
    id: 2,
    name: "SteadyStream Movies",
    url: "https://example.com/stream2"
  }, {
    id: 3,
    name: "SteadyStream News",
    url: "https://example.com/stream3"
  }, {
    id: 4,
    name: "SteadyStream Entertainment",
    url: "https://example.com/stream4"
  }, {
    id: 5,
    name: "SteadyStream Kids",
    url: "https://example.com/stream5"
  }];
  const handlePlay = () => {
    if (!currentChannel) {
      toast({
        title: "Select a channel",
        description: "Please select a channel from the list to play"
      });
      return;
    }
    setIsPlaying(!isPlaying);
    toast({
      title: isPlaying ? "Paused" : "Playing",
      description: `${isPlaying ? "Paused" : "Playing"} ${currentChannel}`
    });
  };
  const handleChannelSelect = (url, name) => {
    setCurrentChannel(name);
    toast({
      title: "Channel selected",
      description: `Selected ${name}`
    });
  };
  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };
  const handleVolumeChange = e => {
    setVolume(parseInt(e.target.value));
  };
  return <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-gradient-gold">Web Player</h1>
            <img src="/public/lovable-uploads/290f9a54-2de2-4de6-b9d3-190059bb6e9f.png" alt="SteadyStream Logo" className="h-12 md:h-16" />
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Channel List */}
            <div className="bg-dark-200 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gold">Channels</h2>
                <img src="/public/lovable-uploads/290f9a54-2de2-4de6-b9d3-190059bb6e9f.png" alt="SteadyStream Logo" className="h-8" />
              </div>
              <div className="space-y-2">
                <Input type="text" placeholder="Search channels..." className="bg-dark-300 border-gray-700 mb-4" />
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {channels.map(channel => <div key={channel.id} className={`p-3 rounded-lg cursor-pointer transition-all ${currentChannel === channel.name ? "bg-gold text-black" : "bg-dark-300 hover:bg-dark-100"}`} onClick={() => handleChannelSelect(channel.url, channel.name)}>
                      {channel.name}
                    </div>)}
                </div>
              </div>
            </div>
            
            {/* Video Player */}
            <div className={`${fullscreen ? "fixed inset-0 z-50 bg-black" : "md:col-span-2"}`}>
              <div className="bg-dark-300 rounded-xl overflow-hidden border border-gray-800 tv-glow h-full">
                <div className="aspect-video relative bg-black">
                  {currentChannel ? <VideoPlayer isPlaying={isPlaying} /> : <div className="absolute inset-0 flex items-center justify-center flex-col p-6 text-center px-0 py-0 my-0 mx-0 bg-transparent">
                      <img src="/public/lovable-uploads/290f9a54-2de2-4de6-b9d3-190059bb6e9f.png" alt="SteadyStream Logo" className="w-32 h-32 mb-4 object-cover" />
                      <h3 className="text-xl font-semibold text-gold mb-2">SteadyStream TV Web Player</h3>
                      <p className="text-gray-400">
                        Select a channel from the list to start streaming
                      </p>
                    </div>}
                  
                  {/* Watermark Logo in Player */}
                  {currentChannel && <div className="absolute top-4 right-4 opacity-50">
                      <img src="/public/lovable-uploads/290f9a54-2de2-4de6-b9d3-190059bb6e9f.png" alt="SteadyStream Logo" className="h-8" />
                    </div>}
                </div>
                
                {/* Player Controls */}
                <div className="p-4 bg-dark-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={handlePlay} className="border-gray-700 hover:bg-dark-100">
                        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                      </Button>
                      <Button variant="outline" size="icon" className="border-gray-700 hover:bg-dark-100">
                        <SkipBack size={18} />
                      </Button>
                      <Button variant="outline" size="icon" className="border-gray-700 hover:bg-dark-100">
                        <SkipForward size={18} />
                      </Button>
                    </div>
                    
                    <div className="text-center text-sm flex items-center gap-2">
                      <img src="/public/lovable-uploads/290f9a54-2de2-4de6-b9d3-190059bb6e9f.png" alt="SteadyStream Logo" className="h-5 hidden xs:block" />
                      {currentChannel || "No channel selected"}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="hidden sm:flex items-center gap-2">
                        <Volume2 size={16} />
                        <input type="range" min="0" max="100" value={volume} onChange={handleVolumeChange} className="w-24 accent-gold" />
                      </div>
                      <Button variant="outline" size="icon" onClick={toggleFullscreen} className="border-gray-700 hover:bg-dark-100">
                        {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* User info section */}
          <div className="mt-12 bg-dark-200 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gold">Access on Any Device</h2>
              <img src="/public/lovable-uploads/290f9a54-2de2-4de6-b9d3-190059bb6e9f.png" alt="SteadyStream Logo" className="h-10" />
            </div>
            <p className="text-gray-300 mb-4">
              Enjoy SteadyStream TV on your preferred device. Our web player is perfect for computers and mobile devices,
              while our dedicated apps are available for Fire Stick, Android, and iOS.
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <InfoCard title="10,000+ Channels" description="Access to a vast library of content" showLogo={true} />
              <InfoCard title="HD & 4K Quality" description="Crystal clear streaming quality" showLogo={true} />
              <InfoCard title="24/7 Support" description="Help available whenever you need it" showLogo={true} />
              <InfoCard title="DVR Functions" description="Record and watch later" showLogo={true} />
            </div>
          </div>
        </div>
      </div>
      <FooterSection />
    </div>;
};
const InfoCard = ({
  title,
  description,
  showLogo = false
}) => <div className="bg-dark-300 p-4 rounded-lg border border-gray-700">
    <div className="flex items-center justify-between mb-2">
      <h3 className="font-semibold text-gold">{title}</h3>
      {showLogo && <img src="/public/lovable-uploads/1ef1cff2-803f-48c1-8c26-54512fd8f1b6.png" alt="SteadyStream Logo" className="h-5" />}
    </div>
    <p className="text-gray-400 text-sm">{description}</p>
  </div>;
export default Player;