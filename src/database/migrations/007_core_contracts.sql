DO $$ BEGIN
  CREATE TYPE core.contract_status AS ENUM (
    'active',
    'completed',
    'cancelled',
    'overdue'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS core.contracts (
  id            SERIAL PRIMARY KEY,
  client_id     INT NOT NULL,
  contract_code VARCHAR(100) NOT NULL,
  contract_name VARCHAR(255) NOT NULL,
  description   TEXT,
  start_date    DATE,
  end_date      DATE,
  revenue       DECIMAL(15,2),
  status        core.contract_status DEFAULT 'active',
  created_by    INT NOT NULL,
  lead_by       INT NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  deleted_at    TIMESTAMP,
  created_at    TIMESTAMP DEFAULT now(),
  updated_at    TIMESTAMP DEFAULT now(),

  CONSTRAINT fk_contracts_client
    FOREIGN KEY (client_id) REFERENCES core.clients (id),
  CONSTRAINT fk_contracts_created_by
    FOREIGN KEY (created_by) REFERENCES core.users (id),
  CONSTRAINT fk_contracts_lead_by
    FOREIGN KEY (lead_by) REFERENCES core.users (id),
  CONSTRAINT uq_contracts_code UNIQUE (contract_code),
  CONSTRAINT chk_contracts_dates
    CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_contracts_code
  ON core.contracts (contract_code);

CREATE INDEX IF NOT EXISTS idx_contracts_client_status
  ON core.contracts (client_id, status);

CREATE INDEX IF NOT EXISTS idx_contracts_name
  ON core.contracts (contract_name);

CREATE INDEX IF NOT EXISTS idx_contracts_created_by
  ON core.contracts (created_by);

CREATE INDEX IF NOT EXISTS idx_contracts_lead_by
  ON core.contracts (lead_by);
