-- Migration: Adicionar campos ricos à tabela properties
-- Todos os campos são nullable (sem DEFAULT obrigatório) para não quebrar registros existentes
-- Execute: psql $DATABASE_URL -f add_rich_property_fields.sql

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS useful_area        NUMERIC,
  ADD COLUMN IF NOT EXISTS land_area          NUMERIC,
  ADD COLUMN IF NOT EXISTS service_area       NUMERIC,
  ADD COLUMN IF NOT EXISTS property_subtype   VARCHAR,
  ADD COLUMN IF NOT EXISTS property_condition VARCHAR,
  ADD COLUMN IF NOT EXISTS floor_number       INTEGER,
  ADD COLUMN IF NOT EXISTS total_floors       INTEGER,
  ADD COLUMN IF NOT EXISTS units_per_floor    INTEGER,
  ADD COLUMN IF NOT EXISTS unit_number        VARCHAR,
  ADD COLUMN IF NOT EXISTS block              VARCHAR,
  ADD COLUMN IF NOT EXISTS year_built         INTEGER,
  ADD COLUMN IF NOT EXISTS sun_position       VARCHAR,
  ADD COLUMN IF NOT EXISTS furnished_status   VARCHAR,
  ADD COLUMN IF NOT EXISTS lavabos            INTEGER,
  ADD COLUMN IF NOT EXISTS fire_insurance     NUMERIC,
  ADD COLUMN IF NOT EXISTS accepts_financing  BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS accepts_fgts       BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS accepts_exchange   BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS condo_name         VARCHAR,
  ADD COLUMN IF NOT EXISTS condo_units        INTEGER,
  ADD COLUMN IF NOT EXISTS condo_administrator VARCHAR,
  ADD COLUMN IF NOT EXISTS builder            VARCHAR,
  ADD COLUMN IF NOT EXISTS amenities_unit     JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS amenities_condo    JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS nearby_subway      BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS subway_distance_m  INTEGER,
  ADD COLUMN IF NOT EXISTS seo_score          INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seo_keywords       TEXT,
  ADD COLUMN IF NOT EXISTS canonical_url      VARCHAR;

-- Comentário: migration segura, todos os campos são opcionais (nullable ou com default)
-- Registros existentes não são afetados
