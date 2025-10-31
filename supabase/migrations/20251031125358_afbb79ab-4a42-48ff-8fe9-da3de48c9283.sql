-- Créer le type de profil
CREATE TYPE public.user_type AS ENUM ('artist', 'fan');

-- Table des profils utilisateurs
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  user_type public.user_type NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des tracks (musiques)
CREATE TABLE public.tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  audio_url TEXT NOT NULL,
  duration INTEGER,
  plays_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des follows
CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Table des likes
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, track_id)
);

-- Table des messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer le bucket de stockage pour les fichiers audio
INSERT INTO storage.buckets (id, name, public) VALUES ('audio-files', 'audio-files', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('cover-images', 'cover-images', true);

-- RLS Policies pour profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies pour tracks
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tracks viewable by everyone"
  ON public.tracks FOR SELECT
  USING (true);

CREATE POLICY "Artists can insert own tracks"
  ON public.tracks FOR INSERT
  WITH CHECK (
    auth.uid() = artist_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'artist')
  );

CREATE POLICY "Artists can update own tracks"
  ON public.tracks FOR UPDATE
  USING (auth.uid() = artist_id);

CREATE POLICY "Artists can delete own tracks"
  ON public.tracks FOR DELETE
  USING (auth.uid() = artist_id);

-- RLS Policies pour follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows viewable by everyone"
  ON public.follows FOR SELECT
  USING (true);

CREATE POLICY "Users can follow others"
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON public.follows FOR DELETE
  USING (auth.uid() = follower_id);

-- RLS Policies pour likes
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes viewable by everyone"
  ON public.likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like tracks"
  ON public.likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike tracks"
  ON public.likes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies pour messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can mark as read"
  ON public.messages FOR UPDATE
  USING (auth.uid() = recipient_id);

-- Storage policies pour audio-files
CREATE POLICY "Audio files viewable by everyone"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'audio-files');

CREATE POLICY "Artists can upload audio"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'audio-files' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'artist')
  );

CREATE POLICY "Artists can delete own audio"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'audio-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies pour cover-images
CREATE POLICY "Cover images viewable by everyone"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cover-images');

CREATE POLICY "Artists can upload covers"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'cover-images' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'artist')
  );

CREATE POLICY "Artists can delete own covers"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'cover-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger pour profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime pour messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;