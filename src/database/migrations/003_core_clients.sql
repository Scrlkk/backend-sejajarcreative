CREATE TABLE IF NOT EXISTS core.clients (
  id            SERIAL PRIMARY KEY,
  client_name   VARCHAR(255) NOT NULL,
  company_name  VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  created_at    TIMESTAMP DEFAULT now()
);