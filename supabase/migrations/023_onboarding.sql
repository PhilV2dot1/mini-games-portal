-- Migration: Onboarding System
-- Purpose: Track onboarding completion per user + award 50 XP on first login
-- Phase Z6.4

ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_users_onboarding ON users(onboarding_completed) WHERE onboarding_completed = FALSE;
