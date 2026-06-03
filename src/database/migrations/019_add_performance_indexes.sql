-- Performance indexes (supplemental)

CREATE INDEX IF NOT EXISTS idx_users_is_active_email
  ON core.users (email) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_contracts_client_status
  ON core.contracts (client_id, status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_due_date_pending
  ON core.tasks (due_date, status) WHERE status != 'done' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ta_assigned_status
  ON core.task_assignments (assigned_to, status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_contents_contract_status
  ON core.contents (contract_id, status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_ta_reviewer
  ON core.reviews (task_assignment_id, reviewer_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_expires
  ON auth.refresh_tokens (user_id, expires_at);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires
  ON auth.refresh_tokens (expires_at);

CREATE INDEX IF NOT EXISTS idx_engagements_recorded
  ON analytics.engagements (recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_portfolio_featured_order
  ON public.portfolio_items (is_featured, display_order);
