import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";

interface EqualizerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EQ_BANDS = [
  { frequency: 100, label: "100" },
  { frequency: 200, label: "200" },
  { frequency: 400, label: "400" },
  { frequency: 800, label: "800" },
  { frequency: 1600, label: "1.6k" },
  { frequency: 3200, label: "3.2k" },
  { frequency: 6400, label: "6.4k" },
];

export default function EqualizerDialog({ open, onOpenChange }: EqualizerDialogProps) {
  const { eqGains, setEqGain, masterGain, setMasterGain } = useAudioPlayer();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-glass/95 backdrop-blur-glass border-glass-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Graphic EQ</DialogTitle>
        </DialogHeader>
        
        <div className="mt-6 space-y-8">
          {/* EQ Bands */}
          <div className="flex justify-center gap-6 px-4">
            {EQ_BANDS.map((band) => (
              <div key={band.frequency} className="flex flex-col items-center gap-2">
                <div className="relative h-48 w-12">
                  <Slider
                    orientation="vertical"
                    value={[eqGains[band.frequency] || 0]}
                    min={-15}
                    max={15}
                    step={0.5}
                    onValueChange={(value) => setEqGain(band.frequency, value[0])}
                    className="h-full"
                  />
                  <div className="absolute -left-8 top-0 text-xs text-muted-foreground">+15</div>
                  <div className="absolute -left-6 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">0</div>
                  <div className="absolute -left-8 bottom-0 text-xs text-muted-foreground">-15</div>
                </div>
                <span className="text-xs text-muted-foreground font-medium">{band.label}</span>
              </div>
            ))}
          </div>

          {/* Master Level */}
          <div className="space-y-3 px-8">
            <div className="text-center text-sm font-medium text-foreground">Level</div>
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
