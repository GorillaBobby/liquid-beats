import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Users } from "lucide-react";
import { useGroupSession } from "@/hooks/useGroupSession";
import { useToast } from "@/hooks/use-toast";

interface CreateSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackId: string;
}

export default function CreateSessionDialog({
  open,
  onOpenChange,
  trackId
}: CreateSessionDialogProps) {
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { createSession } = useGroupSession();
  const { toast } = useToast();

  const handleCreate = async () => {
    setIsCreating(true);
    const code = await createSession(trackId);
    if (code) {
      setSessionCode(code);
    }
    setIsCreating(false);
  };

  const copyCode = () => {
    if (sessionCode) {
      navigator.clipboard.writeText(sessionCode);
      toast({
        title: "Code copié !",
        description: "Partagez-le avec vos amis",
      });
    }
  };

  const handleClose = () => {
    setSessionCode(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-glass/95 backdrop-blur-glass border-glass-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Session d'écoute en groupe
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!sessionCode ? (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Créez une session pour écouter cette musique avec vos amis en temps réel
              </p>
              <Button
                onClick={handleCreate}
                disabled={isCreating}
                className="w-full bg-gradient-primary"
              >
                {isCreating ? "Création..." : "Créer la session"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-background/50 p-6 rounded-lg border border-glass-border text-center space-y-2">
                <p className="text-sm text-muted-foreground">Code de session</p>
                <p className="text-3xl font-bold tracking-wider">{sessionCode}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyCode}
                  className="mt-2"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copier le code
                </Button>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Partagez ce code avec vos amis pour qu'ils rejoignent la session
              </p>
              <Button
                onClick={handleClose}
                variant="outline"
                className="w-full"
              >
                Fermer
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
