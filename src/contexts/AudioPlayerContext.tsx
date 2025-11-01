import { createContext, useContext, useState, useRef, ReactNode, useEffect } from "react";

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
  eqGains: Record<number, number>;
  masterGain: number;
  setCurrentTrack: (track: Track) => void;
  setPlaylist: (tracks: Track[], startIndex?: number) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setEqGain: (frequency: number, gain: number) => void;
  setMasterGain: (gain: number) => void;
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
  const [eqGains, setEqGains] = useState<Record<number, number>>({
    100: 0, 200: 0, 400: 0, 800: 0, 1600: 0, 3200: 0, 6400: 0
  });
  const [masterGain, setMasterGainState] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filtersRef = useRef<Record<number, BiquadFilterNode>>({});
  const masterGainNodeRef = useRef<GainNode | null>(null);

  // Initialize Web Audio API
  useEffect(() => {
    if (!audioRef.current) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;

    const source = audioContext.createMediaElementSource(audioRef.current);
    sourceNodeRef.current = source;

    // Create EQ filters for each frequency band
    const frequencies = [100, 200, 400, 800, 1600, 3200, 6400];
    let previousNode: AudioNode = source;

    frequencies.forEach((freq) => {
      const filter = audioContext.createBiquadFilter();
      filter.type = "peaking";
      filter.frequency.value = freq;
      filter.Q.value = 1;
      filter.gain.value = 0;
      
      previousNode.connect(filter);
      previousNode = filter;
      filtersRef.current[freq] = filter;
    });

    // Create master gain node
    const masterGainNode = audioContext.createGain();
    masterGainNode.gain.value = 1;
    masterGainNodeRef.current = masterGainNode;

    previousNode.connect(masterGainNode);
    masterGainNode.connect(audioContext.destination);

    return () => {
      audioContext.close();
    };
  }, []);

  const setCurrentTrack = (track: Track) => {
    setCurrentTrackState(track);
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

  const setEqGain = (frequency: number, gain: number) => {
    setEqGains(prev => ({ ...prev, [frequency]: gain }));
    if (filtersRef.current[frequency]) {
      filtersRef.current[frequency].gain.value = gain;
    }
  };

  const setMasterGain = (gain: number) => {
    setMasterGainState(gain);
    if (masterGainNodeRef.current) {
      // Convert dB to linear gain (approximate)
      const linearGain = Math.pow(10, gain / 20);
      masterGainNodeRef.current.gain.value = linearGain;
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
        eqGains,
        masterGain,
        setCurrentTrack,
        setPlaylist,
        togglePlay,
        playNext,
        playPrevious,
        seek,
        setVolume,
        setEqGain,
        setMasterGain,
        audioRef,
      }}
    >
      {children}
      <audio
        ref={audioRef}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={playNext}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
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
