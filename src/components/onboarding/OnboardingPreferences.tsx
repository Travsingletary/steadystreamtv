
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";

interface UserData {
  name: string;
  email: string;
  preferredDevice: string;
  genres: string[];
  subscription: any;
}

interface OnboardingPreferencesProps {
  userData: UserData;
  updateUserData: (data: Partial<UserData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const genres = [
  {
    id: "movies",
    name: "Movies",
    options: ["Action", "Comedy", "Drama", "Sci-Fi", "Horror", "Documentary", "Thriller"]
  },
  {
    id: "tv-shows",
    name: "TV Shows",
    options: ["Drama Series", "Sitcoms", "Reality TV", "Documentaries", "Crime", "Fantasy"]
  },
  {
    id: "sports",
    name: "Sports",
    options: ["Football", "Basketball", "Soccer", "Tennis", "MMA/Boxing", "Motorsports"]
  },
  {
    id: "kids",
    name: "Kids & Family",
    options: ["Cartoons", "Educational", "Family Movies", "Animated Shows"]
  }
];

export const OnboardingPreferences = ({ 
  userData, 
  updateUserData, 
  onNext, 
  onBack 
}: OnboardingPreferencesProps) => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>(userData.genres || []);
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handleContinue = () => {
    if (selectedGenres.length === 0) {
      toast.error("Please select at least one preference");
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI playlist generation
    setTimeout(() => {
      updateUserData({ genres: selectedGenres });
      setIsGenerating(false);
      toast.success("Personalized playlists have been created based on your preferences!");
      onNext();
    }, 2000);
  };

  return (
    <div className="bg-dark-200 rounded-xl border border-gray-800 p-8 animate-fade-in">
      <h1 className="text-3xl font-bold mb-2">Content Preferences</h1>
      <p className="text-gray-400 mb-6">
        Tell us what you enjoy watching and we'll create personalized recommendations and playlists for you.
      </p>

      <div className="mb-8">
        {genres.map((genreCategory) => (
          <div key={genreCategory.id} className="mb-6">
            <h3 className="text-xl font-medium mb-3">{genreCategory.name}</h3>
            <div className="flex flex-wrap gap-3">
              {genreCategory.options.map((option) => (
                <button
                  key={option}
                  className={`px-4 py-2 rounded-full border text-sm transition-all ${
                    selectedGenres.includes(option)
                      ? "border-gold bg-gold/20 text-gold"
                      : "border-gray-700 text-gray-300 hover:border-gray-500"
                  }`}
                  onClick={() => toggleGenre(option)}
                >
                  {option}
                  {selectedGenres.includes(option) && (
                    <CheckCircle className="inline-block ml-2 h-3.5 w-3.5" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-sm text-gray-400 mb-6">
        <p>Selected: {selectedGenres.length} {selectedGenres.length === 1 ? 'category' : 'categories'}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          variant="outline"
          className="border-gray-700 text-gray-300"
          onClick={onBack}
        >
          Back
        </Button>
        <Button 
          className="bg-gold hover:bg-gold-dark text-black font-semibold flex-1"
          onClick={handleContinue}
          disabled={isGenerating}
        >
          {isGenerating ? "Generating Your Playlists..." : "Continue"}
        </Button>
      </div>
    </div>
  );
};
