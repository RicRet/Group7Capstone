-- db/entrancesdataload.sql (paste-style like parkinglotdataload.sql)
-- PostGIS required
CREATE EXTENSION IF NOT EXISTS postgis;
-- Put entrances in the same place your GIS tables live
CREATE SCHEMA IF NOT EXISTS gis;
SET search_path TO gis,
    public;
DROP TABLE IF EXISTS entrances;
CREATE TABLE entrances (
    entrance_pk SERIAL PRIMARY KEY,
    entrance_id VARCHAR(60) UNIQUE,
    entrance_name VARCHAR(120),
    entrance_accessible BOOLEAN DEFAULT false,
    location GEOGRAPHY(POINT, 4326) NOT NULL
);
CREATE INDEX entrances_location_gix ON entrances USING GIST (location);
WITH fc AS (
    -- Paste the *entire* FeatureCollection JSON here
    SELECT $$ PASTE_ENTRANCES_GEOJSON_HERE $$::jsonb AS j
),
feat AS (
    SELECT jsonb_array_elements(j->'features') AS f
    FROM fc
)
INSERT INTO entrances (
        entrance_id,
        entrance_name,
        entrance_accessible,
        location
    )
SELECT f->'properties'->>'entrance_id' AS entrance_id,
    f->'properties'->>'entrance_name' AS entrance_name,
    CASE
        WHEN lower(f->'properties'->>'entrance_accessible') = 'true' THEN true
        ELSE false
    END AS entrance_accessible,
    ST_SetSRID(ST_GeomFromGeoJSON(f->>'geometry'), 4326)::geography
FROM feat ON CONFLICT (entrance_id) DO
UPDATE
SET entrance_name = EXCLUDED.entrance_name,
    entrance_accessible = EXCLUDED.entrance_accessible,
    location = EXCLUDED.location;