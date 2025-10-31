-- Corriger la fonction increment_track_plays avec search_path
CREATE OR REPLACE FUNCTION public.increment_track_plays(track_id UUID)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.tracks
  SET plays_count = plays_count + 1
  WHERE id = track_id;
$$;