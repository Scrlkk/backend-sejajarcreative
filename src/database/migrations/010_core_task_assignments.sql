CREATE TABLE IF NOT EXISTS core.contracts_platforms (
  contract_id INT NOT NULL,
  platform_id INT NOT NULL,

  CONSTRAINT pk_contracts_platforms PRIMARY KEY (contract_id, platform_id),
  CONSTRAINT fk_cp_contract
    FOREIGN KEY (contract_id) REFERENCES core.contracts (id) ON DELETE CASCADE,
  CONSTRAINT fk_cp_platform
    FOREIGN KEY (platform_id) REFERENCES core.platforms (id) ON DELETE CASCADE
);
