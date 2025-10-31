-- Add downloadable column to tracks
ALTER TABLE public.tracks ADD COLUMN downloadable boolean DEFAULT false;

-- Create albums table
CREATE TABLE public.albums (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  cover_url text,
  release_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on albums
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

-- Albums viewable by everyone
CREATE POLICY "Albums viewable by everyone"
ON public.albums
FOR SELECT
USING (true);

-- Artists can create own albums
CREATE POLICY "Artists can create own albums"
ON public.albums
FOR INSERT
WITH CHECK (auth.uid() = artist_id AND EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid()
  AND profiles.user_type = 'artist'
));

-- Artists can update own albums
CREATE POLICY "Artists can update own albums"
ON public.albums
FOR UPDATE
USING (auth.uid() = artist_id);

-- Artists can delete own albums
CREATE POLICY "Artists can delete own albums"
ON public.albums
FOR DELETE
USING (auth.uid() = artist_id);

-- Add album_id to tracks table
ALTER TABLE public.tracks ADD COLUMN album_id uuid REFERENCES public.albums(id) ON DELETE SET NULL;

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  related_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Anyone can insert notifications (for system notifications)
CREATE POLICY "Anyone can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Create trigger for album updated_at
CREATE TRIGGER update_albums_updated_at
BEFORE UPDATE ON public.albums
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();