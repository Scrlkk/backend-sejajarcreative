CREATE TABLE IF NOT EXISTS core.platforms (
  id            SERIAL PRIMARY KEY,
  platform_name VARCHAR(100) NOT NULL,
  color_key     VARCHAR(20) DEFAULT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMP DEFAULT now(),
  updated_at    TIMESTAMP DEFAULT now(),

  CONSTRAINT uq_platforms_name UNIQUE (platform_name)
);