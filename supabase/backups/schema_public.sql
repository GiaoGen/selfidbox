--
-- PostgreSQL database dump
--

\restrict 0cxl8WIEXGzo32qt5SgQk47RZQ1EAhllcAGBq2ApnHOd01YycvI19VvIfsAUreg

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.4

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

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: credit_event_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.credit_event_type AS ENUM (
    'base_monthly',
    'quiz_completed',
    'quiz_approved',
    'guest_signup',
    'ai_generate'
);


--
-- Name: ensure_user_credits(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ensure_user_credits(target_user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  DECLARE
    row public.user_credits;
    avail integer;
    delta integer;
  BEGIN
    SELECT * INTO row FROM public.user_credits
      WHERE user_id = target_user_id;

    IF NOT FOUND THEN
      INSERT INTO public.user_credits (user_id, base_credits, bonus_credits, used_credits, base_refilled_at)
        VALUES (target_user_id, 20, 0, 0, now());
      INSERT INTO public.credit_events (user_id, type, amount)
        VALUES (target_user_id, 'base_monthly', 20);
    ELSIF date_trunc('month', row.base_refilled_at) < date_trunc('month', now()) THEN
      avail := row.base_credits + row.bonus_credits - row.used_credits;
      IF avail < 20 THEN
        delta := 20 - avail;
        UPDATE public.user_credits
          SET base_credits = base_credits + delta,
              base_refilled_at = now(),
              updated_at = now()
          WHERE user_id = target_user_id;
        INSERT INTO public.credit_events (user_id, type, amount)
          VALUES (target_user_id, 'base_monthly', delta);
      ELSE
        UPDATE public.user_credits
          SET base_refilled_at = now(),
              updated_at = now()
          WHERE user_id = target_user_id;
      END IF;
    END IF;
  END;
  $$;


--
-- Name: grant_credit(uuid, public.credit_event_type, integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.grant_credit(target_user_id uuid, event_type public.credit_event_type, amt integer, ref_id text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  DECLARE
    row public.user_credits;
  BEGIN
    PERFORM ensure_user_credits(target_user_id);

    BEGIN
      INSERT INTO public.credit_events (user_id, type, amount, reference_id)
        VALUES (target_user_id, event_type, amt, ref_id);
    EXCEPTION WHEN unique_violation THEN
      RETURN jsonb_build_object('ok', false, 'error', 'DUPLICATE');
    END;

    UPDATE public.user_credits
      SET bonus_credits = bonus_credits + amt,
          updated_at = now()
      WHERE user_id = target_user_id
      RETURNING * INTO row;

    RETURN jsonb_build_object(
      'ok', true,
      'credits_remaining', row.base_credits + row.bonus_credits - row.used_credits
    );
  END;
  $$;


--
-- Name: handle_new_auth_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_auth_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
  BEGIN
    INSERT INTO public.users (id, email, created_at)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.created_at, now()))
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
  END;
  $$;


--
-- Name: spend_credit(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.spend_credit(target_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
DECLARE
  row public.user_credits;
BEGIN
  -- Lock the row for atomicity
  SELECT * INTO row FROM public.user_credits
    WHERE user_id = target_user_id
    FOR UPDATE;

  -- On conflict (user_credits row deleted or never existed), default to 0
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NO_CREDITS');
  END IF;

  -- Check balance
  IF row.base_credits + row.bonus_credits - row.used_credits <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INSUFFICIENT');
  END IF;

  -- Spend
  UPDATE public.user_credits
    SET used_credits = used_credits + 1,
        updated_at = now()
    WHERE user_id = target_user_id;

  -- Log event
  INSERT INTO public.credit_events (user_id, type, amount)
    VALUES (target_user_id, 'ai_generate', -1);

  RETURN jsonb_build_object(
    'ok', true,
    'credits_remaining', row.base_credits + row.bonus_credits - row.used_credits - 1
  );
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ai_prompt_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_prompt_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    prompt_key text NOT NULL,
    version integer NOT NULL,
    prompt text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ai_prompts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_prompts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    description text,
    prompt text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_tested_at timestamp with time zone
);


--
-- Name: ai_usage_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_usage_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    feature text NOT NULL,
    model text,
    prompt_tokens integer DEFAULT 0,
    completion_tokens integer DEFAULT 0,
    total_tokens integer DEFAULT 0,
    estimated_cost numeric DEFAULT 0,
    success boolean DEFAULT true,
    error_message text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: credit_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.credit_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type public.credit_event_type NOT NULL,
    amount integer NOT NULL,
    reference_id text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: quiz_attempt_answers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_attempt_answers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    attempt_id uuid NOT NULL,
    quiz_id uuid NOT NULL,
    question_id uuid NOT NULL,
    option_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: quiz_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    quiz_id uuid NOT NULL,
    user_id uuid,
    user_vector jsonb DEFAULT '{}'::jsonb,
    similarity_ranking jsonb DEFAULT '[]'::jsonb,
    final_result_id uuid,
    final_result_key text,
    final_result_name text,
    created_at timestamp with time zone DEFAULT now(),
    included_in_profile boolean DEFAULT true,
    profile_weight numeric DEFAULT 0.3,
    fused_into_profile boolean DEFAULT false
);


--
-- Name: quiz_factors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_factors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    quiz_id uuid NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    description text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: quiz_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_options (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question_id uuid NOT NULL,
    quiz_id uuid NOT NULL,
    option_order integer NOT NULL,
    label text,
    text text NOT NULL,
    factor_effects jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: quiz_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    quiz_id uuid NOT NULL,
    question_order integer NOT NULL,
    text text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: quiz_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    quiz_id uuid NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    subtitle text,
    description text,
    traits jsonb DEFAULT '[]'::jsonb,
    result_vector jsonb DEFAULT '{}'::jsonb NOT NULL,
    share_text text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    image_url text,
    color text
);


--
-- Name: quizzes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quizzes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    creator_user_id uuid,
    slug text NOT NULL,
    title text NOT NULL,
    hook text,
    description text,
    quiz_type text DEFAULT 'personality'::text,
    audience jsonb DEFAULT '[]'::jsonb,
    tone jsonb DEFAULT '[]'::jsonb,
    status text DEFAULT 'draft'::text,
    featured boolean DEFAULT false,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    attempt_count integer DEFAULT 0,
    abstractness integer DEFAULT 50,
    seriousness integer DEFAULT 50,
    depth integer DEFAULT 50,
    poeticness integer DEFAULT 50,
    cover_image_url text,
    category_id uuid,
    popularity_score numeric DEFAULT 0,
    title_relevance integer DEFAULT 40,
    goofiness integer DEFAULT 50,
    color text
);


--
-- Name: reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reports (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    to_email text,
    from_email text,
    subject text,
    report_type text,
    main_result text,
    dimensions jsonb,
    confidence numeric,
    raw_ai_response jsonb,
    user_id uuid,
    raw_text text,
    parse_status text,
    core_vector jsonb DEFAULT '{}'::jsonb,
    social_vector jsonb DEFAULT '{}'::jsonb,
    extra_traits jsonb DEFAULT '[]'::jsonb,
    normalized_summary text,
    normalized_confidence numeric,
    schema_version text DEFAULT 'report_normalized_v1'::text,
    input_type text DEFAULT 'email'::text,
    image_url text,
    ocr_text text,
    ocr_confidence numeric,
    image_hash text
);


--
-- Name: reports_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.reports ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.reports_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: test_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    description text,
    icon text,
    sort_order integer DEFAULT 0,
    status text DEFAULT 'published'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: test_site_clicks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_site_clicks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    test_site_id uuid,
    clicked_at timestamp with time zone DEFAULT now(),
    referrer text,
    user_agent text
);


