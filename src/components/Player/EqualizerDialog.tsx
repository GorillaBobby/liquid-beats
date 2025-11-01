import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";

interface EqualizerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EQ_BANDS = [
  { frequency: 100, label: "100 Hz" },
  { frequency: 200, label: "200 Hz" },
  { frequency: 400, label: "400 Hz" },
  { frequency: 800, label: "800 Hz" },
  { frequency: 1600, label: "1.6k Hz" },
  { frequency: 3200, label: "3.2k Hz" },
  { frequency: 6400, label: "6.4k Hz" },
];

const PRESETS = {
  flat: { name: "Flat", values: { 100: 0, 200: 0, 400: 0, 800: 0, 1600: 0, 3200: 0, 6400: 0 }, master: 0 },
  bassBoost: { name: "Bass Boost", values: { 100: 8, 200: 6, 400: 3, 800: 0, 1600: -2, 3200: -3, 6400: -3 }, master: 0 },
  trebleBoost: { name: "Treble Boost", values: { 100: -3, 200: -2, 400: 0, 800: 2, 1600: 4, 3200: 6, 6400: 8 }, master: 0 },
  vocal: { name: "Vocal", values: { 100: -2, 200: -1, 400: 2, 800: 4, 1600: 4, 3200: 2, 6400: 0 }, master: 0 },
  rock: { name: "Rock", values: { 100: 6, 200: 3, 400: -2, 800: -3, 1600: 1, 3200: 4, 6400: 6 }, master: 0 },
  pop: { name: "Pop", values: { 100: 3, 200: 2, 400: 0, 800: -1, 1600: 1, 3200: 3, 6400: 4 }, master: 0 },
};

export default function EqualizerDialog({ open, onOpenChange }: EqualizerDialogProps) {
  const { eqGains, setEqGain, masterGain, setMasterGain } = useAudioPlayer();

  const applyPreset = (preset: typeof PRESETS[keyof typeof PRESETS]) => {
    Object.entries(preset.values).forEach(([freq, gain]) => {
      setEqGain(Number(freq), gain);
    });
    setMasterGain(preset.master);
  };

  const resetEQ = () => {
    applyPreset(PRESETS.flat);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-glass/95 backdrop-blur-glass border-glass-border max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Égaliseur Graphique</DialogTitle>
        </DialogHeader>
        
        <div className="mt-6 space-y-6">
          {/* Presets */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground text-center">Préréglages</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {Object.entries(PRESETS).map(([key, preset]) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(preset)}
                  className="bg-glass/30 border-glass-border hover:bg-glass/50"
                >
                  {preset.name}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={resetEQ}
                className="bg-glass/30 border-glass-border hover:bg-glass/50"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Réinitialiser
              </Button>
            </div>
          </div>

          {/* EQ Bands */}
          <div className="flex justify-center gap-4 md:gap-6 px-2 md:px-4">
            {EQ_BANDS.map((band) => (
              <div key={band.frequency} className="flex flex-col items-center gap-2">
                <div className="text-xs font-semibold text-primary h-6">
                  {eqGains[band.frequency]?.toFixed(1) || "0.0"} dB
                </div>
                <div className="relative h-40 md:h-48 w-8 md:w-12">
                  <Slider
                    orientation="vertical"
                    value={[eqGains[band.frequency] || 0]}
                    min={-15}
                    max={15}
                    step={0.5}
                    onValueChange={(value) => setEqGain(band.frequency, value[0])}
                    className="h-full"
                  />
                  <div className="absolute -left-6 md:-left-8 top-0 text-[10px] md:text-xs text-muted-foreground">+15</div>
                  <div className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 text-[10px] md:text-xs text-muted-foreground">0</div>
                  <div className="absolute -left-6 md:-left-8 bottom-0 text-[10px] md:text-xs text-muted-foreground">-15</div>
                </div>
                <span className="text-[10px] md:text-xs text-muted-foreground font-medium text-center">
                  {band.label}
                </span>
              </div>
            ))}
          </div>

          {/* Master Level */}
          <div className="space-y-3 px-4 md:px-8 border-t border-glass-border pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-foreground">Niveau Principal</div>
              <div className="text-sm font-semibold text-primary">
                {masterGain.toFixed(1)} dB
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground w-8">-15</span>
              <Slider
                value={[masterGain]}
                min={-15}
                max={15}
                step={0.5}
                onValueChange={(value) => setMasterGain(value[0])}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-8">+15</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
