CREATE TABLE IF NOT EXISTS core.content_category (
  id         SERIAL PRIMARY KEY,
  type_name  VARCHAR(100) NOT NULL,
  color_key  VARCHAR(20) DEFAULT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  CONSTRAINT uq_content_category_name UNIQUE (type_name)
);
CREATE TABLE IF NOT EXISTS core.content_types (
  id         SERIAL PRIMARY KEY,
  type_name  VARCHAR(100) NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  CONSTRAINT uq_content_types_name UNIQUE (type_name)
);