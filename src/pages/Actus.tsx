import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Card } from "@/components/ui/card";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { ActusReactions } from "@/components/Actus/ActusReactions";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Newspaper } from "lucide-react";

const Actus = () => {
  const { data: actus, isLoading } = useQuery({
    queryKey: ["actus"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("actus")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch author profiles separately
      const authorIds = data?.map(a => a.author_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, username")
        .in("id", authorIds);

      // Map profiles to actus
      return data?.map(actu => ({
        ...actu,
        author: profiles?.find(p => p.id === actu.author_id)
      }));
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:ml-64 p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Newspaper className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">Actus</h1>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-48 bg-muted rounded-lg mb-4" />
                  <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-full" />
                </Card>
              ))}
            </div>
          ) : actus && actus.length > 0 ? (
            <div className="space-y-6">
              {actus.map((actu) => (
                <Card key={actu.id} className="overflow-hidden">
                  {actu.image_url && (
                    <OptimizedImage
                      src={actu.image_url}
                      alt={actu.title}
                      className="w-full h-64 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <h2 className="text-2xl font-bold mb-2">{actu.title}</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      {format(new Date(actu.created_at), "d MMMM yyyy", { locale: fr })}
                      {actu.author && ` • Par ${actu.author.display_name || actu.author.username}`}
                    </p>
                    <p className="text-foreground whitespace-pre-wrap">{actu.description}</p>
                    <ActusReactions actusId={actu.id} />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Newspaper className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">Aucune actu pour le moment</p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Actus;