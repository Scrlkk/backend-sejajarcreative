CREATE INDEX IF NOT EXISTS idx_users_is_active_email
  ON core.users (email) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_contracts_client_active
  ON core.contracts (client_id, status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_deadline_pending
  ON core.tasks (deadline, status) WHERE status NOT IN ('published','approved') AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_active
  ON core.tasks (assigned_to, status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_contents_contract_active
  ON core.contents (contract_id, status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_contents_platform_active
  ON core.contents (platform_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_content_reviews_active
  ON core.content_reviews (content_id, reviewer_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_expires
  ON auth.refresh_tokens (user_id, expires_at);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires
  ON auth.refresh_tokens (expires_at);

CREATE INDEX IF NOT EXISTS idx_engagements_recorded
  ON analytics.engagements (recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_portfolio_featured_order
  ON public.portfolio_items (is_featured, display_order);
