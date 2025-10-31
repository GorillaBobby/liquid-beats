import { useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart, Repeat, Shuffle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";

export default function GlobalAudioPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    togglePlay,
    playNext,
    playPrevious,
    seek,
    setVolume,
  } = useAudioPlayer();

  const [isLiked, setIsLiked] = useState(false);
  const [lyricsOpen, setLyricsOpen] = useState(false);

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 md:h-24 bg-glass/90 backdrop-blur-glass border-t border-glass-border animate-slide-up z-50">
      <div className="h-full px-3 md:px-6 flex items-center gap-2 md:gap-6">
        {/* Track Info */}
        <div className="flex items-center gap-2 md:gap-4 w-24 md:w-64">
          <img
            src={currentTrack.cover}
            alt={currentTrack.title}
            className="w-12 h-12 md:w-16 md:h-16 rounded-lg object-cover shadow-glass"
          />
          <div className="flex-1 min-w-0 hidden md:block">
            <p className="font-semibold text-foreground truncate">{currentTrack.title}</p>
            <p className="text-sm text-muted-foreground truncate">{currentTrack.artist}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "transition-colors hidden md:flex",
              isLiked && "text-primary"
            )}
            onClick={() => setIsLiked(!isLiked)}
          >
            <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
          </Button>
        </div>

        {/* Controls */}
        <div className="flex-1 flex flex-col items-center gap-1 md:gap-2">
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hidden md:flex">
              <Shuffle className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={playPrevious} className="w-8 h-8 md:w-10 md:h-10">
              <SkipBack className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
            <Button
              size="icon"
              className="w-9 h-9 md:w-10 md:h-10 bg-gradient-primary hover:shadow-glow transition-all duration-300"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="w-4 h-4 md:w-5 md:h-5" /> : <Play className="w-4 h-4 md:w-5 md:h-5 ml-0.5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={playNext} className="w-8 h-8 md:w-10 md:h-10">
              <SkipForward className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hidden md:flex">
              <Repeat className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="w-full max-w-2xl flex items-center gap-2 md:gap-3">
            <span className="text-[10px] md:text-xs text-muted-foreground w-8 md:w-12 text-right">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={(value) => seek(value[0])}
              className="flex-1"
            />
            <span className="text-[10px] md:text-xs text-muted-foreground w-8 md:w-12">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume & Lyrics */}
        <div className="items-center gap-3 w-12 md:w-48 hidden md:flex">
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
        
        {/* Mobile Lyrics Button */}
        {currentTrack?.lyrics && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLyricsOpen(true)}
            className="text-muted-foreground hover:text-foreground md:hidden"
          >
            <FileText className="w-5 h-5" />
          </Button>
        )}
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
}
