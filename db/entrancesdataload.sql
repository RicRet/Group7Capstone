-- db/entrancesdataload.sql
-- Run with psql. Reads db/entrances.geojson from disk (no copy/paste).
\
set ON_ERROR_STOP on \
set geojson_path 'db/entrances.geojson' BEGIN;
-- Optional: wipe and reload clean (uncomment if desired)
-- TRUNCATE TABLE gis.entrances RESTART IDENTITY;
DROP TABLE IF EXISTS tmp_entrances_lines;
CREATE TEMP TABLE tmp_entrances_lines (line text);
-- Load the geojson file line-by-line into temp table (works for multi-line JSON)
\ copy tmp_entrances_lines(line)
FROM :'geojson_path' WITH (FORMAT text);
WITH fc AS (
    SELECT string_agg(line, E'\n')::jsonb AS j
    FROM tmp_entrances_lines
),
feat AS (
    SELECT jsonb_array_elements(j->'features') AS f
    FROM fc
)
INSERT INTO gis.entrances (
        entrance_id,
        entrance_name,
        entrance_accessible,
        location
    )
SELECT f->'properties'->>'entrance_id' AS entrance_id,
    f->'properties'->>'entrance_name' AS entrance_name,
    CASE
        WHEN lower(
            coalesce(f->'properties'->>'entrance_accessible', 'false')
        ) IN ('true', 't', '1', 'yes', 'y') THEN true
        ELSE false
    END AS entrance_accessible,
    ST_SetSRID(ST_GeomFromGeoJSON(f->>'geometry'), 4326)::geography AS location
FROM feat
WHERE (f->'geometry'->>'type') = 'Point' ON CONFLICT (entrance_id) DO
UPDATE
SET entrance_name = EXCLUDED.entrance_name,
    entrance_accessible = EXCLUDED.entrance_accessible,
    location = EXCLUDED.location;
COMMIT;