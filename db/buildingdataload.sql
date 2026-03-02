-- Load Buildings from buildings_colored.geojson (GeoJSON polygons)
-- 1) Create a temp table for raw json
DROP TABLE IF EXISTS tmp_buildings_geojson;
CREATE TEMP TABLE tmp_buildings_geojson (j jsonb);
-- 2) Paste the ENTIRE contents of buildings_colored.geojson below between $$$$ 
--    (in pgAdmin: open the geojson file, copy all, paste here)
INSERT INTO tmp_buildings_geojson (j)
VALUES ($$ PASTE_GEOJSON_HERE $$::jsonb);
-- 3) Insert features into gis.buildings
WITH feat AS (
    SELECT jsonb_array_elements(j->'features') AS f
    FROM tmp_buildings_geojson
)
INSERT INTO gis.buildings (name, description, type, fill, location)
SELECT f->'properties'->>'Name' AS name,
    f->'properties'->>'Name' AS description,
    f->'properties'->>'Building type' AS type,
    f->'properties'->>'fill' AS fill,
    ST_SetSRID(
        ST_GeomFromGeoJSON(f->>'geometry'),
        4326
    )::geography
FROM feat;