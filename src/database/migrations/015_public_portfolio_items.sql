CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id            SERIAL PRIMARY KEY,
  content_id    INT NOT NULL,
  is_featured   BOOLEAN DEFAULT false,
  display_order INT,
  created_at    TIMESTAMP DEFAULT now(),

  CONSTRAINT uq_portfolio_content
    UNIQUE (content_id),

  CONSTRAINT fk_portfolio_content
    FOREIGN KEY (content_id) REFERENCES core.contents (id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_portfolio_featured
  ON public.portfolio_items (is_featured);

CREATE INDEX IF NOT EXISTS idx_portfolio_display_order
  ON public.portfolio_items (display_order);