-- Migration: Add SSO fields to users table for Keycloak integration
-- Run against the longinventory database

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS cognito_id text,
  ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone;

-- Create unique index on cognito_id for SSO user lookup
CREATE UNIQUE INDEX IF NOT EXISTS users_cognito_id_key ON public.users (cognito_id) WHERE cognito_id IS NOT NULL;
