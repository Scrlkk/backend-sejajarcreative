CREATE TABLE IF NOT EXISTS core.content_category (
  id         SERIAL PRIMARY KEY,
  type_name  VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT now(),

  CONSTRAINT uq_content_category_name UNIQUE (type_name)
);
CREATE TABLE IF NOT EXISTS core.content_types (
  id         SERIAL PRIMARY KEY,
  type_name  VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT now(),

  CONSTRAINT uq_content_types_name UNIQUE (type_name)
);