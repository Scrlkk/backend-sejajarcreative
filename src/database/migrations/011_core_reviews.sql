CREATE TABLE IF NOT EXISTS core.contract_teams (
  contract_id INT NOT NULL,
  user_id     INT NOT NULL,
  created_at  TIMESTAMP DEFAULT now(),

  CONSTRAINT pk_contract_teams PRIMARY KEY (contract_id, user_id),
  CONSTRAINT fk_ct_contract
    FOREIGN KEY (contract_id) REFERENCES core.contracts (id) ON DELETE CASCADE,
  CONSTRAINT fk_ct_user
    FOREIGN KEY (user_id) REFERENCES core.users (id) ON DELETE CASCADE
);
