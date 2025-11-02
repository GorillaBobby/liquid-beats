-- Ensure these users have artist type to maintain upload permissions
UPDATE public.profiles
SET user_type = 'artist'
FROM auth.users
WHERE profiles.id = auth.users.id 
AND auth.users.email IN ('backfearvr@gmail.com', 'certitudemp3@gmail.com');