CREATE EXTENSION IF NOT EXISTS postgis;
CREATE SCHEMA IF NOT EXISTS gis;
SET search_path TO gis,
    public;
DROP TABLE IF EXISTS bicycle_parking;
CREATE TABLE bicycle_parking (
    bicycle_pk SERIAL PRIMARY KEY,
    fid INTEGER UNIQUE,
    location GEOGRAPHY(POINT, 4326) NOT NULL
);
CREATE INDEX bicycle_parking_location_gix ON bicycle_parking USING GIST (location);
WITH fc AS (
    SELECT $$ --Paste geojson here and delete comment before running
        $$::jsonb AS j
),
feat AS (
    SELECT jsonb_array_elements(j->'features') AS f
    FROM fc
)
INSERT INTO bicycle_parking (fid, location)
SELECT NULLIF(f->'properties'->>'FID', '')::int AS fid,
    ST_SetSRID(
        ST_Force2D(ST_GeomFromGeoJSON(f->>'geometry')),
        4326
    )::geography AS location
FROM feat ON CONFLICT (fid) DO
UPDATE
SET location = EXCLUDED.location;