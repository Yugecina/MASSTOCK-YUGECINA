-- ============================================================================
-- MIGRATION 004: Synchronize Supabase Auth Users with public.users Table
-- ============================================================================
--
-- This migration creates PostgreSQL triggers that automatically synchronize
-- users from the Supabase Auth system (auth.users) to the application's
-- public.users table. This ensures that whenever a new user is created,
-- updated, or deleted in Supabase Auth, the public.users table stays in sync.
--
-- Problem: When creating users via Supabase Auth, they only appear in
-- auth.users table (Supabase's system table), not in public.users.
--
-- Solution: Use AFTER INSERT/DELETE triggers to automatically sync.
--
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

-- ============================================================================
-- FUNCTION 1: Handle new user creation in auth.users
-- ============================================================================
-- This function is triggered whenever a new user is inserted into auth.users.
-- It automatically creates a corresponding entry in public.users.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the new user into public.users with default values
  -- If user already exists (ON CONFLICT), update the email
  INSERT INTO public.users (
    id,
    email,
    created_at,
    updated_at,
    status,
    role
  ) VALUES (
    NEW.id,                    -- Use Supabase Auth UUID as PK
    NEW.email,
    NEW.created_at,
    NOW(),
    'active',                  -- Default status is active
    'user'                     -- Default role is user
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- TRIGGER 1: on_auth_user_created
-- ============================================================================
-- Executes handle_new_user() whenever a new user is inserted into auth.users

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- FUNCTION 2: Handle user email updates in auth.users
-- ============================================================================
-- This function is triggered when a user's email is updated in auth.users.
-- It synchronizes the email change to public.users.

CREATE OR REPLACE FUNCTION public.handle_auth_user_updated()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the email in public.users if it changed
  UPDATE public.users
  SET email = NEW.email,
      updated_at = NOW()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- TRIGGER 2: on_auth_user_updated
-- ============================================================================
-- Executes handle_auth_user_updated() whenever a user is updated in auth.users

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.handle_auth_user_updated();

-- ============================================================================
-- FUNCTION 3: Handle user deletion in auth.users
-- ============================================================================
-- This function is triggered when a user is deleted from auth.users.
-- It automatically deletes the corresponding entry in public.users.

CREATE OR REPLACE FUNCTION public.handle_auth_user_deleted()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete the user from public.users
  DELETE FROM public.users WHERE id = OLD.id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- TRIGGER 3: on_auth_user_deleted
-- ============================================================================
-- Executes handle_auth_user_deleted() whenever a user is deleted from auth.users

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;

CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_deleted();

-- ============================================================================
-- TEST: Verify all triggers are created
-- ============================================================================
-- Run this query to verify the migration worked:
-- SELECT trigger_name, event_object_table, action_timing, event_manipulation
-- FROM information_schema.triggers
-- WHERE event_object_table = 'users' AND trigger_schema = 'auth'
-- ORDER BY trigger_name;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
-- DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user();
-- DROP FUNCTION IF EXISTS public.handle_auth_user_updated();
-- DROP FUNCTION IF EXISTS public.handle_auth_user_deleted();
