-- Drop the trigger to avoid conflicts with manual profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;