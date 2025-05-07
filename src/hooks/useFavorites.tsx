
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Channel } from "@/services/channelService";
import { useToast } from "@/hooks/use-toast";

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch favorites from localStorage or database
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        setIsLoading(true);
        
        // Try to get user session
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData?.session) {
          // User is logged in, try to get favorites from database
          // In a real app, this would fetch from a favorites table
          // For now, we'll use localStorage as a backup
          const storedFavorites = localStorage.getItem('channelFavorites');
          if (storedFavorites) {
            setFavorites(JSON.parse(storedFavorites));
          }
        } else {
          // User is not logged in, use localStorage only
          const storedFavorites = localStorage.getItem('channelFavorites');
          if (storedFavorites) {
            setFavorites(JSON.parse(storedFavorites));
          }
        }
      } catch (error) {
        console.error("Error loading favorites:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFavorites();
  }, []);

  // Save favorites to localStorage
  const saveFavorites = (updatedFavorites: number[]) => {
    localStorage.setItem('channelFavorites', JSON.stringify(updatedFavorites));
    setFavorites(updatedFavorites);
  };

  // Add a channel to favorites
  const addFavorite = (channelId: number) => {
    if (!favorites.includes(channelId)) {
      const updatedFavorites = [...favorites, channelId];
      saveFavorites(updatedFavorites);
      
      toast({
        title: "Added to favorites",
        description: "Channel has been added to your favorites"
      });
    }
  };

  // Remove a channel from favorites
  const removeFavorite = (channelId: number) => {
    if (favorites.includes(channelId)) {
      const updatedFavorites = favorites.filter(id => id !== channelId);
      saveFavorites(updatedFavorites);
      
      toast({
        title: "Removed from favorites",
        description: "Channel has been removed from your favorites"
      });
    }
  };

  // Check if a channel is in favorites
  const isFavorite = (channelId: number): boolean => {
    return favorites.includes(channelId);
  };

  // Toggle favorite status
  const toggleFavorite = (channelId: number) => {
    if (isFavorite(channelId)) {
      removeFavorite(channelId);
    } else {
      addFavorite(channelId);
    }
  };

  return {
    favorites,
    isLoading,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite
  };
};
