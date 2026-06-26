DO $$ BEGIN
  CREATE TYPE core.content_priority AS ENUM (
    'low',
    'medium',
    'high'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE core.content_status AS ENUM (
    'draft',
    'assigned',
    'on_progress',
    'review',
    'revision',
    'approved',
    'scheduled',
    'published',
    'overdue'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS core.contents (
  id                  SERIAL PRIMARY KEY,
  contract_id         INT NOT NULL,
  platform_id         INT NOT NULL,
  content_category_id INT NOT NULL,
  title               VARCHAR(255) NOT NULL,
  content_url         VARCHAR(500),
  objective           VARCHAR(500),
  target_audience     VARCHAR(255),
  description         TEXT,
  due_date            TIMESTAMP,
  published_at        TIMESTAMP,
  scheduled_at        TIMESTAMP,
  format              VARCHAR(50) DEFAULT 'Video',
  priority            core.content_priority DEFAULT 'medium',
  status              core.content_status DEFAULT 'draft',
  is_active           BOOLEAN NOT NULL DEFAULT true,
  deleted_at          TIMESTAMP,
  created_at          TIMESTAMP DEFAULT now(),
  updated_at          TIMESTAMP DEFAULT now(),

  CONSTRAINT fk_contents_contract
    FOREIGN KEY (contract_id) REFERENCES core.contracts (id),
  CONSTRAINT fk_contents_platform
    FOREIGN KEY (platform_id) REFERENCES core.platforms (id),
  CONSTRAINT fk_contents_category
    FOREIGN KEY (content_category_id) REFERENCES core.content_category (id)
);

CREATE INDEX IF NOT EXISTS idx_contents_contract_status
  ON core.contents (contract_id, status);

CREATE INDEX IF NOT EXISTS idx_contents_platform
  ON core.contents (platform_id);
