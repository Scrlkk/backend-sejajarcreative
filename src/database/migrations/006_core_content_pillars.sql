CREATE TABLE IF NOT EXISTS core.content_pillars (
  id          SERIAL PRIMARY KEY,
  pillar_name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at  TIMESTAMP DEFAULT now(),

  CONSTRAINT uq_content_pillars_name UNIQUE (pillar_name)
);