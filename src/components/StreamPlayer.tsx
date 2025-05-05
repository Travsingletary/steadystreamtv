
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Maximize, 
  Minimize,
  RefreshCw,
  Info,
  Layers
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StreamPlayerProps {
  url?: string;
  title?: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const StreamPlayer: React.FC<StreamPlayerProps> = ({ 
  url, 
  title,
  isFullscreen,
  onToggleFullscreen
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [currentQuality, setCurrentQuality] = useState("auto");
  const [isBuffering, setIsBuffering] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hide controls after period of inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const resetTimeout = () => {
      clearTimeout(timeout);
      setShowControls(true);
      
      timeout = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };
    
    playerRef.current?.addEventListener('mousemove', resetTimeout);
    resetTimeout();
    
    return () => {
      clearTimeout(timeout);
      playerRef.current?.removeEventListener('mousemove', resetTimeout);
    };
  }, [isPlaying]);

  // Initialize player when URL changes
  useEffect(() => {
    if (url && videoRef.current) {
      setError(null);
      
      try {
        videoRef.current.src = url;
        videoRef.current.load();
        
        // Auto-play on URL change if previously playing
        if (isPlaying) {
          const playPromise = videoRef.current.play();
          
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.error("Auto-play prevented:", error);
              setIsPlaying(false);
            });
          }
        }
      } catch (err) {
        console.error("Error loading video:", err);
        setError("Failed to load stream. Please try again.");
      }
    }
  }, [url]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      const playPromise = videoRef.current.play();
      
      if (playPromise !== undefined) {
        setIsBuffering(true);
        
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsBuffering(false);
          })
          .catch(error => {
            console.error("Play prevented:", error);
            setIsPlaying(false);
            setIsBuffering(false);
            
            if (error.name === "NotAllowedError") {
              toast({
                title: "Playback blocked",
                description: "Browser prevented autoplay. Please click play to continue."
              });
            } else {
              setError("Failed to play stream. Please try another channel.");
            }
          });
      }
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    
    const newMuteState = !isMuted;
    videoRef.current.muted = newMuteState;
    setIsMuted(newMuteState);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value, 10);
    setVolume(newVolume);
    
    if (videoRef.current) {
      videoRef.current.volume = newVolume / 100;
      setIsMuted(newVolume === 0);
    }
  };

  const handleReload = () => {
    if (!videoRef.current) return;
    
    setError(null);
    setIsBuffering(true);
    
    const currentTime = videoRef.current.currentTime;
    videoRef.current.load();
    
    const playPromise = videoRef.current.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          videoRef.current!.currentTime = currentTime;
          setIsPlaying(true);
          setIsBuffering(false);
        })
        .catch(error => {
          console.error("Reload prevented:", error);
          setIsPlaying(false);
          setIsBuffering(false);
          setError("Failed to reload stream. Please try another channel.");
        });
    }
  };

  const changeQuality = (quality: string) => {
    setCurrentQuality(quality);
    toast({
      title: "Quality changed",
      description: `Stream quality set to ${quality}`
    });
    
    // In a real implementation, this would switch to a different stream URL for the selected quality
    handleReload();
  };

  return (
    <div 
      ref={playerRef}
      className={`relative overflow-hidden bg-black ${isFullscreen ? 'fixed inset-0 z-50' : 'w-full rounded-lg'}`}
      onDoubleClick={onToggleFullscreen}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        controls={false}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onVolumeChange={(e) => {
          const video = e.currentTarget;
          setIsMuted(video.muted);
          setVolume(video.volume * 100);
        }}
        onError={() => {
          setError("Stream error. The channel may be offline or unavailable.");
          setIsPlaying(false);
        }}
      />

      {/* Loading indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
          <RefreshCw className="h-12 w-12 animate-spin text-gold" />
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <Alert variant="destructive" className="w-auto max-w-[80%] bg-red-900/50 border-red-700">
            <Info className="h-5 w-5" />
            <AlertDescription className="text-white">
              {error}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Title bar */}
      {title && showControls && (
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-20">
          <h3 className="text-white font-medium truncate pr-10">{title}</h3>
        </div>
      )}

      {/* Custom controls */}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-t from-black/80 to-transparent z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </Button>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20 hidden sm:flex"
                  onClick={toggleMute}
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </Button>
                
                <div className="hidden sm:block w-20 md:w-28">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-full accent-gold"
                  />
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20"
                onClick={handleReload}
              >
                <RefreshCw size={18} />
              </Button>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3">
              <div className="relative group">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-white hover:bg-white/20 hidden sm:flex items-center gap-1"
                >
                  <Layers size={16} />
                  <span className="text-xs">{currentQuality}</span>
                </Button>
                
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
                  <div className="bg-dark-200 border border-gray-700 rounded-md shadow-lg overflow-hidden">
                    {["auto", "1080p", "720p", "480p", "360p"].map((quality) => (
                      <button
                        key={quality}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-dark-100 ${
                          currentQuality === quality ? 'bg-gold text-black' : 'text-white'
                        }`}
                        onClick={() => changeQuality(quality)}
                      >
                        {quality}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20"
                onClick={onToggleFullscreen}
              >
                {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StreamPlayer;
