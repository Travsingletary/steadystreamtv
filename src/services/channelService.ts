
import { supabase } from "@/integrations/supabase/client";

export interface Channel {
  id: string;
  name: string;
  category: string;
  logo_url?: string;
  stream_url: string;
  description?: string;
  epg_id?: string;
  is_active: boolean;
  sort_order: number;
}

// Categories of channels
export const channelCategories = [
  "News",
  "Sports", 
  "Entertainment",
  "Movies",
  "Kids",
  "Documentary",
  "Music"
];

// Fetch channels from Supabase database
export const fetchChannels = async (): Promise<Channel[]> => {
  try {
    const { data, error } = await supabase
      .from('channels_catalog')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('sort_order')
      .order('name');

    if (error) {
      console.error("Error fetching channels:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching channels:", error);
    return [];
  }
};

// Fetch channels by category
export const fetchChannelsByCategory = async (category: string): Promise<Channel[]> => {
  try {
    const { data, error } = await supabase
      .from('channels_catalog')
      .select('*')
      .eq('is_active', true)
      .eq('category', category)
      .order('sort_order')
      .order('name');

    if (error) {
      console.error("Error fetching channels by category:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching channels by category:", error);
    return [];
  }
};

// Fetch a single channel by ID
export const fetchChannelById = async (id: string): Promise<Channel | null> => {
  try {
    const { data, error } = await supabase
      .from('channels_catalog')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error("Error fetching channel:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching channel:", error);
    return null;
  }
};

// Get logo URL with fallbacks
export const getChannelLogoUrl = (channel: Channel): string => {
  // Priority 1: Use provided logo URL
  if (channel.logo_url && channel.logo_url.trim() !== '') {
    return channel.logo_url;
  }

  // Priority 2: Generate from reliable external sources (Wikipedia)
  const name = channel.name.toLowerCase();
  
  if (name.includes('cnn')) {
    return 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/CNN.svg/200px-CNN.svg.png';
  }
  if (name.includes('fox news')) {
    return 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Fox_News_Channel_logo.svg/200px-Fox_News_Channel_logo.svg.png';
  }
  if (name.includes('espn') && !name.includes('espn2')) {
    return 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ESPN_wordmark.svg/200px-ESPN_wordmark.svg.png';
  }
  if (name.includes('espn2')) {
    return 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/ESPN2_logo.svg/200px-ESPN2_logo.svg.png';
  }
  if (name.includes('hbo')) {
    return 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/HBO_logo.svg/200px-HBO_logo.svg.png';
  }
  if (name.includes('disney')) {
    return 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/2019_Disney_Channel_logo.svg/200px-2019_Disney_Channel_logo.svg.png';
  }
  if (name.includes('discovery')) {
    return 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Discovery_Channel_logo.svg/200px-Discovery_Channel_logo.svg.png';
  }
  if (name.includes('nickelodeon') || name.includes('nick')) {
    return 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Nickelodeon_2009_logo.svg/200px-Nickelodeon_2009_logo.svg.png';
  }
  if (name.includes('bbc')) {
    return 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/BBC_News_2022_%28Alt%29.svg/200px-BBC_News_2022_%28Alt%29.svg.png';
  }
  if (name.includes('fox sports')) {
    return 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/FS1_logo.svg/200px-FS1_logo.svg.png';
  }
  if (name.includes('netflix')) {
    return 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Netflix_icon.svg/200px-Netflix_icon.svg.png';
  }

  // Priority 3: Category-based fallbacks with proper colors
  switch (channel.category) {
    case 'News':
      return 'https://via.placeholder.com/200x200/1e40af/ffffff?text=NEWS';
    case 'Sports':
      return 'https://via.placeholder.com/200x200/059669/ffffff?text=SPORTS';
    case 'Entertainment':
      return 'https://via.placeholder.com/200x200/7c3aed/ffffff?text=ENT';
    case 'Movies':
      return 'https://via.placeholder.com/200x200/dc2626/ffffff?text=MOVIES';
    case 'Kids':
      return 'https://via.placeholder.com/200x200/f59e0b/ffffff?text=KIDS';
    case 'Music':
      return 'https://via.placeholder.com/200x200/ec4899/ffffff?text=MUSIC';
    case 'Documentary':
      return 'https://via.placeholder.com/200x200/16a34a/ffffff?text=DOCS';
    default:
      return 'https://via.placeholder.com/200x200/6b7280/ffffff?text=TV';
  }
};
