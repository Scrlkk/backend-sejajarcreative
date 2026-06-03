CREATE TABLE IF NOT EXISTS core.pillars (
  id          SERIAL PRIMARY KEY,
  pillar_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMP DEFAULT now(),
  updated_at  TIMESTAMP DEFAULT now(),

  CONSTRAINT uq_pillars_name UNIQUE (pillar_name)
);
