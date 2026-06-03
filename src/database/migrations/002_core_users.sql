CREATE TABLE IF NOT EXISTS core.roles (
  id         SERIAL PRIMARY KEY,
  role_name  VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT now(),

  CONSTRAINT uq_roles_name UNIQUE (role_name)
);

CREATE TABLE IF NOT EXISTS core.users (
  id         SERIAL PRIMARY KEY,
  full_name  VARCHAR(255) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  password   VARCHAR(255) NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON core.users (email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON core.users (is_active);

CREATE TABLE IF NOT EXISTS core.user_roles (
  id      SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  role_id INT NOT NULL,

  CONSTRAINT fk_user_roles_user
    FOREIGN KEY (user_id) REFERENCES core.users (id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_role
    FOREIGN KEY (role_id) REFERENCES core.roles (id) ON DELETE CASCADE,
  CONSTRAINT uq_user_roles UNIQUE (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON core.user_roles (user_id);
