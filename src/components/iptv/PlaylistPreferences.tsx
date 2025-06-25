
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Star, X } from 'lucide-react';

interface PlaylistPreferencesProps {
  userId: string;
}

const AVAILABLE_CATEGORIES = [
  'News', 'Sports', 'Entertainment', 'Movies', 'Kids', 'Music', 
  'Documentary', 'Lifestyle', 'International', 'Premium'
];

const QUALITY_OPTIONS = [
  { value: 'auto', label: 'Auto (Recommended)' },
  { value: 'hd', label: 'HD Quality' },
  { value: 'sd', label: 'SD Quality' },
  { value: 'low', label: 'Low Bandwidth' }
];

export const PlaylistPreferences: React.FC<PlaylistPreferencesProps> = ({ userId }) => {
  const [preferences, setPreferences] = useState({
    favorite_categories: [] as string[],
    blocked_categories: [] as string[],
    preferred_quality: 'auto',
    device_type: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (data && !error) {
        setPreferences({
          favorite_categories: data.favorite_categories || [],
          blocked_categories: data.blocked_categories || [],
          preferred_quality: data.preferred_quality || 'auto',
          device_type: data.device_type || ''
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ...preferences
        });

      if (error) throw error;

      // TODO: Regenerate optimized playlist
      console.log('Preferences saved successfully');
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleFavoriteCategory = (category: string) => {
    setPreferences(prev => ({
      ...prev,
      favorite_categories: prev.favorite_categories.includes(category)
        ? prev.favorite_categories.filter(c => c !== category)
        : [...prev.favorite_categories, category]
    }));
  };

  const toggleBlockedCategory = (category: string) => {
    setPreferences(prev => ({
      ...prev,
      blocked_categories: prev.blocked_categories.includes(category)
        ? prev.blocked_categories.filter(c => c !== category)
        : [...prev.blocked_categories, category]
    }));
  };

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="animate-pulse">Loading preferences...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Playlist Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Favorite Categories */}
        <div>
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" />
            Favorite Categories
          </h3>
          <p className="text-gray-400 text-sm mb-3">
            These categories will appear first in your playlist
          </p>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_CATEGORIES.map(category => (
              <Badge
                key={category}
                variant={preferences.favorite_categories.includes(category) ? "default" : "outline"}
                className={`cursor-pointer transition-colors ${
                  preferences.favorite_categories.includes(category)
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'hover:bg-gray-600'
                }`}
                onClick={() => toggleFavoriteCategory(category)}
              >
                {category}
                {preferences.favorite_categories.includes(category) && (
                  <Star className="w-3 h-3 ml-1" />
                )}
              </Badge>
            ))}
          </div>
        </div>

        {/* Blocked Categories */}
        <div>
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <X className="w-4 h-4 text-red-400" />
            Blocked Categories
          </h3>
          <p className="text-gray-400 text-sm mb-3">
            These categories will be hidden from your playlist
          </p>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_CATEGORIES.map(category => (
              <Badge
                key={category}
                variant={preferences.blocked_categories.includes(category) ? "destructive" : "outline"}
                className="cursor-pointer transition-colors hover:bg-gray-600"
                onClick={() => toggleBlockedCategory(category)}
              >
                {category}
                {preferences.blocked_categories.includes(category) && (
                  <X className="w-3 h-3 ml-1" />
                )}
              </Badge>
            ))}
          </div>
        </div>

        {/* Quality Preference */}
        <div>
          <h3 className="text-white font-semibold mb-3">Stream Quality</h3>
          <Select
            value={preferences.preferred_quality}
            onValueChange={(value) => setPreferences(prev => ({ ...prev, preferred_quality: value }))}
          >
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUALITY_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Save Button */}
        <Button
          onClick={savePreferences}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </CardContent>
    </Card>
  );
};
