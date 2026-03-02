CREATE EXTENSION IF NOT EXISTS postgis;
CREATE SCHEMA IF NOT EXISTS gis;
SET search_path TO gis,
    public;
DROP TABLE IF EXISTS emergency_phones;
CREATE TABLE emergency_phones (
    phone_pk SERIAL PRIMARY KEY,
    objectid INTEGER UNIQUE,
    location GEOGRAPHY(POINT, 4326) NOT NULL
);
CREATE INDEX emergency_phones_location_gix ON emergency_phones USING GIST (location);
WITH fc AS (
    -- Paste the *entire* FeatureCollection JSON here
    SELECT $$ PASTE_EMERGENCY_PHONES_GEOJSON_HERE $$::jsonb AS j
),
feat AS (
    SELECT jsonb_array_elements(j->'features') AS f
    FROM fc
)
INSERT INTO emergency_phones (objectid, location)
SELECT NULLIF(f->'properties'->>'OBJECTID', '')::int AS objectid,
    ST_SetSRID(
        ST_Force2D(ST_GeomFromGeoJSON(f->>'geometry')),
        4326
    )::geography AS location
FROM feat ON CONFLICT (objectid) DO
UPDATE
SET location = EXCLUDED.location;