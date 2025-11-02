import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function FeedbackDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Vous devez être connecté pour envoyer un feedback");
      return;
    }

    if (!subject.trim() || !message.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    // Validate feedback content
    const { feedbackSchema } = await import("@/lib/validations");
    const validation = feedbackSchema.safeParse({ subject, message });
    
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.functions.invoke('submit-feedback', {
        body: {
          subject: subject.trim(),
          message: message.trim(),
        },
      });

      if (error) throw error;

      toast.success("Feedback envoyé avec succès!");
      setSubject("");
      setMessage("");
      setOpen(false);
    } catch (error: any) {
      console.error("Error sending feedback:", error);
      toast.error("Erreur lors de l'envoi du feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start gap-3 bg-glass/30 border-glass-border hover:bg-glass-hover"
        >
          <MessageSquare className="w-5 h-5" />
          <span>Envoyer un feedback</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-glass/95 backdrop-blur-glass border-glass-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Envoyer un feedback</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Sujet</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Sujet de votre feedback..."
              className="bg-background/50 border-glass-border"
              required
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Décrivez votre suggestion ou problème..."
              className="bg-background/50 border-glass-border min-h-[150px]"
              required
              maxLength={2000}
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
              {loading ? "Envoi..." : "Envoyer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
