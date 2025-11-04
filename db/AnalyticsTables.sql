-- 1) Create a dedicated schema
CREATE SCHEMA IF NOT EXISTS analytics;
-- 2) (Optional) event types dimension (easy to extend without touching enums)
CREATE TABLE IF NOT EXISTS analytics.event_types (event_type TEXT PRIMARY KEY, description TEXT);
INSERT INTO analytics.event_types(event_type, description)
VALUES ('app_open', 'User opens app'),
    (
        'search',
        'User searches for a building or route'
    ),
    ('navigate', 'User starts navigation'),
    ('api_call', 'Backend API call'),
    ('error', 'App-side error') ON CONFLICT (event_type) DO NOTHING;
-- 3) User sessions (dummy for now)
CREATE TABLE IF NOT EXISTS analytics.user_sessions (
    session_id UUID PRIMARY KEY,
    user_id TEXT,
    device TEXT,
    app_version TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_time ON analytics.user_sessions(user_id, started_at DESC);
-- 4) Raw app events (one row per event)
CREATE TABLE IF NOT EXISTS analytics.app_events (
    event_id BIGSERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES analytics.user_sessions(session_id) ON DELETE CASCADE,
    occurred_at TIMESTAMPTZ NOT NULL,
    event_type TEXT NOT NULL REFERENCES analytics.event_types(event_type),
    latency_ms INT,
    success BOOLEAN,
    building_id INT,
    path_id INT,
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_app_events_time ON analytics.app_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_events_type_time ON analytics.app_events(event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_events_session_time ON analytics.app_events(session_id, occurred_at DESC);
-- 5) Minute-level aggregates (for Power BI / quick queries)
CREATE TABLE IF NOT EXISTS analytics.api_metrics_minute (
    bucket_minute TIMESTAMPTZ PRIMARY KEY,
    -- date_trunc('minute', occurred_at)
    req_count INT NOT NULL,
    error_count INT NOT NULL,
    avg_latency_ms NUMERIC,
    p95_latency_ms NUMERIC,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- 6) Convenience view: app activity per minute by type
CREATE OR REPLACE VIEW analytics.app_events_minute AS
SELECT date_trunc('minute', occurred_at) AS bucket_minute,
    event_type,
    COUNT(*) AS event_count,
    AVG(latency_ms) AS avg_latency_ms
FROM analytics.app_events
GROUP BY 1,
    2;