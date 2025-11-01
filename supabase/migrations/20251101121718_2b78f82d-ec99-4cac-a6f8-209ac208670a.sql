-- Create admin logs table
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid,
  user_email text,
  username text,
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admins can view all logs"
ON public.admin_logs
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Anyone can insert logs (for triggers)
CREATE POLICY "Anyone can insert logs"
ON public.admin_logs
FOR INSERT
WITH CHECK (true);

-- Create function to log new user signups
CREATE OR REPLACE FUNCTION public.log_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_logs (event_type, user_id, user_email, details)
  VALUES (
    'new_user',
    NEW.id,
    NEW.email,
    jsonb_build_object(
      'user_type', NEW.user_type,
      'username', NEW.username
    )
  );
  RETURN NEW;
END;
$$;

-- Trigger for new users
DROP TRIGGER IF EXISTS on_new_user_created ON public.profiles;
CREATE TRIGGER on_new_user_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_new_user();

-- Create function to log new tracks
CREATE OR REPLACE FUNCTION public.log_new_track()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_logs (event_type, user_id, details)
  VALUES (
    'new_track',
    NEW.artist_id,
    jsonb_build_object(
      'track_id', NEW.id,
      'title', NEW.title,
      'artist_id', NEW.artist_id
    )
  );
  RETURN NEW;
END;
$$;

-- Trigger for new tracks
DROP TRIGGER IF EXISTS on_new_track_created ON public.tracks;
CREATE TRIGGER on_new_track_created
  AFTER INSERT ON public.tracks
  FOR EACH ROW
  EXECUTE FUNCTION public.log_new_track();

-- Create function to log new albums
CREATE OR REPLACE FUNCTION public.log_new_album()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_logs (event_type, user_id, details)
  VALUES (
    'new_album',
    NEW.artist_id,
    jsonb_build_object(
      'album_id', NEW.id,
      'title', NEW.title,
      'artist_id', NEW.artist_id
    )
  );
  RETURN NEW;
END;
$$;

-- Trigger for new albums
DROP TRIGGER IF EXISTS on_new_album_created ON public.albums;
CREATE TRIGGER on_new_album_created
  AFTER INSERT ON public.albums
  FOR EACH ROW
  EXECUTE FUNCTION public.log_new_album();

-- Create function to log artist verifications
CREATE OR REPLACE FUNCTION public.log_verification_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (OLD.verified IS DISTINCT FROM NEW.verified) OR (OLD.verified_tier IS DISTINCT FROM NEW.verified_tier) THEN
    INSERT INTO public.admin_logs (event_type, user_id, username, details)
    VALUES (
      'verification_change',
      NEW.id,
      NEW.username,
      jsonb_build_object(
        'verified', NEW.verified,
        'verified_tier', NEW.verified_tier,
        'old_verified', OLD.verified,
        'old_tier', OLD.verified_tier
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for verification changes
DROP TRIGGER IF EXISTS on_verification_change ON public.profiles;
CREATE TRIGGER on_verification_change
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_verification_change();