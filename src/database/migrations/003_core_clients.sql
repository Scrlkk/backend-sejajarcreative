CREATE TABLE IF NOT EXISTS core.clients (
  id            SERIAL PRIMARY KEY,
  client_name   VARCHAR(255) NOT NULL,
  company_name  VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  deleted_at    TIMESTAMP,
  created_at    TIMESTAMP DEFAULT now(),
  updated_at    TIMESTAMP DEFAULT now()
);
