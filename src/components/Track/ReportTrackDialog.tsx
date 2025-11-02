import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReportTrackDialogProps {
  trackId: string;
  trackTitle: string;
}

export function ReportTrackDialog({ trackId, trackTitle }: ReportTrackDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason) {
      toast.error("Veuillez sélectionner une raison");
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Vous devez être connecté pour signaler une piste");
        return;
      }

      const { data, error } = await supabase.functions.invoke('report-track', {
        body: {
          trackId,
          reason,
          details: details.trim() || null,
        },
      });

      if (error) throw error;

      toast.success("Signalement envoyé avec succès");
      setReason("");
      setDetails("");
      setOpen(false);
    } catch (error: any) {
      console.error("Error reporting track:", error);
      toast.error("Erreur lors de l'envoi du signalement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className="bg-glass/30 border-glass-border"
        >
          <Flag className="w-5 h-5 mr-2" />
          Signaler
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-glass/95 backdrop-blur-glass border-glass-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Signaler cette musique</DialogTitle>
          <p className="text-muted-foreground">{trackTitle}</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Raison du signalement</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="bg-background/50 border-glass-border">
                <SelectValue placeholder="Sélectionnez une raison" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="copyright">Violation de droits d'auteur</SelectItem>
                <SelectItem value="inappropriate">Contenu inapproprié</SelectItem>
                <SelectItem value="spam">Spam ou contenu trompeur</SelectItem>
                <SelectItem value="quality">Problème de qualité audio</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="details">Détails (optionnel)</Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Décrivez le problème..."
              className="bg-background/50 border-glass-border min-h-[100px]"
              maxLength={1000}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-gradient-primary hover:shadow-glow"
              disabled={loading}
            >
              {loading ? "Envoi..." : "Envoyer le signalement"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
