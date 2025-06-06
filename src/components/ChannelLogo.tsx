
import { useState } from 'react';
import { Channel, getChannelLogoUrl } from '@/services/channelService';

interface ChannelLogoProps {
  channel: Channel;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ChannelLogo = ({ channel, size = 'md', className = '' }: ChannelLogoProps) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12', 
    lg: 'h-16 w-16'
  };

  const logoUrl = getChannelLogoUrl(channel);
  const fallbackUrl = `https://via.placeholder.com/200x200/6b7280/ffffff?text=${encodeURIComponent(channel.name.substring(0, 3).toUpperCase())}`;

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  return (
    <div className={`${sizeClasses[size]} ${className} relative flex items-center justify-center bg-gray-800 rounded overflow-hidden`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin h-4 w-4 border-b-2 border-gold"></div>
        </div>
      )}
      
      <img
        src={imageError ? fallbackUrl : logoUrl}
        alt={`${channel.name} logo`}
        className={`${sizeClasses[size]} object-contain transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />
      
      {/* Fallback text overlay for failed images */}
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-700 text-white text-xs font-bold">
          {channel.name.substring(0, 3).toUpperCase()}
        </div>
      )}
    </div>
  );
};

export default ChannelLogo;
