CREATE SCHEMA IF NOT EXISTS users;
SET search_path TO users, public;

-- Ensure required extensions are available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- Core user record
CREATE TABLE IF NOT EXISTS app_user (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ,
  password_hash TEXT NOT NULL -- SHA-256 hash
);

-- User saved routes (start/end are stored as PostGIS points)
CREATE TABLE IF NOT EXISTS user_saved_route (
  saved_route_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users.app_user(user_id) ON DELETE CASCADE,
  name TEXT,
  start_geom geometry(Point, 4326) NOT NULL,
  end_geom geometry(Point, 4326) NOT NULL,
  is_accessible BOOLEAN NOT NULL DEFAULT FALSE,
  length_m INTEGER,
  -- cached
  duration_s INTEGER,
  -- cached
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Friend relationships (single row per unordered pair)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'friend_status' AND n.nspname = 'users'
  ) THEN
    CREATE TYPE users.friend_status AS ENUM ('pending', 'accepted', 'blocked');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS app_friends (
  user_id UUID NOT NULL REFERENCES users.app_user(user_id) ON DELETE CASCADE,
  friend_user_id UUID NOT NULL REFERENCES users.app_user(user_id) ON DELETE CASCADE,
  status users.friend_status NOT NULL DEFAULT 'pending',
  requested_by UUID NOT NULL REFERENCES users.app_user(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, friend_user_id),
  CHECK (user_id <> friend_user_id)
);

-- Backfill/align columns if the table already existed
ALTER TABLE users.app_friends
  ADD COLUMN IF NOT EXISTS requested_by UUID REFERENCES users.app_user(user_id),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

UPDATE users.app_friends SET requested_by = COALESCE(requested_by, user_id);

ALTER TABLE users.app_friends
  ALTER COLUMN requested_by SET NOT NULL,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;

CREATE OR REPLACE FUNCTION users.app_friend_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_app_friend_touch_updated_at ON users.app_friends;
CREATE TRIGGER trg_app_friend_touch_updated_at
BEFORE UPDATE ON users.app_friends
FOR EACH ROW EXECUTE FUNCTION users.app_friend_touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_app_friend_status ON users.app_friends(status);
CREATE INDEX IF NOT EXISTS idx_app_friend_requested_by ON users.app_friends(requested_by);