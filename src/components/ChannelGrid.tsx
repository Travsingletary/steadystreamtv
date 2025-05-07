
import { useState } from "react";
import { Search, PlayCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Channel } from "@/services/channelService";

interface ChannelGridProps {
  channels: Channel[];
  selectedChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  isLoading: boolean;
}

const ChannelGrid = ({
  channels,
  selectedChannel,
  onSelectChannel,
  isLoading
}: ChannelGridProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  // Extract unique categories from channels
  const categories = Array.from(
    new Set(channels.map(channel => channel.category))
  );
  
  // Filter channels based on search and category
  const filteredChannels = channels.filter(channel => {
    const matchesSearch = searchQuery === "" || 
      channel.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || 
      channel.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };
  
  const channelCard = (channel: Channel) => (
    <div 
      key={channel.id} 
      className={`
        flex items-center p-3 rounded-lg cursor-pointer transition-all
        ${selectedChannel?.id === channel.id 
          ? "bg-gold text-black" 
          : "bg-dark-300 hover:bg-dark-100"
        }
      `}
      onClick={() => onSelectChannel(channel)}
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
        <p className={`text-xs ${selectedChannel?.id === channel.id ? "text-black/70" : "text-gray-400"}`}>
          {channel.category}
        </p>
      </div>
      <PlayCircle size={18} className={selectedChannel?.id === channel.id ? "text-black/70" : "text-gray-400"} />
    </div>
  );
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
      </div>
    );
  }
  
  return (
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
    </div>
  );
};

export default ChannelGrid;