--
-- Name: test_sites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_sites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    category_id uuid,
    description text,
    long_description text,
    url text NOT NULL,
    logo_url text,
    cover_image_url text,
    tags jsonb DEFAULT '[]'::jsonb,
    language text DEFAULT 'zh'::text,
    country text,
    estimated_time text,
    difficulty text,
    pricing text,
    supports_email_report boolean DEFAULT false,
    email_report_note text,
    status text DEFAULT 'draft'::text,
    featured boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    estimated_minutes integer,
    click_count integer DEFAULT 0,
    popularity_score numeric DEFAULT 0,
    color text
);


--
-- Name: user_credits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_credits (
    user_id uuid NOT NULL,
    base_credits integer DEFAULT 0 NOT NULL,
    bonus_credits integer DEFAULT 0 NOT NULL,
    used_credits integer DEFAULT 0 NOT NULL,
    base_refilled_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT non_negative_used CHECK ((used_credits >= 0))
);


--
-- Name: user_profile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_profile (
    user_id uuid NOT NULL,
    selfid_profile text,
    summary text,
    core_vector jsonb DEFAULT '{}'::jsonb NOT NULL,
    social_vector jsonb DEFAULT '{}'::jsonb NOT NULL,
    report_count integer DEFAULT 0 NOT NULL,
    source_report_ids bigint[] DEFAULT '{}'::bigint[] NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    email text,
    display_name text,
    inbox_address text,
    inbound_email text,
    username text
);


