import pool from "../../config/database.js";
import { parseDateRange } from "./dashboard.helpers.js";

const ACTIVE_CONTENT = `c.deleted_at IS NULL AND c.is_active = true`;

export const getContentLeadSummary = async () => {
  const [contractsResult, contentsResult] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS active
       FROM core.contracts
       WHERE status = 'active'
         AND is_active = true
         AND deleted_at IS NULL`,
    ),
    pool.query(
      `SELECT
         COUNT(c.id)::int AS total,
         COUNT(c.id) FILTER (WHERE c.status = 'on_progress')::int AS on_progress,
         COUNT(c.id) FILTER (WHERE c.status = 'published')::int AS published
       FROM core.contents c
       JOIN core.contracts co ON co.id = c.contract_id
       WHERE c.deleted_at IS NULL AND c.is_active = true
         AND co.deleted_at IS NULL AND co.is_active = true`,
    ),
  ]);

  const contents = contentsResult.rows[0];

  return {
    contracts: {
      active: contractsResult.rows[0].active,
    },
    contents: {
      total: contents.total,
      on_progress: contents.on_progress,
      published: contents.published,
    },
  };
};

export const getContentTimelineChart = async (query) => {
  const { from, to } = parseDateRange(query);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 50, 1), 100);

  const { rows } = await pool.query(
    `SELECT c.id, c.status, c.created_at
     FROM core.contents c
     JOIN core.contracts co ON co.id = c.contract_id
     WHERE c.deleted_at IS NULL AND c.is_active = true
       AND co.deleted_at IS NULL AND co.is_active = true
       AND c.created_at >= $1
       AND c.created_at < $2
     ORDER BY c.created_at DESC
     LIMIT $3`,
    [from, to, limit],
  );

  return {
    metric: "content_timeline",
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
    items: rows,
  };
};

export const getContentByStatusDateChart = async (query) => {
  const { from, to } = parseDateRange(query);

  const { rows } = await pool.query(
    `SELECT
       DATE(c.created_at) AS date,
       c.status,
       COUNT(*)::int AS count
     FROM core.contents c
     JOIN core.contracts co ON co.id = c.contract_id
     WHERE c.deleted_at IS NULL AND c.is_active = true
       AND co.deleted_at IS NULL AND co.is_active = true
       AND c.created_at >= $1
       AND c.created_at < $2
     GROUP BY DATE(c.created_at), c.status
     ORDER BY date ASC, c.status ASC`,
    [from, to],
  );

  const byDate = new Map();

  for (const row of rows) {
    const dateKey =
      row.date instanceof Date
        ? row.date.toISOString().slice(0, 10)
        : String(row.date).slice(0, 10);

    if (!byDate.has(dateKey)) {
      byDate.set(dateKey, { date: dateKey, statuses: {}, total: 0 });
    }
    const entry = byDate.get(dateKey);
    entry.statuses[row.status] = row.count;
    entry.total += row.count;
  }

  return {
    metric: "content_by_status_date",
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
    series: [...byDate.values()],
    breakdown: rows.map((row) => ({
      date:
        row.date instanceof Date
          ? row.date.toISOString().slice(0, 10)
          : String(row.date).slice(0, 10),
      status: row.status,
      count: row.count,
    })),
  };
};

export const getPillarsUsageChart = async () => {
  const { rows } = await pool.query(
    `SELECT
       p.id,
       p.pillar_name,
       COUNT(c.id)::int AS count
     FROM core.pillars p
     LEFT JOIN core.content_pillars cp ON cp.pillar_id = p.id
     LEFT JOIN core.contents c
       ON c.id = cp.content_id AND c.deleted_at IS NULL AND c.is_active = true
       AND EXISTS (
         SELECT 1 FROM core.contracts co
         WHERE co.id = c.contract_id
           AND co.deleted_at IS NULL
           AND co.is_active = true
       )
     WHERE p.is_active = true
     GROUP BY p.id, p.pillar_name
     ORDER BY count DESC, p.pillar_name ASC`,
  );

  const total = rows.reduce((sum, row) => sum + row.count, 0);

  const pillars = rows
    .filter((row) => row.count > 0)
    .map((row) => ({
      id: row.id,
      pillar_name: row.pillar_name,
      count: row.count,
      percent: total > 0 ? Math.round((row.count / total) * 1000) / 10 : 0,
    }));

  return {
    metric: "pillars_usage",
    total_contents: total,
    pillars,
  };
};

export const getReviewsListWidget = async (query = {}) => {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 50);

  const [countResult, listResult] = await Promise.all([
    pool.query(
      `SELECT COUNT(cr.id)::int AS total
       FROM core.content_reviews cr
       JOIN core.contents c ON c.id = cr.content_id
       JOIN core.contracts co ON co.id = c.contract_id
       WHERE cr.deleted_at IS NULL
         AND c.deleted_at IS NULL AND c.is_active = true
         AND co.deleted_at IS NULL AND co.is_active = true`,
    ),
    pool.query(
      `SELECT
         cr.id,
         cr.content_id,
         c.contract_id,
         c.title AS content_title,
         cr.reviewer_id,
         u.full_name AS reviewer_name,
         LEFT(cr.feedback, 200) AS feedback_preview,
         cr.reviewed_at,
         cr.created_at
       FROM core.content_reviews cr
       JOIN core.contents c ON c.id = cr.content_id
       JOIN core.contracts co ON co.id = c.contract_id
       JOIN core.users u ON u.id = cr.reviewer_id
       WHERE cr.deleted_at IS NULL
         AND c.deleted_at IS NULL AND c.is_active = true
         AND co.deleted_at IS NULL AND co.is_active = true
       ORDER BY cr.created_at DESC
       LIMIT $1`,
      [limit],
    ),
  ]);

  return {
    widget: "reviews-list",
    total: countResult.rows[0].total,
    reviews: listResult.rows,
  };
};
