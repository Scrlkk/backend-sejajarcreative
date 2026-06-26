import pool from "../../config/database.js";
import { parseDateRange } from "./dashboard.helpers.js";

const ACTIVE_CONTRACT = `
  co.is_active = true AND co.deleted_at IS NULL
`;

const ACTIVE_CLIENT = `
  c.is_active = true AND c.deleted_at IS NULL
`;

const calcEngagementRate = (views, likes, comments, shares) => {
  if (!views || views <= 0) return 0;
  return Math.round(((Number(likes || 0) + Number(comments || 0) + Number(shares || 0)) / views) * 1000) / 10;
};

export const getEngagementChart = async (query) => {
  const { from, to } = parseDateRange(query);
  const duration = to.getTime() - from.getTime();
  const prevFrom = new Date(from.getTime() - duration);
  const prevTo = from;

  const [totalsResult, seriesResult, prevTotalsResult] = await Promise.all([
    pool.query(
      `SELECT
         COALESCE(SUM(e.views), 0)::int AS views,
         COALESCE(SUM(e.likes), 0)::int AS likes,
         COALESCE(SUM(e.comments), 0)::int AS comments,
         COALESCE(SUM(e.shares), 0)::int AS shares
       FROM analytics.engagements e
       JOIN core.contents c ON c.id = e.content_id
       JOIN core.contracts co ON co.id = c.contract_id
       WHERE e.recorded_at >= $1 AND e.recorded_at < $2
         AND c.deleted_at IS NULL AND c.is_active = true
         AND co.deleted_at IS NULL AND co.is_active = true`,
      [from, to],
    ),
    pool.query(
      `SELECT
         DATE(e.recorded_at) AS date,
         SUM(e.views)::int AS views,
         SUM(e.likes)::int AS likes,
         SUM(e.comments)::int AS comments,
         SUM(e.shares)::int AS shares
       FROM analytics.engagements e
       JOIN core.contents c ON c.id = e.content_id
       JOIN core.contracts co ON co.id = c.contract_id
       WHERE e.recorded_at >= $1 AND e.recorded_at < $2
         AND c.deleted_at IS NULL AND c.is_active = true
         AND co.deleted_at IS NULL AND co.is_active = true
       GROUP BY DATE(e.recorded_at)
       ORDER BY date ASC`,
      [from, to],
    ),
    pool.query(
      `SELECT
         COALESCE(SUM(e.views), 0)::int AS views,
         COALESCE(SUM(e.likes), 0)::int AS likes,
         COALESCE(SUM(e.comments), 0)::int AS comments,
         COALESCE(SUM(e.shares), 0)::int AS shares
       FROM analytics.engagements e
       JOIN core.contents c ON c.id = e.content_id
       JOIN core.contracts co ON co.id = c.contract_id
       WHERE e.recorded_at >= $1 AND e.recorded_at < $2
         AND c.deleted_at IS NULL AND c.is_active = true
         AND co.deleted_at IS NULL AND co.is_active = true`,
      [prevFrom, prevTo],
    ),
  ]);

  const totals = totalsResult.rows[0];
  const prevTotals = prevTotalsResult.rows[0];

  return {
    metric: "engagement",
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
    totals: {
      views: totals.views,
      likes: totals.likes,
      comments: totals.comments,
      shares: totals.shares,
    },
    avg_engagement_rate: calcEngagementRate(
      totals.views,
      totals.likes,
      totals.comments,
      totals.shares,
    ),
    prev_totals: {
      views: prevTotals.views,
      likes: prevTotals.likes,
      comments: prevTotals.comments,
      shares: prevTotals.shares,
    },
    prev_avg_engagement_rate: calcEngagementRate(
      prevTotals.views,
      prevTotals.likes,
      prevTotals.comments,
      prevTotals.shares,
    ),
    series: seriesResult.rows.map((row) => ({
      date: row.date,
      views: row.views,
      likes: row.likes,
      comments: row.comments,
      shares: row.shares,
    })),
  };
};