--
-- Name: ai_prompt_versions ai_prompt_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_prompt_versions
    ADD CONSTRAINT ai_prompt_versions_pkey PRIMARY KEY (id);


--
-- Name: ai_prompts ai_prompts_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_prompts
    ADD CONSTRAINT ai_prompts_key_key UNIQUE (key);


--
-- Name: ai_prompts ai_prompts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_prompts
    ADD CONSTRAINT ai_prompts_pkey PRIMARY KEY (id);


--
-- Name: ai_usage_logs ai_usage_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_usage_logs
    ADD CONSTRAINT ai_usage_logs_pkey PRIMARY KEY (id);


--
-- Name: credit_events credit_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_events
    ADD CONSTRAINT credit_events_pkey PRIMARY KEY (id);


--
-- Name: quiz_attempt_answers quiz_attempt_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempt_answers
    ADD CONSTRAINT quiz_attempt_answers_pkey PRIMARY KEY (id);


--
-- Name: quiz_attempts quiz_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_pkey PRIMARY KEY (id);


--
-- Name: quiz_factors quiz_factors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_factors
    ADD CONSTRAINT quiz_factors_pkey PRIMARY KEY (id);


--
-- Name: quiz_factors quiz_factors_quiz_id_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_factors
    ADD CONSTRAINT quiz_factors_quiz_id_key_key UNIQUE (quiz_id, key);


--
-- Name: quiz_options quiz_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_options
    ADD CONSTRAINT quiz_options_pkey PRIMARY KEY (id);


--
-- Name: quiz_questions quiz_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT quiz_questions_pkey PRIMARY KEY (id);


--
-- Name: quiz_results quiz_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_results
    ADD CONSTRAINT quiz_results_pkey PRIMARY KEY (id);


--
-- Name: quiz_results quiz_results_quiz_id_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_results
    ADD CONSTRAINT quiz_results_quiz_id_key_key UNIQUE (quiz_id, key);


--
-- Name: quizzes quizzes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_pkey PRIMARY KEY (id);


--
-- Name: quizzes quizzes_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_slug_key UNIQUE (slug);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: test_categories test_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_categories
    ADD CONSTRAINT test_categories_pkey PRIMARY KEY (id);


--
-- Name: test_categories test_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_categories
    ADD CONSTRAINT test_categories_slug_key UNIQUE (slug);


--
-- Name: test_site_clicks test_site_clicks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_site_clicks
    ADD CONSTRAINT test_site_clicks_pkey PRIMARY KEY (id);


--
-- Name: test_sites test_sites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_sites
    ADD CONSTRAINT test_sites_pkey PRIMARY KEY (id);


--
-- Name: test_sites test_sites_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_sites
    ADD CONSTRAINT test_sites_slug_key UNIQUE (slug);


