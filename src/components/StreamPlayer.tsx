
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Maximize, 
  Minimize,
  RefreshCw,
  Info,
  Layers,
  SkipForward,
  SkipBack
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  profileService,
  ProfileSchemaError,
  ProfilePermissionError,
} from "@/services/profileService";

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
  const [xtreamCredentials, setXtreamCredentials] = useState<any>(null);
  const [showXtreamPlayer, setShowXtreamPlayer] = useState(false);
  const [loadingCredentials, setLoadingCredentials] = useState(false);

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

  // Load XTREAM credentials for current user
  useEffect(() => {
    const loadXtreamCredentials = async () => {
      setLoadingCredentials(true);
      try {
        const { profile } = await profileService.fetchProfile();

        if (profile?.xtream_username && profile?.xtream_password) {
          setXtreamCredentials({
            username: profile.xtream_username,
            password: profile.xtream_password,
          });
        }
      } catch (error) {
        if (error instanceof ProfilePermissionError) {
          console.error("Profile permission error while loading XTREAM credentials", error);
        } else if (error instanceof ProfileSchemaError) {
          console.error("Profile schema error while loading XTREAM credentials", error);
        } else {
          console.error("Error loading XTREAM credentials:", error);
        }
      } finally {
        setLoadingCredentials(false);
      }
    };
    
    loadXtreamCredentials();
  }, []);

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

  const toggleXtreamPlayer = () => {
    setShowXtreamPlayer(!showXtreamPlayer);
  };

  const getXtreamPlayerUrl = () => {
    if (!xtreamCredentials) return null;
    
    const { username, password } = xtreamCredentials;
    const baseUrl = `http://megaott.net/player_api.php?username=${username}&password=${password}`;
    return baseUrl;
  };

  return (
    <div 
      ref={playerRef}
      className={`relative overflow-hidden bg-black ${isFullscreen ? 'fixed inset-0 z-50' : 'w-full rounded-lg h-full'}`}
      onDoubleClick={onToggleFullscreen}
    >
      {showXtreamPlayer ? (
        <div className="w-full h-full">
          <iframe 
            src={`http://megaott.net/player_api.php?username=${xtreamCredentials?.username}&password=${xtreamCredentials?.password}`}
            className="w-full h-full border-0"
            allowFullScreen
          />
          <div className="absolute bottom-4 right-4">
            <Button
              variant="outline"
              size="sm"
              className="bg-black/50 text-white border-gray-700"
              onClick={toggleXtreamPlayer}
            >
              Back to Native Player
            </Button>
          </div>
        </div>
      ) : (
        <>
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
                  
                  <div className="hidden sm:flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-white hover:bg-white/20"
                      onClick={toggleMute}
                    >
                      {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </Button>
                    
                    <div className="w-20 md:w-28">
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
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-white hover:bg-white/20"
                      onClick={handleReload}
                    >
                      <RefreshCw size={18} />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-white hover:bg-white/20 hidden sm:flex"
                    >
                      <SkipBack size={18} />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-white hover:bg-white/20 hidden sm:flex"
                    >
                      <SkipForward size={18} />
                    </Button>
                  </div>
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

          {/* XTREAM Player Option */}
          {xtreamCredentials && !error && !isBuffering && (
            <div className="absolute top-4 right-4 z-20">
              <Button
                variant="outline"
                size="sm"
                className="bg-black/50 text-white border-gray-700"
                onClick={toggleXtreamPlayer}
              >
                Open IPTV Player
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StreamPlayer;
