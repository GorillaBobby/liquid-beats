import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

interface AdminCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ADMIN_CODE = "ADMIN123456";

export const AdminCodeDialog = ({ open, onOpenChange, onSuccess }: AdminCodeDialogProps) => {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifyCode = async () => {
    if (code !== ADMIN_CODE) {
      toast({
        variant: "destructive",
        title: "Code incorrect",
        description: "Le code admin que vous avez entré est incorrect",
      });
      return;
    }

    try {
      setIsVerifying(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      // Add admin role
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: "admin" });

      if (error) {
        // Check if already admin
        if (error.code === "23505") {
          toast({
            title: "Déjà admin",
            description: "Vous avez déjà les permissions administrateur",
          });
          onOpenChange(false);
          onSuccess();
          return;
        }
        throw error;
      }

      toast({
        title: "Admin activé ✓",
        description: "Vous avez maintenant accès au panneau administrateur",
      });

      onOpenChange(false);
      setCode("");
      onSuccess();
    } catch (error: any) {
      console.error("Error verifying admin code:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible d'activer les permissions admin",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-glass/95 backdrop-blur-glass border-glass-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Code Administrateur
          </DialogTitle>
          <DialogDescription>
            Entrez le code administrateur pour accéder au panneau admin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div>
            <Input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Entrez le code admin"
              className="bg-glass/30 border-glass-border text-center text-lg font-mono tracking-wider"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleVerifyCode();
                }
              }}
            />
          </div>

          <Button
            onClick={handleVerifyCode}
            disabled={isVerifying || !code}
            className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
          >
            {isVerifying ? "Vérification..." : "Vérifier"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
