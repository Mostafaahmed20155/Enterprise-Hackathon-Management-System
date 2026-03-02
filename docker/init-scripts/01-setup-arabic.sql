-- Initialize PostgreSQL for Arabic text support
-- This script runs automatically when the container starts

-- Ensure UTF-8 encoding
ALTER DATABASE ehms SET client_encoding TO 'UTF8';

-- Enable full-text search for Arabic (future use)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Create custom text search configuration for Arabic (basic)
-- Note: Full Arabic text search requires additional dictionaries
-- For now, we'll use simple indexing on JSONB fields
