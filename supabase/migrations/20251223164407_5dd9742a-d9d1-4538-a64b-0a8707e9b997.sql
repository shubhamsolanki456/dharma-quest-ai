-- Add dharma-specific onboarding data fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS spirituality_level TEXT,
ADD COLUMN IF NOT EXISTS meditation_experience TEXT,
ADD COLUMN IF NOT EXISTS daily_routine TEXT,
ADD COLUMN IF NOT EXISTS goals TEXT,
ADD COLUMN IF NOT EXISTS preferred_practices TEXT,
ADD COLUMN IF NOT EXISTS wake_up_time TEXT,
ADD COLUMN IF NOT EXISTS practice_duration TEXT;