--
-- Name: user_credits user_credits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_credits
    ADD CONSTRAINT user_credits_pkey PRIMARY KEY (user_id);


--
-- Name: user_profile user_profile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profile
    ADD CONSTRAINT user_profile_pkey PRIMARY KEY (user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_inbox_address_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_inbox_address_key UNIQUE (inbox_address);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ai_prompts_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_prompts_active_idx ON public.ai_prompts USING btree (is_active);


--
-- Name: ai_prompts_key_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_prompts_key_idx ON public.ai_prompts USING btree (key);


--
-- Name: ai_prompts_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_prompts_updated_at_idx ON public.ai_prompts USING btree (updated_at DESC);


--
-- Name: ai_usage_logs_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_usage_logs_created_at_idx ON public.ai_usage_logs USING btree (created_at DESC);


--
-- Name: ai_usage_logs_feature_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_usage_logs_feature_idx ON public.ai_usage_logs USING btree (feature);


--
-- Name: ai_usage_logs_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_usage_logs_user_id_idx ON public.ai_usage_logs USING btree (user_id);


--
-- Name: idx_credit_events_dedup; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_credit_events_dedup ON public.credit_events USING btree (user_id, type, reference_id) WHERE (type = ANY (ARRAY['quiz_completed'::public.credit_event_type, 'quiz_approved'::public.credit_event_type]));


--
-- Name: idx_credit_events_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_credit_events_user ON public.credit_events USING btree (user_id, created_at DESC);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_users_username ON public.users USING btree (username) WHERE (username IS NOT NULL);


--
-- Name: quiz_attempts_quiz_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quiz_attempts_quiz_id_idx ON public.quiz_attempts USING btree (quiz_id);


--
-- Name: quiz_attempts_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quiz_attempts_user_id_idx ON public.quiz_attempts USING btree (user_id);


--
-- Name: quiz_factors_quiz_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quiz_factors_quiz_id_idx ON public.quiz_factors USING btree (quiz_id);


--
-- Name: quiz_options_quiz_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quiz_options_quiz_id_idx ON public.quiz_options USING btree (quiz_id);


--
-- Name: quiz_questions_quiz_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quiz_questions_quiz_id_idx ON public.quiz_questions USING btree (quiz_id);


--
-- Name: quiz_results_quiz_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quiz_results_quiz_id_idx ON public.quiz_results USING btree (quiz_id);


--
-- Name: quizzes_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quizzes_slug_idx ON public.quizzes USING btree (slug);


--
-- Name: quizzes_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quizzes_status_idx ON public.quizzes USING btree (status);


--
-- Name: reports_image_hash_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reports_image_hash_idx ON public.reports USING btree (image_hash);


--
-- Name: users_inbound_email_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_inbound_email_uidx ON public.users USING btree (lower(inbound_email));


--
-- Name: credit_events credit_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_events
    ADD CONSTRAINT credit_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: quiz_attempt_answers quiz_attempt_answers_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempt_answers
    ADD CONSTRAINT quiz_attempt_answers_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.quiz_attempts(id) ON DELETE CASCADE;


--
-- Name: quiz_attempt_answers quiz_attempt_answers_option_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempt_answers
    ADD CONSTRAINT quiz_attempt_answers_option_id_fkey FOREIGN KEY (option_id) REFERENCES public.quiz_options(id) ON DELETE CASCADE;


--
-- Name: quiz_attempt_answers quiz_attempt_answers_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempt_answers
    ADD CONSTRAINT quiz_attempt_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.quiz_questions(id) ON DELETE CASCADE;


--
-- Name: quiz_attempt_answers quiz_attempt_answers_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempt_answers
    ADD CONSTRAINT quiz_attempt_answers_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;


--
-- Name: quiz_attempts quiz_attempts_final_result_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_final_result_id_fkey FOREIGN KEY (final_result_id) REFERENCES public.quiz_results(id) ON DELETE SET NULL;


--
-- Name: quiz_attempts quiz_attempts_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;


--
-- Name: quiz_attempts quiz_attempts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: quiz_factors quiz_factors_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_factors
    ADD CONSTRAINT quiz_factors_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;


--
-- Name: quiz_options quiz_options_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_options
    ADD CONSTRAINT quiz_options_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.quiz_questions(id) ON DELETE CASCADE;


--
-- Name: quiz_options quiz_options_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_options
    ADD CONSTRAINT quiz_options_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;


--
-- Name: quiz_questions quiz_questions_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT quiz_questions_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;


--
-- Name: quiz_results quiz_results_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_results
    ADD CONSTRAINT quiz_results_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;


--
-- Name: quizzes quizzes_creator_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_creator_user_id_fkey FOREIGN KEY (creator_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: reports reports_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: test_site_clicks test_site_clicks_test_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_site_clicks
    ADD CONSTRAINT test_site_clicks_test_site_id_fkey FOREIGN KEY (test_site_id) REFERENCES public.test_sites(id) ON DELETE CASCADE;


--
-- Name: test_sites test_sites_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_sites
    ADD CONSTRAINT test_sites_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.test_categories(id);


--
-- Name: user_credits user_credits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_credits
    ADD CONSTRAINT user_credits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_profile user_profile_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profile
    ADD CONSTRAINT user_profile_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: test_site_clicks Anyone can insert clicks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert clicks" ON public.test_site_clicks FOR INSERT WITH CHECK (true);


--
-- Name: quiz_factors Anyone can read factors of published quizzes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read factors of published quizzes" ON public.quiz_factors FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.quizzes
  WHERE ((quizzes.id = quiz_factors.quiz_id) AND (quizzes.status = ANY (ARRAY['published'::text, 'sandbox'::text, 'submitting'::text]))))));


