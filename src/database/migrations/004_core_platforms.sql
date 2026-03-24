CREATE TABLE IF NOT EXISTS core.platforms (
  id            SERIAL PRIMARY KEY,
  platform_name VARCHAR(100) NOT NULL,
  created_at    TIMESTAMP DEFAULT now(),

  CONSTRAINT uq_platforms_name UNIQUE (platform_name)
);