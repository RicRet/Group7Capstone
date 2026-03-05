CREATE SCHEMA IF NOT EXISTS users;
SET search_path TO users,
  public;
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
-- Table: users.user_saved_route
DROP TABLE IF EXISTS users.user_saved_route;
CREATE TABLE IF NOT EXISTS users.user_saved_route (
  saved_route_id uuid NOT NULL DEFAULT users.uuid_generate_v4(),
  user_id uuid NOT NULL,
  name text COLLATE pg_catalog."default",
  start_geom geometry(Point, 4326) NOT NULL,
  end_geom geometry(Point, 4326) NOT NULL,
  is_accessible boolean NOT NULL DEFAULT false,
  length_m integer,
  duration_s integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_saved_route_pkey PRIMARY KEY (saved_route_id),
  CONSTRAINT user_saved_route_user_id_fkey FOREIGN KEY (user_id) REFERENCES users.app_user (user_id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE
) TABLESPACE pg_default;
ALTER TABLE IF EXISTS users.user_saved_route OWNER to eagle;
-- Friend relationships (single row per unordered pair)
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE t.typname = 'friend_status'
    AND n.nspname = 'users'
) THEN CREATE TYPE users.friend_status AS ENUM ('pending', 'accepted', 'blocked');
END IF;
END $$;
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
UPDATE users.app_friends
SET requested_by = COALESCE(requested_by, user_id);
ALTER TABLE users.app_friends
ALTER COLUMN requested_by
SET NOT NULL,
  ALTER COLUMN created_at
SET NOT NULL,
  ALTER COLUMN updated_at
SET NOT NULL;
CREATE OR REPLACE FUNCTION users.app_friend_touch_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_app_friend_touch_updated_at ON users.app_friends;
CREATE TRIGGER trg_app_friend_touch_updated_at BEFORE
UPDATE ON users.app_friends FOR EACH ROW EXECUTE FUNCTION users.app_friend_touch_updated_at();
CREATE INDEX IF NOT EXISTS idx_app_friend_status ON users.app_friends(status);
CREATE INDEX IF NOT EXISTS idx_app_friend_requested_by ON users.app_friends(requested_by);
-- ---------------------------------------------------------------
-- Reminder / Schedule system
-- Stores places a user needs to be at a specific time & day(s).
-- Kept separate from user_saved_route because a reminder is a
-- destination + time slot, not a full A→B route.  The optional
-- saved_route_id FK allows a reminder to reference a saved route
-- for navigation convenience.
-- ---------------------------------------------------------------
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE t.typname = 'day_of_week'
    AND n.nspname = 'users'
) THEN CREATE TYPE users.day_of_week AS ENUM (
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday'
);
END IF;
END $$;
CREATE TABLE IF NOT EXISTS users.user_reminder (
  reminder_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users.app_user(user_id) ON DELETE CASCADE,
  -- Human-readable label, e.g. "CS 101", "Lab Section", "Office Hours"
  label TEXT NOT NULL,
  -- Where the user needs to be (matches GEOGRAPHY convention used in gis.* tables)
  destination_geom GEOGRAPHY(POINT, 4326) NOT NULL,
  -- Optional plain-text place name, e.g. "Chandler Hall 201"
  destination_label TEXT,
  -- Time of day the user needs to arrive
  remind_time TIME NOT NULL,
  -- One or more days this reminder recurs, e.g. '{monday,wednesday,friday}'
  days_of_week users.day_of_week [] NOT NULL,
  -- Optional date range bounding the reminder (e.g. semester window)
  active_from DATE,
  active_until DATE,
  -- Optional link to a saved route for quick navigation
  saved_route_id UUID REFERENCES users.user_saved_route(saved_route_id) ON DELETE
  SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE IF EXISTS users.user_reminder OWNER TO eagle;
-- Fast lookup of all reminders for a given user
CREATE INDEX IF NOT EXISTS idx_user_reminder_user_id ON users.user_reminder(user_id);
-- Spatial index on destination – matches GIST pattern used in GISIndexes.sql
CREATE INDEX IF NOT EXISTS idx_user_reminder_destination ON users.user_reminder USING GIST (destination_geom);
-- Efficient filtering by day(s) using the GIN operator class for arrays
CREATE INDEX IF NOT EXISTS idx_user_reminder_days ON users.user_reminder USING GIN (days_of_week);
-- Auto-bump updated_at on any row change
CREATE OR REPLACE FUNCTION users.user_reminder_touch_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_user_reminder_touch_updated_at ON users.user_reminder;
CREATE TRIGGER trg_user_reminder_touch_updated_at BEFORE
UPDATE ON users.user_reminder FOR EACH ROW EXECUTE FUNCTION users.user_reminder_touch_updated_at();
-- ---------------------------------------------------------------
ALTER TABLE users.app_user
ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
CREATE OR REPLACE FUNCTION users.app_user_touch_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_app_user_touch_updated_at ON users.app_user;
CREATE TRIGGER trg_app_user_touch_updated_at BEFORE
UPDATE ON users.app_user FOR EACH ROW EXECUTE FUNCTION users.app_user_touch_updated_at();