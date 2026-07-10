import pool from "#config/database.js";
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

export const getEngagementChart = async (userOrOwnerId, roleOrQuery, optionalQuery) => {
  let user = null;
  let role = null;
  let queryObj = roleOrQuery;

  if (typeof userOrOwnerId === "object" && userOrOwnerId !== null) {
    user = userOrOwnerId;
    role = roleOrQuery;
    queryObj = optionalQuery;
  } else {
    const ownerId = userOrOwnerId;
    if (ownerId) {
      user = { id: ownerId };
      role = "owner";
    }
  }

  const { from, to } = parseDateRange(queryObj);
  const duration = to.getTime() - from.getTime();
  const prevFrom = new Date(from.getTime() - duration);
  const prevTo = from;

  let scopeCondition = "";
  let scopeParam = null;

  if (user && role) {
    if (role === "owner") {
      scopeCondition = " AND co.created_by = $3";
      scopeParam = user.id;
    } else if (role === "content_lead") {
      scopeCondition = " AND co.lead_by = $3";
      scopeParam = user.id;
    } else if (role === "admin_social_media") {
      scopeCondition = " AND EXISTS (SELECT 1 FROM core.tasks t WHERE t.content_id = c.id AND t.assigned_to = $3 AND t.deleted_at IS NULL)";
      scopeParam = user.id;
    }
  }

  let totalsSql = `SELECT
         COALESCE(SUM(e.views), 0)::int AS views,
         COALESCE(SUM(e.likes), 0)::int AS likes,
         COALESCE(SUM(e.comments), 0)::int AS comments,
         COALESCE(SUM(e.shares), 0)::int AS shares
       FROM analytics.engagements e
       JOIN core.contents c ON c.id = e.content_id
       JOIN core.contracts co ON co.id = c.contract_id
       WHERE e.recorded_at >= $1 AND e.recorded_at < $2
         AND c.deleted_at IS NULL AND c.is_active = true
         AND co.deleted_at IS NULL AND co.is_active = true`;
  const totalsParams = [from, to];
  if (scopeParam !== null) {
    totalsSql += scopeCondition;
    totalsParams.push(scopeParam);
  }

  let seriesSql = `SELECT
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
         AND co.deleted_at IS NULL AND co.is_active = true`;
  const seriesParams = [from, to];
  if (scopeParam !== null) {
    seriesSql += scopeCondition;
    seriesParams.push(scopeParam);
  }
  seriesSql += ` GROUP BY DATE(e.recorded_at) ORDER BY date ASC`;

  let prevTotalsSql = `SELECT
         COALESCE(SUM(e.views), 0)::int AS views,
         COALESCE(SUM(e.likes), 0)::int AS likes,
         COALESCE(SUM(e.comments), 0)::int AS comments,
         COALESCE(SUM(e.shares), 0)::int AS shares
       FROM analytics.engagements e
       JOIN core.contents c ON c.id = e.content_id
       JOIN core.contracts co ON co.id = c.contract_id
       WHERE e.recorded_at >= $1 AND e.recorded_at < $2
         AND c.deleted_at IS NULL AND c.is_active = true
         AND co.deleted_at IS NULL AND co.is_active = true`;
  const prevTotalsParams = [prevFrom, prevTo];
  if (scopeParam !== null) {
    prevTotalsSql += scopeCondition;
    prevTotalsParams.push(scopeParam);
  }

  const [totalsResult, seriesResult, prevTotalsResult] = await Promise.all([
    pool.query(totalsSql, totalsParams),
    pool.query(seriesSql, seriesParams),
    pool.query(prevTotalsSql, prevTotalsParams),
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

export const getEngagementByPlatformChart = async (userOrOwnerId, roleOrQuery, optionalQuery) => {
  let user = null;
  let role = null;
  let queryObj = roleOrQuery;

  if (typeof userOrOwnerId === "object" && userOrOwnerId !== null) {
    user = userOrOwnerId;
    role = roleOrQuery;
    queryObj = optionalQuery;
  } else {
    const ownerId = userOrOwnerId;
    if (ownerId) {
      user = { id: ownerId };
      role = "owner";
    }
  }

  const { from, to } = parseDateRange(queryObj);

  const chartMetric = ["views", "likes", "comments", "shares"].includes(queryObj.chartMetric)
    ? queryObj.chartMetric
    : "views";

  const granularity = ["daily", "weekly", "monthly"].includes(queryObj.granularity)
    ? queryObj.granularity
    : "daily";

  let dateField = `DATE(e.recorded_at)`;
  if (granularity === "weekly") {
    dateField = `DATE_TRUNC('week', e.recorded_at)`;
  } else if (granularity === "monthly") {
    dateField = `DATE_TRUNC('month', e.recorded_at)`;
  }

  let scopeCondition = "";
  let scopeParam = null;

  if (user && role) {
    if (role === "owner") {
      scopeCondition = " AND co.created_by = $3";
      scopeParam = user.id;
    } else if (role === "content_lead") {
      scopeCondition = " AND co.lead_by = $3";
      scopeParam = user.id;
    } else if (role === "admin_social_media") {
      scopeCondition = " AND EXISTS (SELECT 1 FROM core.tasks t WHERE t.content_id = c.id AND t.assigned_to = $3 AND t.deleted_at IS NULL)";
      scopeParam = user.id;
    }
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
  let seriesSql = `SELECT
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
       AND co.deleted_at IS NULL AND co.is_active = true`;
  const seriesParams = [from, to];
  if (scopeParam !== null) {
    seriesSql += scopeCondition;
    seriesParams.push(scopeParam);
  }
  seriesSql += ` GROUP BY date, p.id, p.platform_name, p.color_key ORDER BY date ASC, p.platform_name ASC`;

  // Fetch milestone events (contracts launched in this period)
  let milestonesSql = `SELECT contract_name, DATE(created_at) AS date
     FROM core.contracts co
     WHERE created_at >= $1 AND created_at < $2
       AND deleted_at IS NULL AND is_active = true`;
  const milestonesParams = [from, to];
  if (scopeParam !== null) {
    // For milestones, we filter based on contract access
    if (role === "owner") {
      milestonesSql += " AND co.created_by = $3";
      milestonesParams.push(scopeParam);
    } else if (role === "content_lead") {
      milestonesSql += " AND co.lead_by = $3";
      milestonesParams.push(scopeParam);
    } else if (role === "admin_social_media") {
      // Contracts where admin social media is a staff or has task assignments
      milestonesSql += ` AND EXISTS (
        SELECT 1 FROM core.tasks t 
        WHERE t.content_id IN (SELECT id FROM core.contents WHERE contract_id = co.id)
          AND t.assigned_to = $3 
          AND t.deleted_at IS NULL
      )`;
      milestonesParams.push(scopeParam);
    }
  }
  milestonesSql += ` ORDER BY created_at ASC LIMIT 5`;

  const [seriesResult, milestonesResult] = await Promise.all([
    pool.query(seriesSql, seriesParams),
    pool.query(milestonesSql, milestonesParams),
  ]);
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

export const getContractsRevenueChart = async (ownerId, query) => {
  const { from, to } = parseDateRange(query);

  let sql = `SELECT
       DATE(created_at) AS date,
       COALESCE(SUM(revenue), 0)::float AS revenue,
       COUNT(*)::int AS count
     FROM core.contracts
     WHERE deleted_at IS NULL
       AND is_active = true
       AND created_at >= $1
       AND created_at < $2`;
  const params = [from, to];
  if (ownerId) {
    sql += ` AND created_by = $3`;
    params.push(ownerId);
  }
  sql += ` GROUP BY DATE(created_at) ORDER BY date ASC`;

  const { rows } = await pool.query(sql, params);

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

export const getContractsByStatusChart = async (ownerId, query) => {
  const { from, to } = parseDateRange(query);

  let sql = `SELECT
       status,
       COUNT(*)::int AS count,
       COALESCE(SUM(revenue), 0)::float AS revenue
     FROM core.contracts
     WHERE deleted_at IS NULL
       AND is_active = true
       AND created_at >= $1
       AND created_at < $2`;
  const params = [from, to];
  if (ownerId) {
    sql += ` AND created_by = $3`;
    params.push(ownerId);
  }
  sql += ` GROUP BY status ORDER BY status ASC`;

  const { rows } = await pool.query(sql, params);

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

export const getUsersByTasksChart = async (ownerId) => {
  let sql = `SELECT
       u.id,
       u.full_name,
       t.status,
       COUNT(*)::int AS count
     FROM core.tasks t
     JOIN core.users u ON u.id = t.assigned_to
     JOIN core.contents c ON c.id = t.content_id
     JOIN core.contracts co ON co.id = c.contract_id
     WHERE t.deleted_at IS NULL
       AND u.is_active = true
       AND u.deleted_at IS NULL`;
  const params = [];
  if (ownerId) {
    sql += ` AND co.created_by = $1`;
    params.push(ownerId);
  }
  sql += ` GROUP BY u.id, u.full_name, t.status ORDER BY u.full_name ASC, t.status ASC`;

  const { rows } = await pool.query(sql, params);

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

export const getClientsTotalChart = async (ownerId) => {
  let sql = `SELECT COUNT(*)::int AS total
     FROM core.clients cl
     WHERE cl.is_active = true AND cl.deleted_at IS NULL`;
  const params = [];
  if (ownerId) {
    sql += ` AND EXISTS (
      SELECT 1 FROM core.contracts co
      WHERE co.client_id = cl.id AND co.created_by = $1 AND co.deleted_at IS NULL AND co.is_active = true
    )`;
    params.push(ownerId);
  }

  const { rows } = await pool.query(sql, params);

  return {
    metric: "clients_total",
    total: rows[0].total,
  };
};

export const getClientsNewChart = async (ownerId, query) => {
  const { from, to } = parseDateRange(query, 30);

  let totalSql = `SELECT COUNT(*)::int AS total
       FROM core.clients cl
       WHERE cl.is_active = true
         AND cl.deleted_at IS NULL
         AND cl.created_at >= $1
         AND cl.created_at < $2`;
  const totalParams = [from, to];
  if (ownerId) {
    totalSql += ` AND EXISTS (
      SELECT 1 FROM core.contracts co
      WHERE co.client_id = cl.id AND co.created_by = $3 AND co.deleted_at IS NULL AND co.is_active = true
    )`;
    totalParams.push(ownerId);
  }

  let seriesSql = `SELECT
         DATE(cl.created_at) AS date,
         COUNT(*)::int AS count
       FROM core.clients cl
       WHERE cl.is_active = true
         AND cl.deleted_at IS NULL
         AND cl.created_at >= $1
         AND cl.created_at < $2`;
  const seriesParams = [from, to];
  if (ownerId) {
    seriesSql += ` AND EXISTS (
      SELECT 1 FROM core.contracts co
      WHERE co.client_id = cl.id AND co.created_by = $3 AND co.deleted_at IS NULL AND co.is_active = true
    )`;
    seriesParams.push(ownerId);
  }
  seriesSql += ` GROUP BY DATE(cl.created_at) ORDER BY date ASC`;

  const [totalResult, seriesResult] = await Promise.all([
    pool.query(totalSql, totalParams),
    pool.query(seriesSql, seriesParams),
  ]);

  return {
    metric: "clients_new",
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
    total: totalResult.rows[0].total,
    series: seriesResult.rows,
  };
};

export const getClientsByActiveContractsChart = async (ownerId) => {
  let sql = `SELECT
       c.id,
       c.client_name,
       c.company_name,
       COUNT(co.id)::int AS contract_count,
       COALESCE(SUM(co.revenue), 0)::float AS total_revenue
     FROM core.clients c
     JOIN core.contracts co ON co.client_id = c.id
     WHERE c.is_active = true AND c.deleted_at IS NULL
       AND co.is_active = true AND co.deleted_at IS NULL
       AND co.status = 'active'`;
  const params = [];
  if (ownerId) {
    sql += ` AND co.created_by = $1`;
    params.push(ownerId);
  }
  sql += ` GROUP BY c.id, c.client_name, c.company_name ORDER BY contract_count DESC, c.client_name ASC`;

  const { rows } = await pool.query(sql, params);

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

export const getClientsByCompletedContractsChart = async (ownerId) => {
  let sql = `SELECT
       c.id,
       c.client_name,
       c.company_name,
       COUNT(co.id)::int AS contract_count,
       COALESCE(SUM(co.revenue), 0)::float AS total_revenue
     FROM core.clients c
     JOIN core.contracts co ON co.client_id = c.id
     WHERE c.is_active = true AND c.deleted_at IS NULL
       AND co.deleted_at IS NULL
       AND co.status = 'completed'`;
  const params = [];
  if (ownerId) {
    sql += ` AND co.created_by = $1`;
    params.push(ownerId);
  }
  sql += ` GROUP BY c.id, c.client_name, c.company_name ORDER BY contract_count DESC, c.client_name ASC`;

  const { rows } = await pool.query(sql, params);

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
