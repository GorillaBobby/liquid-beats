import { createContext, useContext, useState, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Track {
  id: string;
  title: string;
  artist: string;
  cover: string;
  audioUrl: string;
  lyrics?: string;
}

interface AudioPlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playlist: Track[];
  currentIndex: number;
  setCurrentTrack: (track: Track) => void;
  setPlaylist: (tracks: Track[], startIndex?: number) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  audioRef: React.RefObject<HTMLAudioElement>;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrack, setCurrentTrackState] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(75);
  const [playlist, setPlaylistState] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const playCountIncrementedRef = useRef<string | null>(null);
  const playStartTimeRef = useRef<number>(0);

  const setCurrentTrack = (track: Track) => {
    setCurrentTrackState(track);
    
    // Reset play count tracking for new track
    playCountIncrementedRef.current = null;
    playStartTimeRef.current = 0;
    
    if (audioRef.current) {
      audioRef.current.src = track.audioUrl;
      audioRef.current.load();
      audioRef.current.play().then(() => setIsPlaying(true));
    }
  };

  const setPlaylist = (tracks: Track[], startIndex: number = 0) => {
    setPlaylistState(tracks);
    setCurrentIndex(startIndex);
    if (tracks.length > 0) {
      setCurrentTrack(tracks[startIndex]);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true));
    }
  };

  const playNext = () => {
    if (playlist.length === 0) return;
    const nextIndex = (currentIndex + 1) % playlist.length;
    setCurrentIndex(nextIndex);
    setCurrentTrack(playlist[nextIndex]);
  };

  const playPrevious = () => {
    if (playlist.length === 0) return;
    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    setCurrentTrack(playlist[prevIndex]);
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const setVolume = (vol: number) => {
    setVolumeState(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol / 100;
    }
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        playlist,
        currentIndex,
        setCurrentTrack,
        setPlaylist,
        togglePlay,
        playNext,
        playPrevious,
        seek,
        setVolume,
        audioRef,
      }}
    >
      {children}
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          const time = audioRef.current?.currentTime || 0;
          setCurrentTime(time);
          
          // Increment play count after 10 seconds, only once per track
          if (
            currentTrack &&
            time >= 10 &&
            playCountIncrementedRef.current !== currentTrack.id
          ) {
            playCountIncrementedRef.current = currentTrack.id;
            supabase.rpc('increment_track_plays', { track_id: currentTrack.id })
              .then(({ error }) => {
                if (error) console.error('Error incrementing play count:', error);
              });
          }
        }}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={playNext}
        onPlay={() => {
          setIsPlaying(true);
          playStartTimeRef.current = Date.now();
        }}
        onPause={() => setIsPlaying(false)}
        preload="auto"
        crossOrigin="anonymous"
      />
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  }
  return context;
};
