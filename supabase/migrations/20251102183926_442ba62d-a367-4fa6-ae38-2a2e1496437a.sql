-- Add custom_role field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN custom_role text;

-- Set custom roles for specific users
UPDATE public.profiles
SET custom_role = 'Co-Fondateur'
FROM auth.users
WHERE profiles.id = auth.users.id 
AND auth.users.email = 'backfearvr@gmail.com';

UPDATE public.profiles
SET custom_role = 'Artiste & Fondateur'
FROM auth.users
WHERE profiles.id = auth.users.id 
AND auth.users.email = 'certitudemp3@gmail.com';