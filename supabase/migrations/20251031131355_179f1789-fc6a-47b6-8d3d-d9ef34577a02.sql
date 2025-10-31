-- Ajouter les lyrics aux tracks
ALTER TABLE public.tracks ADD COLUMN lyrics TEXT;

-- Fonction pour incrémenter les plays
CREATE OR REPLACE FUNCTION public.increment_track_plays(track_id UUID)
RETURNS VOID
LANGUAGE SQL
AS $$
  UPDATE public.tracks
  SET plays_count = plays_count + 1
  WHERE id = track_id;
$$;

-- Policy pour permettre à tout le monde d'incrémenter les plays
CREATE POLICY "Anyone can increment plays"
  ON public.tracks FOR UPDATE
  USING (true)
  WITH CHECK (true);