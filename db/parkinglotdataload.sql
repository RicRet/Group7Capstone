-- PostGIS required
CREATE EXTENSION IF NOT EXISTS postgis;
DROP TABLE IF EXISTS parking_lots;
CREATE TABLE parking_lots (
    lot_id SERIAL PRIMARY KEY,
    description VARCHAR(60) NOT NULL,
    zone VARCHAR(10),
    fill VARCHAR(30),
    location GEOGRAPHY(POLYGON, 4326) NOT NULL
);
CREATE INDEX parking_lots_location_gix ON parking_lots USING GIST (location);
WITH fc AS (
    -- Paste the *entire* FeatureCollection JSON here
    SELECT $$ { "type" :"FeatureCollection",
        "features" :[
      {
        "type":"Feature",
        "properties":{"description":"Lot 1","zone":"A","fill":"rgb(255, 64, 64)"},
        "geometry":{"type":"Polygon","coordinates":[[[-97.14903524013884,33.21144942703165],
...] ] } } ] } $$::jsonb AS j
),
feat AS (
    SELECT jsonb_array_elements(j->'features') AS f
    FROM fc
)
INSERT INTO parking_lots (description, zone, fill, location)
SELECT f->'properties'->>'description' AS description,
    f->'properties'->>'zone' AS zone,
    f->'properties'->>'fill' AS fill,
    ST_SetSRID(ST_GeomFromGeoJSON(f->>'geometry'), 4326)::geography AS location
FROM feat
WHERE (f->'geometry'->>'type') = 'Polygon';