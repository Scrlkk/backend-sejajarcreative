DO $$ BEGIN
  CREATE TYPE core.content_status AS ENUM (
    'draft',
    'in_review',
    'approved',
    'published'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS core.contents (
  id              SERIAL PRIMARY KEY,
  contract_id     INT NOT NULL,
  content_type_id INT NOT NULL,
  title           VARCHAR(255) NOT NULL,
  file_url        VARCHAR(500),
  description     TEXT,
  publish_date    TIMESTAMP,
  published_at    TIMESTAMP,
  status          core.content_status DEFAULT 'draft',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  deleted_at      TIMESTAMP,
  created_at      TIMESTAMP DEFAULT now(),
  updated_at      TIMESTAMP DEFAULT now(),

  CONSTRAINT fk_contents_contract
    FOREIGN KEY (contract_id) REFERENCES core.contracts (id),
  CONSTRAINT fk_contents_content_type
    FOREIGN KEY (content_type_id) REFERENCES core.content_types (id)
);

CREATE INDEX IF NOT EXISTS idx_contents_contract_status
  ON core.contents (contract_id, status);

CREATE TABLE IF NOT EXISTS core.contents_platforms (
  content_id  INT NOT NULL,
  platform_id INT NOT NULL,

  CONSTRAINT pk_contents_platforms PRIMARY KEY (content_id, platform_id),
  CONSTRAINT fk_cp_content
    FOREIGN KEY (content_id) REFERENCES core.contents (id) ON DELETE CASCADE,
  CONSTRAINT fk_cp_platform
    FOREIGN KEY (platform_id) REFERENCES core.platforms (id) ON DELETE CASCADE
);
