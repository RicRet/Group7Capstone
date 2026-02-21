-- Ensure the schema exists
CREATE SCHEMA IF NOT EXISTS gis;
SET search_path TO gis,
    public;
-- Buildings table
CREATE TABLE buildings (
    building_id SERIAL PRIMARY KEY,
    name VARCHAR(60),
    description VARCHAR(60),
    type VARCHAR(30),
    location GEOGRAPHY(POINT, 4326)
);
-- Paths table
CREATE TABLE paths (
    path_id SERIAL PRIMARY KEY,
    description VARCHAR(60),
    type VARCHAR(30),
    accessibility_path_type INT,
    path GEOGRAPHY(LINESTRING, 4326)
);
-- Bus stops table
CREATE TABLE bus_stops (
    stop_id SERIAL PRIMARY KEY,
    description VARCHAR(60),
    location GEOGRAPHY(POINT, 4326)
);
-- Parking lots table
CREATE TABLE parking_lots (
    lot_id SERIAL PRIMARY KEY,
    description VARCHAR(60),
    location GEOGRAPHY(POLYGON, 4326)
);
-- Entrances table
CREATE TABLE IF NOT EXISTS entrances (
    entrance_pk SERIAL PRIMARY KEY,
    entrance_id VARCHAR(60) UNIQUE,
    entrance_name VARCHAR(120),
    entrance_accessible BOOLEAN DEFAULT false,
    location GEOGRAPHY(POINT, 4326)
);