
import { useEffect, useRef } from "react";

interface VideoPlayerProps {
  isPlaying: boolean;
  src?: string;
}

const VideoPlayer = ({ isPlaying, src }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // This is a placeholder video URL - in a production environment,
  // this would be the actual IPTV stream URL
  const placeholderVideo = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(error => {
          console.error("Error playing video:", error);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  return (
    <div className="w-full h-full">
      <video
        ref={videoRef}
        src={src || placeholderVideo}
        className="w-full h-full object-contain"
        playsInline
        controls={false}
        loop
      />
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="rounded-full h-16 w-16 bg-gold/20 flex items-center justify-center border border-gold/40">
            <div className="text-gold text-lg">Play</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
