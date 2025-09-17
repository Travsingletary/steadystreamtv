
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
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
  SkipBack,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StreamPlayerProps {
  url?: string;
  title?: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

interface XtreamCredentials {
  username: string;
  password: string;
}

const DEFAULT_QUALITY_OPTIONS = ["auto", "1080p", "720p", "480p", "360p"];

type HlsEventsMap = {
  MEDIA_ATTACHED: string;
  MANIFEST_PARSED: string;
  LEVEL_SWITCHED: string;
  ERROR: string;
  FRAG_BUFFERING_START: string;
  FRAG_BUFFERING_END: string;
};

type HlsErrorTypesMap = {
  NETWORK_ERROR: string;
  MEDIA_ERROR: string;
};

interface HlsInstance {
  attachMedia(media: HTMLVideoElement): void;
  loadSource(source: string): void;
  destroy(): void;
  startLoad(startPosition?: number): void;
  recoverMediaError(): void;
  on(event: string, handler: (...args: unknown[]) => void): void;
  levels: Array<{ height?: number }>;
  currentLevel: number;
}

interface HlsConstructor {
  new (config?: Record<string, unknown>): HlsInstance;
  isSupported(): boolean;
  Events: HlsEventsMap;
  ErrorTypes: HlsErrorTypesMap;
}

declare global {
  interface Window {
    Hls?: HlsConstructor;
  }
}

const HLS_LIBRARY_URL = "https://cdn.jsdelivr.net/npm/hls.js@1.5.7/dist/hls.min.js";

let hlsLibraryPromise: Promise<HlsConstructor | null> | null = null;

const loadHlsLibrary = async (): Promise<HlsConstructor | null> => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }

  if (window.Hls) {
    return window.Hls;
  }

  if (!hlsLibraryPromise) {
    hlsLibraryPromise = new Promise((resolve) => {
      const existingScript = document.querySelector<HTMLScriptElement>('script[data-hls-library]');

      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(window.Hls ?? null), { once: true });
        existingScript.addEventListener("error", () => {
          hlsLibraryPromise = null;
          resolve(null);
        }, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = HLS_LIBRARY_URL;
      script.async = true;
      script.dataset.hlsLibrary = "true";
      script.onload = () => resolve(window.Hls ?? null);
      script.onerror = () => {
        hlsLibraryPromise = null;
        resolve(null);
      };
      document.body.appendChild(script);
    });
  }

  return hlsLibraryPromise;
};

