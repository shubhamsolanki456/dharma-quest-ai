-- Create sin_logs table for tracking sin logging
CREATE TABLE public.sin_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sin_type TEXT NOT NULL,
  description TEXT,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sin_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own sin logs" 
ON public.sin_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sin logs" 
ON public.sin_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sin logs" 
ON public.sin_logs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create habits table for custom habit tracking
CREATE TABLE public.habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '⭐',
  target_value INTEGER DEFAULT 1,
  unit TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own habits" 
ON public.habits 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habits" 
ON public.habits 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits" 
ON public.habits 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits" 
ON public.habits 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create habit_completions table for tracking daily habit completion
CREATE TABLE public.habit_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  completed_at DATE NOT NULL DEFAULT CURRENT_DATE,
  value INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own habit completions" 
ON public.habit_completions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habit completions" 
ON public.habit_completions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own habit completions" 
ON public.habit_completions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add unique constraint to prevent duplicate completions
CREATE UNIQUE INDEX habit_completions_unique_per_day ON public.habit_completions(user_id, habit_id, completed_at);