--
-- Name: quiz_options Anyone can read options of published quizzes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read options of published quizzes" ON public.quiz_options FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.quizzes
  WHERE ((quizzes.id = quiz_options.quiz_id) AND (quizzes.status = ANY (ARRAY['published'::text, 'sandbox'::text, 'submitting'::text]))))));


--
-- Name: test_categories Anyone can read published categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read published categories" ON public.test_categories FOR SELECT USING ((status = 'published'::text));


--
-- Name: quizzes Anyone can read published quizzes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read published quizzes" ON public.quizzes FOR SELECT USING ((status = ANY (ARRAY['published'::text, 'sandbox'::text, 'submitting'::text])));


--
-- Name: test_sites Anyone can read published test sites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read published test sites" ON public.test_sites FOR SELECT USING ((status = 'published'::text));


--
-- Name: quiz_questions Anyone can read questions of published quizzes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read questions of published quizzes" ON public.quiz_questions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.quizzes
  WHERE ((quizzes.id = quiz_questions.quiz_id) AND (quizzes.status = ANY (ARRAY['published'::text, 'sandbox'::text, 'submitting'::text]))))));


--
-- Name: quiz_results Anyone can read results of published quizzes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read results of published quizzes" ON public.quiz_results FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.quizzes
  WHERE ((quizzes.id = quiz_results.quiz_id) AND (quizzes.status = ANY (ARRAY['published'::text, 'sandbox'::text, 'submitting'::text]))))));


--
-- Name: quizzes Creator can delete own quizzes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Creator can delete own quizzes" ON public.quizzes FOR DELETE USING ((auth.uid() = creator_user_id));


--
-- Name: quizzes Creator can insert quizzes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Creator can insert quizzes" ON public.quizzes FOR INSERT WITH CHECK (((auth.uid() = creator_user_id) AND (status = 'draft'::text)));


--
-- Name: quiz_factors Creator can manage factors of own quizzes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Creator can manage factors of own quizzes" ON public.quiz_factors USING ((EXISTS ( SELECT 1
   FROM public.quizzes
  WHERE ((quizzes.id = quiz_factors.quiz_id) AND (quizzes.creator_user_id = auth.uid())))));


