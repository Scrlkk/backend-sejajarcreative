import pool from "#config/database.js";
import AppError from "#utils/AppError.js";
import { getChartByMetric } from "./dashboard.charts.router.js";
import { getWidget } from "./dashboard.widgets.service.js";
import { getContentLeadSummary } from "./dashboard.content-lead.service.js";
import { getStaffSummary, getSocialMediaSummary } from "./dashboard.staff.service.js";
import {
  getRoleBreakdown,
  getSessionStats,
  getStorageUsage,
  getTotalActiveUsers,
  resolvePrimaryRole,
} from "./dashboard.helpers.js";


const getOwnerSummary = async (ownerId) => {
  const [contractsResult, usersResult, contentsResult, clientsResult] =
    await Promise.all([
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'active')::int AS active,
           COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
           COUNT(*) FILTER (WHERE status = 'overdue')::int AS overdue,
           COALESCE(SUM(revenue) FILTER (WHERE status = 'active'), 0)::float AS total_revenue
         FROM core.contracts
         WHERE is_active = true AND deleted_at IS NULL AND created_by = $1`,
        [ownerId],
      ),
      pool.query(
        `SELECT COUNT(DISTINCT u.id)::int AS total
         FROM core.users u
         JOIN core.user_roles ur ON ur.user_id = u.id
         JOIN core.roles r ON r.id = ur.role_id
         WHERE u.is_active = true
           AND u.deleted_at IS NULL
           AND r.role_name NOT IN ('superadmin', 'owner')
           AND EXISTS (
             SELECT 1 FROM core.contracts co
             LEFT JOIN core.contract_teams ct ON ct.contract_id = co.id
             WHERE co.created_by = $1 
               AND co.is_active = true 
               AND co.deleted_at IS NULL
               AND (co.lead_by = u.id OR ct.user_id = u.id)
           )`,
        [ownerId],
      ),
      pool.query(
        `SELECT COUNT(c.id)::int AS total
         FROM core.contents c
         JOIN core.contracts co ON co.id = c.contract_id
         WHERE c.status = 'published'
           AND c.deleted_at IS NULL AND c.is_active = true
           AND co.deleted_at IS NULL AND co.is_active = true
           AND co.created_by = $1`,
        [ownerId],
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total
         FROM core.clients cl
         WHERE is_active = true AND deleted_at IS NULL
           AND EXISTS (
             SELECT 1 FROM core.contracts co
             WHERE co.client_id = cl.id 
               AND co.created_by = $1 
               AND co.deleted_at IS NULL 
               AND co.is_active = true
           )`,
        [ownerId],
      ),
    ]);

  const contracts = contractsResult.rows[0];

  return {
    contracts: {
      active: contracts.active,
      total_revenue: Number(contracts.total_revenue),
      by_status: {
        active: contracts.active,
        completed: contracts.completed,
        overdue: contracts.overdue,
      },
    },
    users: {
      total: usersResult.rows[0].total,
    },
    contents: {
      published: contentsResult.rows[0].total,
    },
    clients: {
      total: clientsResult.rows[0].total,
    },
  };
};

const getSuperadminSummary = async () => {
  const [totalUsers, sessions, roles] = await Promise.all([
    getTotalActiveUsers(),
    getSessionStats(),
    getRoleBreakdown(),
  ]);

  return {
    users: {
      total: totalUsers,
      online: sessions.online_users,
    },
    roles,
    sessions: {
      active: sessions.active,
    },
  };
};

export const getSummary = async (user, queryRole = null) => {
  const role = resolvePrimaryRole(user, queryRole);

  switch (role) {
    case "superadmin":
      return getSuperadminSummary();
    case "owner":
      return getOwnerSummary(user.id);
    case "content_lead":
      return getContentLeadSummary(user.id);
    case "script_writer":
    case "content_editor":
      return getStaffSummary(user.id);
    case "admin_social_media":
      return getSocialMediaSummary(user.id);
    default:
      throw new AppError(
        `Dashboard summary untuk role "${role}" belum tersedia (fase berikutnya)`,
        501,
      );
  }
};

export const getCharts = async (user, query = {}) => {
  const role = resolvePrimaryRole(user, query.role);
  return getChartByMetric(user, role, query);
};

export const getWidgets = async (user, name, query = {}) => {
  return getWidget(user, name, query);
};

export const getSystem = async () => {
  const [storage, sessions] = await Promise.all([
    getStorageUsage(),
    getSessionStats(),
  ]);

  return {
    uptime_seconds: Math.floor(process.uptime()),
    storage,
    sessions: {
      active: sessions.active,
      online_users: sessions.online_users,
    },
  };
};
