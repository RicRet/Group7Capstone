CREATE TABLE app_user(
  user_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email          TEXT,
  display_name   TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at   TIMESTAMPTZ,
  password_hash TEXT NOT NULL --SHA_256
);


CREATE TABLE user_saved_route (
  saved_route_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
  name           TEXT,
  start_geom     geometry(Point,4326) NOT NULL,
  end_geom       geometry(Point,4326) NOT NULL,
  is_accessible  BOOLEAN NOT NULL DEFAULT FALSE,
  length_m       INTEGER,                     -- cached
  duration_s     INTEGER,                     -- cached
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