--
-- Name: quiz_options Creator can manage options of own quizzes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Creator can manage options of own quizzes" ON public.quiz_options USING ((EXISTS ( SELECT 1
   FROM public.quizzes
  WHERE ((quizzes.id = quiz_options.quiz_id) AND (quizzes.creator_user_id = auth.uid())))));


--
-- Name: quiz_questions Creator can manage questions of own quizzes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Creator can manage questions of own quizzes" ON public.quiz_questions USING ((EXISTS ( SELECT 1
   FROM public.quizzes
  WHERE ((quizzes.id = quiz_questions.quiz_id) AND (quizzes.creator_user_id = auth.uid())))));


--
-- Name: quiz_results Creator can manage results of own quizzes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Creator can manage results of own quizzes" ON public.quiz_results USING ((EXISTS ( SELECT 1
   FROM public.quizzes
  WHERE ((quizzes.id = quiz_results.quiz_id) AND (quizzes.creator_user_id = auth.uid())))));


--
-- Name: quizzes Creator can read own quizzes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Creator can read own quizzes" ON public.quizzes FOR SELECT USING ((auth.uid() = creator_user_id));


--
-- Name: quizzes Creator can update own quizzes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Creator can update own quizzes" ON public.quizzes FOR UPDATE USING ((auth.uid() = creator_user_id));


--
-- Name: quiz_attempts Users can delete own quiz attempts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own quiz attempts" ON public.quiz_attempts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: reports Users can delete own reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own reports" ON public.reports FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: quiz_attempt_answers Users can insert own attempt answers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own attempt answers" ON public.quiz_attempt_answers FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.quiz_attempts
  WHERE ((quiz_attempts.id = quiz_attempt_answers.attempt_id) AND (quiz_attempts.user_id = auth.uid())))));


--
-- Name: user_profile Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.user_profile FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: quiz_attempts Users can insert own quiz attempts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own quiz attempts" ON public.quiz_attempts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: reports Users can insert own reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own reports" ON public.reports FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: users Users can read own row; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own row" ON public.users FOR SELECT USING ((auth.uid() = id));


--
-- Name: quiz_attempt_answers Users can select own attempt answers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can select own attempt answers" ON public.quiz_attempt_answers FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.quiz_attempts
  WHERE ((quiz_attempts.id = quiz_attempt_answers.attempt_id) AND (quiz_attempts.user_id = auth.uid())))));


--
-- Name: user_profile Users can select own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can select own profile" ON public.user_profile FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: quiz_attempts Users can select own quiz attempts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can select own quiz attempts" ON public.quiz_attempts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: reports Users can select own reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can select own reports" ON public.reports FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_profile Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.user_profile FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: reports Users can update own reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own reports" ON public.reports FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: users Users can update own row; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own row" ON public.users FOR UPDATE USING ((auth.uid() = id));


--
-- Name: ai_prompts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_usage_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: credit_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.credit_events ENABLE ROW LEVEL SECURITY;

--
-- Name: quiz_attempt_answers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quiz_attempt_answers ENABLE ROW LEVEL SECURITY;

--
-- Name: quiz_attempts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

--
-- Name: quiz_factors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quiz_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: quiz_options; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;

--
-- Name: quiz_questions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

--
-- Name: quiz_results; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

--
-- Name: quizzes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

--
-- Name: reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

--
-- Name: test_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.test_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: test_site_clicks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.test_site_clicks ENABLE ROW LEVEL SECURITY;

--
-- Name: test_sites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.test_sites ENABLE ROW LEVEL SECURITY;

--
-- Name: user_credits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

--
-- Name: user_profile; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: user_credits users_read_own_credits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_read_own_credits ON public.user_credits FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: credit_events users_read_own_events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_read_own_events ON public.credit_events FOR SELECT USING ((auth.uid() = user_id));


--
-- PostgreSQL database dump complete
--

\unrestrict 0cxl8WIEXGzo32qt5SgQk47RZQ1EAhllcAGBq2ApnHOd01YycvI19VvIfsAUreg

