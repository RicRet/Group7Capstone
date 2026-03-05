-- db/buildingdataload.sql (paste-style like parkinglotdataload.sql)
-- PostGIS required
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE SCHEMA IF NOT EXISTS gis;
SET search_path TO gis,
    public;
DROP TABLE IF EXISTS buildings;
CREATE TABLE buildings (
    building_id SERIAL PRIMARY KEY,
    name VARCHAR(120),
    description VARCHAR(255),
    type VARCHAR(60),
    fill VARCHAR(30),
    location GEOGRAPHY(MULTIPOLYGON, 4326) NOT NULL
);
CREATE INDEX buildings_location_gix ON buildings USING GIST (location);
WITH fc AS (
    -- Paste the *entire* FeatureCollection JSON here
    SELECT $$ PASTE_BUILDINGS_GEOJSON_HERE $$::jsonb AS j
),
feat AS (
    SELECT jsonb_array_elements(j->'features') AS f
    FROM fc
)
INSERT INTO buildings (
        name,
        description,
        type,
        fill,
        location
    )
SELECT f->'properties'->>'name' AS name,
    f->'properties'->>'description' AS description,
    f->'properties'->>'type' AS type,
    f->'properties'->>'fill' AS fill,
    ST_Multi(
        ST_SetSRID(ST_GeomFromGeoJSON(f->>'geometry'), 4326)
    )::geography
FROM feat;