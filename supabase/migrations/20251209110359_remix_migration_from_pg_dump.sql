CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name', new.email);
  RETURN new;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: chat_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    message text NOT NULL,
    is_user boolean NOT NULL,
    scripture text,
    source text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: completed_prayers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.completed_prayers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    prayer_schedule_id uuid,
    completed_at timestamp with time zone DEFAULT now() NOT NULL,
    notes text
);


--
-- Name: journal_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.journal_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text,
    content text NOT NULL,
    mood text,
    tags text[],
    is_private boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: manifestations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.manifestations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    intention text NOT NULL,
    category text,
    target_date date,
    is_achieved boolean DEFAULT false NOT NULL,
    achieved_at timestamp with time zone,
    gratitude_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: meditation_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meditation_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    duration_seconds integer NOT NULL,
    meditation_type text DEFAULT 'breathing'::text,
    completed boolean DEFAULT false NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: prayer_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prayer_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    prayer_name text NOT NULL,
    scheduled_time time without time zone NOT NULL,
    days_of_week integer[] DEFAULT ARRAY[0, 1, 2, 3, 4, 5, 6],
    mantra text,
    duration_minutes integer DEFAULT 10,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    full_name text,
    email text,
    avatar_url text,
    dharma_points integer DEFAULT 0 NOT NULL,
    app_streak integer DEFAULT 0 NOT NULL,
    sin_free_streak integer DEFAULT 0 NOT NULL,
    current_level integer DEFAULT 1 NOT NULL,
    last_activity_date date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: quest_completions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quest_completions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    quest_id integer NOT NULL,
    quest_title text NOT NULL,
    points_earned integer DEFAULT 0 NOT NULL,
    completed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: voice_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.voice_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text,
    audio_url text NOT NULL,
    duration_seconds integer,
    transcription text,
    log_type text DEFAULT 'reflection'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: chat_history chat_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_history
    ADD CONSTRAINT chat_history_pkey PRIMARY KEY (id);


--
-- Name: completed_prayers completed_prayers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.completed_prayers
    ADD CONSTRAINT completed_prayers_pkey PRIMARY KEY (id);


--
-- Name: journal_entries journal_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_pkey PRIMARY KEY (id);


--
-- Name: manifestations manifestations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manifestations
    ADD CONSTRAINT manifestations_pkey PRIMARY KEY (id);


--
-- Name: meditation_sessions meditation_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meditation_sessions
    ADD CONSTRAINT meditation_sessions_pkey PRIMARY KEY (id);


--
-- Name: prayer_schedules prayer_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prayer_schedules
    ADD CONSTRAINT prayer_schedules_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: quest_completions quest_completions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quest_completions
    ADD CONSTRAINT quest_completions_pkey PRIMARY KEY (id);


--
-- Name: voice_logs voice_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voice_logs
    ADD CONSTRAINT voice_logs_pkey PRIMARY KEY (id);


--
-- Name: journal_entries update_journal_entries_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON public.journal_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: manifestations update_manifestations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_manifestations_updated_at BEFORE UPDATE ON public.manifestations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: chat_history chat_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_history
    ADD CONSTRAINT chat_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: completed_prayers completed_prayers_prayer_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.completed_prayers
    ADD CONSTRAINT completed_prayers_prayer_schedule_id_fkey FOREIGN KEY (prayer_schedule_id) REFERENCES public.prayer_schedules(id) ON DELETE CASCADE;


--
-- Name: completed_prayers completed_prayers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.completed_prayers
    ADD CONSTRAINT completed_prayers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: journal_entries journal_entries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: manifestations manifestations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manifestations
    ADD CONSTRAINT manifestations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: meditation_sessions meditation_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meditation_sessions
    ADD CONSTRAINT meditation_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: prayer_schedules prayer_schedules_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prayer_schedules
    ADD CONSTRAINT prayer_schedules_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: quest_completions quest_completions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quest_completions
    ADD CONSTRAINT quest_completions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: voice_logs voice_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voice_logs
    ADD CONSTRAINT voice_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: journal_entries Users can delete own journal entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own journal entries" ON public.journal_entries FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: manifestations Users can delete own manifestations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own manifestations" ON public.manifestations FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: prayer_schedules Users can delete own prayer schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own prayer schedules" ON public.prayer_schedules FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: quest_completions Users can delete own quest completions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own quest completions" ON public.quest_completions FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: voice_logs Users can delete own voice logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own voice logs" ON public.voice_logs FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: chat_history Users can insert own chat history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own chat history" ON public.chat_history FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: completed_prayers Users can insert own completed prayers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own completed prayers" ON public.completed_prayers FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: journal_entries Users can insert own journal entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own journal entries" ON public.journal_entries FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: manifestations Users can insert own manifestations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own manifestations" ON public.manifestations FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: meditation_sessions Users can insert own meditation sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own meditation sessions" ON public.meditation_sessions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: prayer_schedules Users can insert own prayer schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own prayer schedules" ON public.prayer_schedules FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: quest_completions Users can insert own quest completions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own quest completions" ON public.quest_completions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: voice_logs Users can insert own voice logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own voice logs" ON public.voice_logs FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: journal_entries Users can update own journal entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own journal entries" ON public.journal_entries FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: manifestations Users can update own manifestations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own manifestations" ON public.manifestations FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: meditation_sessions Users can update own meditation sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own meditation sessions" ON public.meditation_sessions FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: prayer_schedules Users can update own prayer schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own prayer schedules" ON public.prayer_schedules FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: chat_history Users can view own chat history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own chat history" ON public.chat_history FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: completed_prayers Users can view own completed prayers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own completed prayers" ON public.completed_prayers FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: journal_entries Users can view own journal entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own journal entries" ON public.journal_entries FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: manifestations Users can view own manifestations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own manifestations" ON public.manifestations FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: meditation_sessions Users can view own meditation sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own meditation sessions" ON public.meditation_sessions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: prayer_schedules Users can view own prayer schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own prayer schedules" ON public.prayer_schedules FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: quest_completions Users can view own quest completions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own quest completions" ON public.quest_completions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: voice_logs Users can view own voice logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own voice logs" ON public.voice_logs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: chat_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

--
-- Name: completed_prayers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.completed_prayers ENABLE ROW LEVEL SECURITY;

--
-- Name: journal_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: manifestations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.manifestations ENABLE ROW LEVEL SECURITY;

--
-- Name: meditation_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.meditation_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: prayer_schedules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.prayer_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: quest_completions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quest_completions ENABLE ROW LEVEL SECURITY;

--
-- Name: voice_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.voice_logs ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


