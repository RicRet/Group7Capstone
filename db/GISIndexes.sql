CREATE INDEX IF NOT EXISTS idx_buildings_location ON gis.buildings USING GIST (location);
CREATE INDEX idx_paths_path ON paths USING GIST (path);
CREATE INDEX idx_bus_stops_location ON bus_stops USING GIST (location);
CREATE INDEX idx_parking_lots_location ON parking_lots USING GIST (location);
CREATE INDEX idx_entrances_location ON entrances USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_bicycle_parking_location ON gis.bicycle_parking USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_emergency_phones_location ON gis.emergency_phones USING GIST (location);