export const getEngagementByPlatformChart = async (query) => {
  const { from, to } = parseDateRange(query);

  const chartMetric = ["views", "likes", "comments", "shares"].includes(query.chartMetric)
    ? query.chartMetric
    : "views";

  const granularity = ["daily", "weekly", "monthly"].includes(query.granularity)
    ? query.granularity
    : "daily";

  let dateField = `DATE(e.recorded_at)`;
  if (granularity === "weekly") {
    dateField = `DATE_TRUNC('week', e.recorded_at)`;
  } else if (granularity === "monthly") {
    dateField = `DATE_TRUNC('month', e.recorded_at)`;
  }

  // Fetch all active platforms
  const platformsResult = await pool.query(
    `SELECT id, platform_name, color_key
     FROM core.platforms
     WHERE is_active = true
     ORDER BY platform_name ASC`,
  );
  const platforms = platformsResult.rows;

  // Fetch metric_value per platform per date
  const seriesResult = await pool.query(
    `SELECT
       ${dateField} AS date,
       p.id AS platform_id,
       p.platform_name,
       p.color_key,
       SUM(e.${chartMetric})::int AS metric_value
     FROM analytics.engagements e
     JOIN core.contents c ON c.id = e.content_id
     JOIN core.platforms p ON p.id = c.platform_id
     JOIN core.contracts co ON co.id = c.contract_id
     WHERE e.recorded_at >= $1 AND e.recorded_at < $2
       AND c.deleted_at IS NULL AND c.is_active = true
       AND co.deleted_at IS NULL AND co.is_active = true
     GROUP BY date, p.id, p.platform_name, p.color_key
     ORDER BY date ASC, p.platform_name ASC`,
    [from, to],
  );

  // Fetch milestone events (contracts launched in this period)
  const milestonesResult = await pool.query(
    `SELECT contract_name, DATE(created_at) AS date
     FROM core.contracts
     WHERE created_at >= $1 AND created_at < $2
       AND deleted_at IS NULL AND is_active = true
     ORDER BY created_at ASC
     LIMIT 5`,
    [from, to],
  );
  const milestones = milestonesResult.rows.map((row) => {
    const d = new Date(row.date);
    return {
      date: typeof row.date === "string" ? row.date.slice(0, 10) : d.toISOString().slice(0, 10),
      label: row.contract_name,
    };
  });

  // Build a map of date -> { platform_name: metric_value (daily/weekly/monthly increment) }
  const dateMap = new Map();
  for (const row of seriesResult.rows) {
    const dateKey =
      typeof row.date === "string"
        ? row.date.slice(0, 10)
        : row.date.toISOString().slice(0, 10);
    if (!dateMap.has(dateKey)) dateMap.set(dateKey, {});
    dateMap.get(dateKey)[row.platform_name] = Number(row.metric_value);
  }

  // Build sorted series with all platforms per date (0 for missing dates)
  const platformNames = platforms.map((p) => p.platform_name);
  const sortedEntries = [...dateMap.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  );

  // Apply cumulative SUM — each point = total metric value recorded up to that date
  const runningSum = {};
  for (const name of platformNames) runningSum[name] = 0;

  const series = sortedEntries.map(([date, byPlatform]) => {
    const entry = { date };
    for (const name of platformNames) {
      runningSum[name] += byPlatform[name] ?? 0;
      entry[name] = runningSum[name];
    }
    return entry;
  });

  return {
    metric: "engagement_by_platform",
    chartMetric,
    granularity,
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
    platforms: platforms.map((p) => ({
      id: p.id,
      platform_name: p.platform_name,
      color_key: p.color_key,
    })),
    series,
    milestones,
  };
};

export const getContractsRevenueChart = async (query) => {
  const { from, to } = parseDateRange(query);

  const { rows } = await pool.query(
    `SELECT
       DATE(created_at) AS date,
       COALESCE(SUM(revenue), 0)::float AS revenue,
       COUNT(*)::int AS count
     FROM core.contracts
     WHERE deleted_at IS NULL
       AND is_active = true
       AND created_at >= $1
       AND created_at < $2
     GROUP BY DATE(created_at)
     ORDER BY date ASC`,
    [from, to],
  );

  const totalRevenue = rows.reduce((sum, row) => sum + Number(row.revenue), 0);

  return {
    metric: "contracts_revenue",
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
    total_revenue: Math.round(totalRevenue * 100) / 100,
    series: rows.map((row) => ({
      date: row.date,
      revenue: Number(row.revenue),
      count: row.count,
    })),
  };
};

