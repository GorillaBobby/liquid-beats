import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users } from "lucide-react";
import { useGroupSession } from "@/hooks/useGroupSession";

interface JoinSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function JoinSessionDialog({
  open,
  onOpenChange
}: JoinSessionDialogProps) {
  const [code, setCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const { joinSession } = useGroupSession();

  const handleJoin = async () => {
    if (!code.trim()) return;

    setIsJoining(true);
    const success = await joinSession(code);
    setIsJoining(false);

    if (success) {
      setCode("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-glass/95 backdrop-blur-glass border-glass-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Rejoindre une session
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Entrez le code de session pour rejoindre vos amis
          </p>

          <Input
            placeholder="CODE SESSION"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="text-center text-2xl tracking-wider font-bold"
          />

          <Button
            onClick={handleJoin}
            disabled={isJoining || code.length !== 6}
            className="w-full bg-gradient-primary"
          >
            {isJoining ? "Connexion..." : "Rejoindre"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
