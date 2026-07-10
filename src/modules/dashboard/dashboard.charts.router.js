import AppError from "#utils/AppError.js";
import * as contentLeadService from "./dashboard.content-lead.service.js";
import * as ownerCharts from "./dashboard.charts.service.js";
import * as staffService from "./dashboard.staff.service.js";

export const OWNER_METRICS = [
  "engagement",
  "engagement_by_platform",
  "contracts_revenue",
  "contracts_by_status",
  "users_by_tasks",
  "clients_total",
  "clients_new",
  "clients_by_active_contracts",
  "clients_by_completed_contracts",
];

export const CONTENT_LEAD_METRICS = [
  "content_timeline",
  "content_by_status_date",
  "pillars_usage",
];

export const STAFF_METRICS = [
  "tasks_by_status",
  "comments_revision",
];

export const ALL_CHART_METRICS = [
  ...OWNER_METRICS,
  ...CONTENT_LEAD_METRICS,
  ...STAFF_METRICS,
];

const METRIC_ROLES = {
  engagement: ["owner", "content_lead", "admin_social_media", "superadmin"],
  engagement_by_platform: ["owner", "content_lead", "admin_social_media", "superadmin"],
  contracts_revenue: ["owner", "superadmin"],
  contracts_by_status: ["owner", "superadmin"],
  users_by_tasks: ["owner", "superadmin"],
  clients_total: ["owner", "superadmin"],
  clients_new: ["owner", "superadmin"],
  clients_by_active_contracts: ["owner", "superadmin"],
  clients_by_completed_contracts: ["owner", "superadmin"],
  content_timeline: ["content_lead", "superadmin"],
  content_by_status_date: ["owner", "content_lead", "admin_social_media", "superadmin"],
  pillars_usage: ["owner", "content_lead", "admin_social_media", "superadmin"],
  tasks_by_status: ["script_writer", "content_editor", "admin_social_media", "superadmin"],
  comments_revision: ["script_writer", "content_editor", "admin_social_media", "superadmin"],
};

export const assertMetricAccess = (role, metric) => {
  if (!ALL_CHART_METRICS.includes(metric)) {
    throw new AppError(`Metric "${metric}" tidak dikenali`, 422);
  }

  const allowed = METRIC_ROLES[metric];
  if (!allowed?.includes(role)) {
    throw new AppError(
      `Metric "${metric}" tidak tersedia untuk role "${role}"`,
      403,
    );
  }
};

export const getChartByMetric = async (user, role, query) => {
  const { metric } = query;
  assertMetricAccess(role, metric);

  const scopeId = role === "superadmin" ? null : user.id;

  switch (metric) {
    case "engagement":
      return ownerCharts.getEngagementChart(user, role, query);
    case "engagement_by_platform":
      return ownerCharts.getEngagementByPlatformChart(user, role, query);
    case "contracts_revenue":
      return ownerCharts.getContractsRevenueChart(scopeId, query);
    case "contracts_by_status":
      return ownerCharts.getContractsByStatusChart(scopeId, query);
    case "users_by_tasks":
      return ownerCharts.getUsersByTasksChart(scopeId);
    case "clients_total":
      return ownerCharts.getClientsTotalChart(scopeId);
    case "clients_new":
      return ownerCharts.getClientsNewChart(scopeId, query);
    case "clients_by_active_contracts":
      return ownerCharts.getClientsByActiveContractsChart(scopeId);
    case "clients_by_completed_contracts":
      return ownerCharts.getClientsByCompletedContractsChart(scopeId);
    case "content_timeline":
      return contentLeadService.getContentTimelineChart(user, role, query);
    case "content_by_status_date":
      return contentLeadService.getContentByStatusDateChart(user, role, query);
    case "pillars_usage":
      return contentLeadService.getPillarsUsageChart(user, role);
    case "tasks_by_status":
      // superadmin: null → semua task; staff: userId → task miliknya
      return staffService.getTasksByStatusChart(role === "superadmin" ? null : user.id);
    case "comments_revision":
      return staffService.getCommentsRevisionChart(
        role === "superadmin" ? null : user.id,
        query
      );
    default:
      throw new AppError(`Metric "${metric}" belum diimplementasi`, 501);
  }
};