export const getContractsByStatusChart = async (query) => {
  const { from, to } = parseDateRange(query);

  const { rows } = await pool.query(
    `SELECT
       status,
       COUNT(*)::int AS count,
       COALESCE(SUM(revenue), 0)::float AS revenue
     FROM core.contracts
     WHERE deleted_at IS NULL
       AND is_active = true
       AND created_at >= $1
       AND created_at < $2
     GROUP BY status
     ORDER BY status ASC`,
    [from, to],
  );

  return {
    metric: "contracts_by_status",
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
    breakdown: rows.map((row) => ({
      status: row.status,
      count: row.count,
      revenue: Number(row.revenue),
    })),
  };
};

export const getUsersByTasksChart = async () => {
  const { rows } = await pool.query(
    `SELECT
       u.id,
       u.full_name,
       t.status,
       COUNT(*)::int AS count
     FROM core.tasks t
     JOIN core.users u ON u.id = t.assigned_to
     WHERE t.deleted_at IS NULL
       AND u.is_active = true
       AND u.deleted_at IS NULL
     GROUP BY u.id, u.full_name, t.status
     ORDER BY u.full_name ASC, t.status ASC`,
  );

  const usersMap = new Map();

  for (const row of rows) {
    if (!usersMap.has(row.id)) {
      usersMap.set(row.id, {
        id: row.id,
        full_name: row.full_name,
        tasks: {},
        total: 0,
      });
    }
    const user = usersMap.get(row.id);
    user.tasks[row.status] = row.count;
    user.total += row.count;
  }

  return {
    metric: "users_by_tasks",
    users: [...usersMap.values()],
  };
};

export const getClientsTotalChart = async () => {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM core.clients
     WHERE is_active = true AND deleted_at IS NULL`,
  );

  return {
    metric: "clients_total",
    total: rows[0].total,
  };
};

export const getClientsNewChart = async (query) => {
  const { from, to } = parseDateRange(query, 30);

  const [totalResult, seriesResult] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS total
       FROM core.clients
       WHERE is_active = true
         AND deleted_at IS NULL
         AND created_at >= $1
         AND created_at < $2`,
      [from, to],
    ),
    pool.query(
      `SELECT
         DATE(created_at) AS date,
         COUNT(*)::int AS count
       FROM core.clients
       WHERE is_active = true
         AND deleted_at IS NULL
         AND created_at >= $1
         AND created_at < $2
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [from, to],
    ),
  ]);

  return {
    metric: "clients_new",
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
    total: totalResult.rows[0].total,
    series: seriesResult.rows,
  };
};

export const getClientsByActiveContractsChart = async () => {
  const { rows } = await pool.query(
    `SELECT
       c.id,
       c.client_name,
       c.company_name,
       COUNT(co.id)::int AS contract_count,
       COALESCE(SUM(co.revenue), 0)::float AS total_revenue
     FROM core.clients c
     JOIN core.contracts co ON co.client_id = c.id
     WHERE ${ACTIVE_CLIENT}
       AND ${ACTIVE_CONTRACT}
       AND co.status = 'active'
     GROUP BY c.id, c.client_name, c.company_name
     ORDER BY contract_count DESC, c.client_name ASC`,
  );

  return {
    metric: "clients_by_active_contracts",
    total_clients: rows.length,
    clients: rows.map((row) => ({
      id: row.id,
      client_name: row.client_name,
      company_name: row.company_name,
      contract_count: row.contract_count,
      total_revenue: Number(row.total_revenue),
    })),
  };
};

export const getClientsByCompletedContractsChart = async () => {
  const { rows } = await pool.query(
    `SELECT
       c.id,
       c.client_name,
       c.company_name,
       COUNT(co.id)::int AS contract_count,
       COALESCE(SUM(co.revenue), 0)::float AS total_revenue
     FROM core.clients c
     JOIN core.contracts co ON co.client_id = c.id
     WHERE ${ACTIVE_CLIENT}
       AND co.deleted_at IS NULL
       AND co.status = 'completed'
     GROUP BY c.id, c.client_name, c.company_name
     ORDER BY contract_count DESC, c.client_name ASC`,
  );

  return {
    metric: "clients_by_completed_contracts",
    total_clients: rows.length,
    clients: rows.map((row) => ({
      id: row.id,
      client_name: row.client_name,
      company_name: row.company_name,
      contract_count: row.contract_count,
      total_revenue: Number(row.total_revenue),
    })),
  };
};
