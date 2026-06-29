-- =============================================================================
-- BizPilot AI — Migration 002: user_settings
-- =============================================================================
-- Creates the per-user settings table for storing API keys (encrypted column
-- names reserved for future pgcrypto / Supabase Vault upgrade) and notification
-- preferences. RLS is enforced so each user can only read and write their own
-- row. Reuses the set_updated_at() trigger function installed by migration 001.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_settings (
  id                          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     uuid        REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  groq_api_key_enc            text,
  serper_api_key_enc          text,
  notify_pipeline_complete    boolean     NOT NULL DEFAULT true,
  notify_daily_summary        boolean     NOT NULL DEFAULT false,
  notify_new_reply            boolean     NOT NULL DEFAULT true,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

-- Fast lookup by user
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id
  ON public.user_settings (user_id);

-- ---------------------------------------------------------------------------
-- Trigger — keep updated_at fresh on every row update
-- ---------------------------------------------------------------------------
-- The set_updated_at() function was created in migration 001:
--   CREATE OR REPLACE FUNCTION public.set_updated_at()
--   RETURNS trigger AS $$
--   BEGIN
--     NEW.updated_at = now();
--     RETURN NEW;
--   END;
--   $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_user_settings_set_updated_at ON public.user_settings;
CREATE TRIGGER trg_user_settings_set_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (idempotent — safe to re-run)
DROP POLICY IF EXISTS "user_settings_select_own"   ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_insert_own"   ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_update_own"   ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_delete_own"   ON public.user_settings;

-- Users can read their own row only
CREATE POLICY "user_settings_select_own"
  ON public.user_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own row only
CREATE POLICY "user_settings_insert_own"
  ON public.user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own row only
CREATE POLICY "user_settings_update_own"
  ON public.user_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own row only
CREATE POLICY "user_settings_delete_own"
  ON public.user_settings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Convenience: auto-create a settings row on signup so the UI never has to
-- handle a "row not found" state for a brand new user.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_auth_user_created_settings ON auth.users;
CREATE TRIGGER trg_on_auth_user_created_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_settings();
