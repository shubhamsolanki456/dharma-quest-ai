-- Update the default trial duration to 7 days (from 14 days)
ALTER TABLE public.user_subscriptions 
  ALTER COLUMN trial_end_date SET DEFAULT (now() + interval '7 days');