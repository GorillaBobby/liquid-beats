import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart, Repeat, Shuffle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Track {
  id: string;
  title: string;
  artist: string;
  cover: string;
  audioUrl: string;
  lyrics?: string;
}

interface AudioPlayerProps {
  currentTrack: Track | null;
  onNext: () => void;
  onPrevious: () => void;
}

export const AudioPlayer = ({ currentTrack, onNext, onPrevious }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(75);
  const [isLiked, setIsLiked] = useState(false);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.src = currentTrack.audioUrl;
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  }, [currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-24 bg-glass/90 backdrop-blur-glass border-t border-glass-border animate-slide-up">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={onNext}
      />
      
      <div className="h-full px-6 flex items-center gap-6">
        {/* Track Info */}
        <div className="flex items-center gap-4 w-64">
          <img
            src={currentTrack.cover}
            alt={currentTrack.title}
            className="w-16 h-16 rounded-lg object-cover shadow-glass"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">{currentTrack.title}</p>
            <p className="text-sm text-muted-foreground truncate">{currentTrack.artist}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "transition-colors",
              isLiked && "text-primary"
            )}
            onClick={() => setIsLiked(!isLiked)}
          >
            <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
          </Button>
        </div>

        {/* Controls */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Shuffle className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onPrevious}>
              <SkipBack className="w-5 h-5" />
            </Button>
            <Button
              size="icon"
              className="w-10 h-10 bg-gradient-primary hover:shadow-glow transition-all duration-300"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={onNext}>
              <SkipForward className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Repeat className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="w-full max-w-2xl flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-12 text-right">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-12">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume & Lyrics */}
        <div className="flex items-center gap-3 w-48">
          {currentTrack?.lyrics && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLyricsOpen(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <FileText className="w-5 h-5" />
            </Button>
          )}
          <Volume2 className="w-5 h-5 text-muted-foreground" />
          <Slider
            value={[volume]}
            max={100}
            step={1}
            onValueChange={(value) => setVolume(value[0])}
          />
        </div>
      </div>

      {/* Lyrics Dialog */}
      <Dialog open={lyricsOpen} onOpenChange={setLyricsOpen}>
        <DialogContent className="bg-glass/95 backdrop-blur-glass border-glass-border max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {currentTrack?.title} - {currentTrack?.artist}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 whitespace-pre-wrap text-foreground leading-relaxed">
            {currentTrack?.lyrics || "Paroles non disponibles"}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
