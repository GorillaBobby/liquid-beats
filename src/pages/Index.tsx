import { useState } from "react";
import { Sidebar } from "@/components/Layout/Sidebar";
import { AudioPlayer } from "@/components/Player/AudioPlayer";
import { TrackCard } from "@/components/Cards/TrackCard";
import { ArtistCard } from "@/components/Cards/ArtistCard";

// Sample data avec URLs audio réelles
const tracks = [
  {
    id: "1",
    title: "Midnight Dreams",
    artist: "Luna Eclipse",
    cover: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    id: "2",
    title: "Electric Pulse",
    artist: "Neon Waves",
    cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  },
  {
    id: "3",
    title: "Ocean Breeze",
    artist: "Coastal Dreams",
    cover: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
  },
  {
    id: "4",
    title: "Urban Nights",
    artist: "City Lights",
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"
  },
];

const artists = [
  {
    id: "1",
    name: "Luna Eclipse",
    genre: "Electronic",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    followers: "1.2M"
  },
  {
    id: "2",
    name: "Neon Waves",
    genre: "Synthwave",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    followers: "856K"
  },
  {
    id: "3",
    name: "Coastal Dreams",
    genre: "Ambient",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    followers: "642K"
  },
];

const Index = () => {
  const [currentTrack, setCurrentTrack] = useState(tracks[0]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % tracks.length;
    setCurrentIndex(nextIndex);
    setCurrentTrack(tracks[nextIndex]);
  };

  const handlePrevious = () => {
    const prevIndex = currentIndex === 0 ? tracks.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    setCurrentTrack(tracks[prevIndex]);
  };

  const handleTrackSelect = (index: number) => {
    setCurrentIndex(index);
    setCurrentTrack(tracks[index]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-64 pb-32 p-8">
        {/* Hero Section */}
        <section className="relative h-96 rounded-3xl overflow-hidden mb-12 shadow-glass">
          <img
            src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=1200&h=400&fit=crop"
            alt="Hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-overlay" />
          <div className="absolute bottom-8 left-8 right-8">
            <h2 className="text-5xl font-bold text-foreground mb-4 animate-fade-in">
              Découvrez votre musique
            </h2>
            <p className="text-xl text-muted-foreground animate-fade-in">
              Les meilleurs titres sélectionnés pour vous
            </p>
          </div>
        </section>

        {/* Tendances */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-6">Tendances</h2>
          <div className="grid grid-cols-4 gap-6">
            {tracks.map((track, index) => (
              <TrackCard
                key={track.id}
                {...track}
                onClick={() => handleTrackSelect(index)}
              />
            ))}
          </div>
        </section>

        {/* Artistes populaires */}
        <section>
          <h2 className="text-3xl font-bold text-foreground mb-6">Artistes populaires</h2>
          <div className="grid grid-cols-3 gap-6">
            {artists.map((artist) => (
              <ArtistCard
                key={artist.id}
                {...artist}
                onClick={() => console.log("Artist clicked:", artist.name)}
              />
            ))}
          </div>
        </section>
      </main>

      <AudioPlayer
        currentTrack={currentTrack}
        onNext={handleNext}
        onPrevious={handlePrevious}
      />
    </div>
  );
};

export default Index;
