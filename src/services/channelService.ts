
import { supabase } from "@/integrations/supabase/client";

export interface Channel {
  id: number;
  name: string;
  category: string;
  logo: string;
  url: string;
  description?: string;
  epg_id?: string;
}

// Categories of channels
export const channelCategories = [
  "Sports",
  "Movies",
  "News",
  "Entertainment",
  "Kids",
  "Documentary",
  "Music"
];

// Fetch channels from database or API
export const fetchChannels = async (): Promise<Channel[]> => {
  try {
    // In production, this would fetch from Supabase or an IPTV API
    // For now, we'll use mock data
    return Promise.resolve(mockChannels);
  } catch (error) {
    console.error("Error fetching channels:", error);
    return [];
  }
};

// Fetch a single channel by ID
export const fetchChannelById = async (id: number): Promise<Channel | null> => {
  try {
    const channel = mockChannels.find(c => c.id === id);
    return Promise.resolve(channel || null);
  } catch (error) {
    console.error("Error fetching channel:", error);
    return null;
  }
};

// Mock data for development
export const mockChannels: Channel[] = [
  // Sports
  { id: 1, name: "SteadyStream Sports HD", category: "Sports", logo: "/lovable-uploads/a4f38b34-3525-4484-9579-0ffa490a5613.png", url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8", description: "24/7 sports from around the world" },
  { id: 2, name: "Football TV", category: "Sports", logo: "/lovable-uploads/a4f38b34-3525-4484-9579-0ffa490a5613.png", url: "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8", description: "Soccer matches and highlights" },
  { id: 3, name: "ESPN HD", category: "Sports", logo: "/lovable-uploads/a4f38b34-3525-4484-9579-0ffa490a5613.png", url: "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8", description: "Sports news and live events" },
  { id: 4, name: "Fox Sports", category: "Sports", logo: "/lovable-uploads/a4f38b34-3525-4484-9579-0ffa490a5613.png", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", description: "Premium sports coverage" },
  
  // Movies
  { id: 5, name: "SteadyStream Movies", category: "Movies", logo: "/lovable-uploads/a4f38b34-3525-4484-9579-0ffa490a5613.png", url: "https://d2zihajmogu5jn.cloudfront.net/sintel/master.m3u8", description: "Blockbuster movies 24/7" },
  { id: 6, name: "HBO HD", category: "Movies", logo: "/lovable-uploads/a4f38b34-3525-4484-9579-0ffa490a5613.png", url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8", description: "Premium movies and series" },
  { id: 7, name: "Cinema Channel", category: "Movies", logo: "/lovable-uploads/a4f38b34-3525-4484-9579-0ffa490a5613.png", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", description: "Classic and modern cinema" },
  { id: 8, name: "Action Movies", category: "Movies", logo: "/lovable-uploads/a4f38b34-3525-4484-9579-0ffa490a5613.png", url: "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8", description: "Non-stop action films" },
  
  // News
  { id: 9, name: "SteadyStream News", category: "News", logo: "/lovable-uploads/a4f38b34-3525-4484-9579-0ffa490a5613.png", url: "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8", description: "Breaking news coverage" },
  { id: 10, name: "CNN HD", category: "News", logo: "/lovable-uploads/a4f38b34-3525-4484-9579-0ffa490a5613.png", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", description: "Global news network" },
  { id: 11, name: "BBC World", category: "News", logo: "/lovable-uploads/a4f38b34-3525-4484-9579-0ffa490a5613.png", url: "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8", description: "International news coverage" },
  { id: 12, name: "Sky News", category: "News", logo: "/lovable-uploads/a4f38b34-3525-4484-9579-0ffa490a5613.png", url: "https://d2zihajmogu5jn.cloudfront.net/sintel/master.m3u8", description: "24/7 news programming" },
  
  // Entertainment
  { id: 13, name: "SteadyStream Entertainment", category: "Entertainment", logo: "/lovable-uploads/a4f38b34-3525-4484-9579-0ffa490a5613.png", url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8", description: "General entertainment" },
  { id: 14, name: "Comedy Central", category: "Entertainment", logo: "/lovable-uploads/a4f38b34-3525-4484-9579-0ffa490a5613.png", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", description: "Comedy shows and stand-up" },
  { id: 15, name: "AMC", category: "Entertainment", logo: "/lovable-uploads/a4f38b34-3525-4484-9579-0ffa490a5613.png", url: "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8", description: "Premium drama series" },
  { id: 16, name: "FX", category: "Entertainment", logo: "/lovable-uploads/a4f38b34-3525-4484-9579-0ffa490a5613.png", url: "https://d2zihajmogu5jn.cloudfront.net/sintel/master.m3u8", description: "Award-winning TV shows" }
];
