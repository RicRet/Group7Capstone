-- 1. Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
-- 2. Create the table to store building embeddings
CREATE TABLE IF NOT EXISTS gis.building_embeddings (
    embedding_id SERIAL PRIMARY KEY,
    building_id INT NOT NULL REFERENCES gis.buildings(building_id) ON DELETE CASCADE,
    embedding VECTOR(768),
    -- Corresponds to Google's text-embedding-004 model
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- 3. Create an index for efficient similarity searches
CREATE INDEX IF NOT EXISTS idx_building_embeddings_embedding ON gis.building_embeddings USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);
-- Optional: A unique constraint to prevent duplicate embeddings per building
ALTER TABLE gis.building_embeddings
ADD CONSTRAINT uq_building_id UNIQUE (building_id);