const StreamPlayer: React.FC<StreamPlayerProps> = ({ 
  url, 
  title,
  isFullscreen,
  onToggleFullscreen
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsInstance | null>(null);
  const shouldAutoplayRef = useRef(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const latestUrlRef = useRef<string | undefined>(undefined);
  const isComponentMountedRef = useRef(true);
  const { toast } = useToast();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [currentQuality, setCurrentQuality] = useState("auto");
  const [availableQualities, setAvailableQualities] = useState<string[]>(DEFAULT_QUALITY_OPTIONS);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [xtreamCredentials, setXtreamCredentials] = useState<XtreamCredentials | null>(null);
  const [showXtreamPlayer, setShowXtreamPlayer] = useState(false);
  const [loadingCredentials, setLoadingCredentials] = useState(false);

  const xtreamUrl = useMemo(() => {
    if (!xtreamCredentials) return null;
    const params = new URLSearchParams({
      username: xtreamCredentials.username,
      password: xtreamCredentials.password
    });

    return `http://megaott.net/player_api.php?${params.toString()}`;
  }, [xtreamCredentials]);

  useEffect(() => {
    shouldAutoplayRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume / 100;
    }
  }, [volume]);

  const cleanupHlsInstance = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  const initializeStream = useCallback(async (
    streamUrl: string,
    options?: { autoplay?: boolean; startPosition?: number }
  ) => {
    const video = videoRef.current;
    if (!video) return;

    const autoplay = options?.autoplay ?? shouldAutoplayRef.current;
    const startPosition = options?.startPosition;

    const isCurrentSource = () =>
      isComponentMountedRef.current && latestUrlRef.current === streamUrl;

    setIsBuffering(true);
    setError(null);
    setCurrentQuality("auto");

    cleanupHlsInstance();

    const isHlsSource = /\.m3u8($|\?)/i.test(streamUrl);
    const canPlayNativeHls = video.canPlayType("application/vnd.apple.mpegurl") !== "";

    if (!isHlsSource || canPlayNativeHls) {
      if (!isCurrentSource()) return;

      video.src = streamUrl;
      video.load();

      if (typeof startPosition === "number" && startPosition > 0) {
        video.currentTime = startPosition;
      }

      if (autoplay) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              if (!isCurrentSource()) return;
              setIsPlaying(true);
              setIsBuffering(false);
            })
            .catch(error => {
              if (!isCurrentSource()) return;
              console.error("Auto-play prevented:", error);
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
        } else if (isCurrentSource()) {
          setIsPlaying(true);
          setIsBuffering(false);
        }
      } else if (isCurrentSource()) {
        setIsPlaying(false);
        setIsBuffering(false);
      }

      setAvailableQualities(DEFAULT_QUALITY_OPTIONS);
      setCurrentQuality("auto");

      return;
    }

    const hlsModule = await loadHlsLibrary();

    if (!isCurrentSource()) {
      return;
    }

    if (!hlsModule) {
      console.error("Failed to load HLS library for streaming");
      setError("Unable to initialize the streaming engine. Please try again later.");
      setIsBuffering(false);
      setAvailableQualities(DEFAULT_QUALITY_OPTIONS);
      return;
    }

    if (!hlsModule.isSupported()) {
      setError("Your browser does not support this stream format.");
      setIsBuffering(false);
      setAvailableQualities(DEFAULT_QUALITY_OPTIONS);
      return;
    }

    const events = hlsModule.Events;
    const errorTypes = hlsModule.ErrorTypes;

    const hls = new hlsModule({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 60
    });

    if (!isCurrentSource()) {
      hls.destroy();
      return;
    }

    hlsRef.current = hls;

    hls.attachMedia(video);
    hls.loadSource(streamUrl);

    const handleManifestParsed = () => {
      if (!isCurrentSource()) return;

      const qualityLevels = hls.levels
        .map(level => level.height)
        .filter((height): height is number => typeof height === "number")
        .sort((a, b) => b - a)
        .map(height => `${height}p`);

      const uniqueLevels = Array.from(new Set(qualityLevels));
      setAvailableQualities([
        "auto",
        ...(uniqueLevels.length > 0 ? uniqueLevels : DEFAULT_QUALITY_OPTIONS.slice(1))
      ]);

      if (typeof startPosition === "number" && startPosition > 0) {
        video.currentTime = startPosition;
      }

      if (autoplay) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              if (!isCurrentSource()) return;
              setIsPlaying(true);
              setIsBuffering(false);
            })
            .catch(error => {
              if (!isCurrentSource()) return;
              console.error("Auto-play prevented:", error);
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
        } else if (isCurrentSource()) {
          setIsPlaying(true);
          setIsBuffering(false);
        }
      } else if (isCurrentSource()) {
        setIsPlaying(false);
        setIsBuffering(false);
      }
    };

    const handleLevelSwitched = (_: unknown, data: { level: number }) => {
      if (!isCurrentSource()) return;
      const level = hls.levels?.[data.level];
      setCurrentQuality(level?.height ? `${level.height}p` : "auto");
    };

    const handleError = (_: unknown, data: { fatal: boolean; type: string }) => {
      if (!isCurrentSource()) return;
      if (data.fatal) {
        switch (data.type) {
          case errorTypes.NETWORK_ERROR:
            hls.startLoad();
            break;
          case errorTypes.MEDIA_ERROR:
            hls.recoverMediaError();
            break;
          default:
            setError("Failed to load stream. Please try again.");
            setIsBuffering(false);
            cleanupHlsInstance();
        }
      }
    };

    const handleBufferingStart = () => {
      if (!isCurrentSource()) return;
      setIsBuffering(true);
    };

    const handleBufferingEnd = () => {
      if (!isCurrentSource()) return;
      setIsBuffering(false);
    };

    hls.on(events.MANIFEST_PARSED, handleManifestParsed);
    hls.on(events.LEVEL_SWITCHED, handleLevelSwitched);
    hls.on(events.ERROR, handleError);
    hls.on(events.FRAG_BUFFERING_START, handleBufferingStart);
    hls.on(events.FRAG_BUFFERING_END, handleBufferingEnd);
  }, [cleanupHlsInstance, toast]);

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
    
    const node = playerRef.current;
    node?.addEventListener('mousemove', resetTimeout);
    resetTimeout();

    return () => {
      clearTimeout(timeout);
      node?.removeEventListener('mousemove', resetTimeout);
    };
  }, [isPlaying]);

  // Initialize player when URL changes
  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    latestUrlRef.current = url;

    if (!url) {
      cleanupHlsInstance();
      video.pause();
      video.removeAttribute("src");
      video.load();
      setIsPlaying(false);
      setIsBuffering(false);
      setError(null);
      setAvailableQualities(DEFAULT_QUALITY_OPTIONS);
      setCurrentQuality("auto");
      return;
    }

    setShowXtreamPlayer(false);
    void initializeStream(url, { autoplay: shouldAutoplayRef.current });
  }, [cleanupHlsInstance, initializeStream, url]);

  useEffect(() => {
    return () => {
      isComponentMountedRef.current = false;
      cleanupHlsInstance();
    };
  }, [cleanupHlsInstance]);

  // Load XTREAM credentials for current user
  useEffect(() => {
    const loadXtreamCredentials = async () => {
      setLoadingCredentials(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setXtreamCredentials(null);
          return;
        }
        
        const { data, error } = await supabase
          .from('profiles')
          .select('xtream_username, xtream_password')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        if (data?.xtream_username && data?.xtream_password) {
          setXtreamCredentials({
            username: data.xtream_username,
            password: data.xtream_password
          });
        } else {
          setXtreamCredentials(null);
        }
      } catch (error) {
        console.error("Error loading XTREAM credentials:", error);
      } finally {
        setLoadingCredentials(false);
      }
    };
    
    loadXtreamCredentials();
  }, []);

  const togglePlay = () => {
    if (!videoRef.current || showXtreamPlayer) return;

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
    if (!videoRef.current || !url || showXtreamPlayer) return;

    const currentTime = videoRef.current.currentTime;
    void initializeStream(url, {
      autoplay: isPlaying,
      startPosition: isPlaying ? currentTime : undefined
    });
  };

  const changeQuality = (quality: string) => {
    if (quality === currentQuality) return;

    if (quality === "auto") {
      if (hlsRef.current) {
        hlsRef.current.currentLevel = -1;
      }

      setCurrentQuality("auto");
      toast({
        title: "Quality changed",
        description: "Stream quality will adapt automatically."
      });
      return;
    }

    const hls = hlsRef.current;

    if (!hls) {
      toast({
        title: "Quality selection unavailable",
        description: "Manual quality selection is only available for adaptive streams."
      });
      return;
    }

    const levelIndex = hls.levels.findIndex(level => {
      if (!level.height) return false;
      return `${level.height}p` === quality;
    });

    if (levelIndex === -1) {
      toast({
        title: "Quality not available",
        description: "The selected quality is not available for this stream."
      });
      return;
    }

    hls.currentLevel = levelIndex;
    setCurrentQuality(quality);
    toast({
      title: "Quality changed",
      description: `Stream quality set to ${quality}`
    });
  };

  const toggleXtreamPlayer = () => {
    if (!xtreamUrl) {
      toast({
        title: "IPTV player unavailable",
        description: "We couldn't find saved Xtream credentials for your account yet."
      });
      return;
    }

    setShowXtreamPlayer(prev => !prev);
  };

  useEffect(() => {
    if (!videoRef.current) return;

    if (showXtreamPlayer) {
      videoRef.current.pause();
      setIsPlaying(false);
      shouldAutoplayRef.current = false;
      setIsBuffering(false);
    }
  }, [showXtreamPlayer]);

  const isQualitySelectionAvailable = availableQualities.length > 1;

  return (
    <div 
      ref={playerRef}
      className={`relative overflow-hidden bg-black ${isFullscreen ? 'fixed inset-0 z-50' : 'w-full rounded-lg h-full'}`}
      onDoubleClick={onToggleFullscreen}
    >
      {showXtreamPlayer ? (
        <div className="w-full h-full">
          <iframe
            src={xtreamUrl ?? undefined}
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

          {/* Placeholder when no channel is selected */}
          {!url && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 text-center z-10 px-6">
              <p className="text-white text-lg font-semibold">Select a channel to start watching</p>
              <p className="text-white/70 text-sm max-w-md">
                Choose a channel from the list to begin streaming. Your player controls will appear once playback starts.
              </p>
            </div>
          )}

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
                  <div className={`relative ${isQualitySelectionAvailable ? 'group' : ''}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!isQualitySelectionAvailable}
                      className={`text-white hidden sm:flex items-center gap-1 ${
                        isQualitySelectionAvailable ? 'hover:bg-white/20' : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <Layers size={16} />
                      <span className="text-xs">{currentQuality}</span>
                    </Button>

                    <div className={`absolute bottom-full right-0 mb-2 ${
                      isQualitySelectionAvailable ? 'hidden group-hover:block' : 'hidden'
                    }`}>
                      <div className="bg-dark-200 border border-gray-700 rounded-md shadow-lg overflow-hidden">
                        {availableQualities.map((quality) => (
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
          {loadingCredentials && (
            <div className="absolute top-4 right-4 z-20">
              <Button
                variant="outline"
                size="sm"
                disabled
                className="bg-black/50 text-white border-gray-700"
              >
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading IPTV Player
              </Button>
            </div>
          )}

          {xtreamUrl && !error && !isBuffering && !loadingCredentials && url && (
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
