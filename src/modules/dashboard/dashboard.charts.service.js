import pool from "../../config/database.js";
import { parseDateRange } from "./dashboard.helpers.js";

const ACTIVE_CONTRACT = `
  co.is_active = true AND co.deleted_at IS NULL
`;

const ACTIVE_CLIENT = `
  c.is_active = true AND c.deleted_at IS NULL
`;

const calcEngagementRate = (views, likes, shares) => {
  if (!views || views <= 0) return 0;
  return Math.round(((likes + shares) / views) * 1000) / 10;
};

export const getEngagementChart = async (query) => {
  const { from, to } = parseDateRange(query);

  const [totalsResult, seriesResult] = await Promise.all([
    pool.query(
      `SELECT
         COALESCE(SUM(views), 0)::int AS views,
         COALESCE(SUM(likes), 0)::int AS likes,
         COALESCE(SUM(shares), 0)::int AS shares
       FROM analytics.engagements
       WHERE recorded_at >= $1 AND recorded_at < $2`,
      [from, to],
    ),
    pool.query(
      `SELECT
         DATE(recorded_at) AS date,
         SUM(views)::int AS views,
         SUM(likes)::int AS likes,
         SUM(shares)::int AS shares
       FROM analytics.engagements
       WHERE recorded_at >= $1 AND recorded_at < $2
       GROUP BY DATE(recorded_at)
       ORDER BY date ASC`,
      [from, to],
    ),
  ]);

  const totals = totalsResult.rows[0];

  return {
    metric: "engagement",
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
    totals: {
      views: totals.views,
      likes: totals.likes,
      shares: totals.shares,
    },
    avg_engagement_rate: calcEngagementRate(
      totals.views,
      totals.likes,
      totals.shares,
    ),
    series: seriesResult.rows.map((row) => ({
      date: row.date,
      views: row.views,
      likes: row.likes,
      shares: row.shares,
    })),
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
