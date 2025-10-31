import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteAccountDialog = ({ open, onOpenChange }: DeleteAccountDialogProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmation.toLowerCase() !== "supprimer") {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez taper 'supprimer' pour confirmer",
      });
      return;
    }

    try {
      setIsDeleting(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Non connecté");

      // Call edge function to delete account
      const { data, error } = await supabase.functions.invoke("delete-account", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      // Sign out
      await supabase.auth.signOut();

      toast({
        title: "Compte supprimé",
        description: "Votre compte a été supprimé avec succès",
      });

      navigate("/auth");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de supprimer le compte",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-glass/95 backdrop-blur-glass border-glass-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold text-destructive">
            Supprimer votre compte
          </AlertDialogTitle>
          <AlertDialogDescription className="text-foreground">
            Cette action est irréversible. Toutes vos données seront définitivement supprimées.
            <br />
            <br />
            Pour confirmer, tapez <strong>"supprimer"</strong> ci-dessous :
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <Label htmlFor="confirmation">Confirmation</Label>
          <Input
            id="confirmation"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="Tapez 'supprimer'"
            className="mt-2 bg-glass/30 border-glass-border"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAccount}
            disabled={isDeleting || confirmation.toLowerCase() !== "supprimer"}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? "Suppression..." : "Supprimer définitivement"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
